from __future__ import annotations

import os
import subprocess
import tempfile
import threading
import logging
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from app.db.session import DATABASE_URL, engine
from app.core.schema import ensure_database_schema
from sqlalchemy.engine import make_url

_logger = logging.getLogger(__name__)
_database_lock = threading.RLock()
REQUIRED_BACKUP_TABLES = {
    "configuration",
    "dailychange",
    "dividendpayment",
    "dividendreinvestment",
    "history",
    "investment",
    "purchase",
    "sale",
}


class DatabaseBackupError(Exception):
    pass


@contextmanager
def database_write_guard():
    with _database_lock:
        yield


def database_write_dependency():
    with database_write_guard():
        yield


def _connection_details() -> tuple[list[str], dict[str, str]]:
    url = make_url(DATABASE_URL)
    if not url.database or not url.username:
        raise DatabaseBackupError("The database connection is incomplete")

    arguments = [
        "--host",
        url.host or "localhost",
        "--port",
        str(url.port or 5432),
        "--username",
        url.username,
        "--dbname",
        url.database,
    ]
    environment = os.environ.copy()
    if url.password:
        environment["PGPASSWORD"] = url.password
    return arguments, environment


def _run(
    command: list[str],
    environment: dict[str, str],
    *,
    timeout: int = 180,
) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(
            command,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
            timeout=timeout,
        )
    except OSError as exc:
        raise DatabaseBackupError(
            f"Could not run {command[0]}. PostgreSQL client tools are unavailable."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise DatabaseBackupError(
            f"{command[0]} timed out while restoring the database"
        ) from exc

    if result.returncode != 0:
        detail = result.stderr.strip().splitlines()
        message = detail[-1] if detail else f"{command[0]} failed"
        raise DatabaseBackupError(message)

    return result


def _dump_to(path: Path) -> None:
    connection, environment = _connection_details()
    _logger.info("Creating database dump at %s", path)
    _run(
        [
            "pg_dump",
            *connection,
            "--format=custom",
            "--no-owner",
            "--no-privileges",
            "--file",
            str(path),
        ],
        environment,
        timeout=300,
    )


def _disconnect_database_sessions() -> None:
    connection, environment = _connection_details()
    _logger.info("Disconnecting other database sessions before restore")
    _run(
        [
            "psql",
            *connection,
            "--set",
            "ON_ERROR_STOP=on",
            "--command",
            """
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = current_database()
              AND pid <> pg_backend_pid();
            """,
        ],
        environment,
        timeout=30,
    )


def create_database_backup() -> tuple[Path, str]:
    with _database_lock:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"buffetiser-backup-{timestamp}.dump"
        path = Path(tempfile.mkdtemp(prefix="buffetiser-backup-")) / filename
        try:
            _dump_to(path)
        except Exception:
            path.parent.rmdir()
            raise
        return path, filename


def _restore_from(path: Path) -> None:
    connection, environment = _connection_details()
    with tempfile.TemporaryDirectory(prefix="buffetiser-restore-") as directory:
        generated_sql = Path(directory) / "restore.sql"
        compatible_sql = Path(directory) / "restore-compatible.sql"

        _logger.info("Preparing SQL from database backup %s", path)
        # Generate SQL through pg_restore first. PostgreSQL client 17 adds a
        # transaction_timeout setting that a PostgreSQL 16 server cannot parse,
        # so omit that setting while retaining the portable dump contents.
        _run(
            [
                "pg_restore",
                "--clean",
                "--if-exists",
                "--no-owner",
                "--no-privileges",
                "--file",
                str(generated_sql),
                str(path),
            ],
            environment,
            timeout=300,
        )
        _logger.info("Writing PostgreSQL-compatible restore SQL")
        with generated_sql.open(encoding="utf-8") as source:
            with compatible_sql.open("w", encoding="utf-8") as destination:
                for line in source:
                    if line.strip() == "SET transaction_timeout = 0;":
                        continue
                    destination.write(line)

        # The backup is the source of truth. Reset the public schema before
        # applying it so legacy backups made before user accounts existed do
        # not collide with newer auth tables already present in the database.
        _disconnect_database_sessions()
        _logger.info("Resetting public schema before restore")
        _run(
            [
                "psql",
                *connection,
                "--set",
                "ON_ERROR_STOP=on",
                "--command",
                """
                SET lock_timeout = '15s';
                SET statement_timeout = '60s';
                DROP SCHEMA IF EXISTS public CASCADE;
                CREATE SCHEMA public;
                """,
            ],
            environment,
            timeout=90,
        )
        _logger.info("Applying database backup SQL")
        _run(
            [
                "psql",
                *connection,
                "--set",
                "ON_ERROR_STOP=on",
                "--file",
                str(compatible_sql),
            ],
            environment,
            timeout=300,
        )


def validate_database_backup(path: Path) -> None:
    _, environment = _connection_details()
    _logger.info("Validating database backup %s", path)
    result = _run(["pg_restore", "--list", str(path)], environment, timeout=60)
    listed_tables = set()
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 6 and parts[3] == "TABLE":
            listed_tables.add(parts[5])

    missing_tables = sorted(REQUIRED_BACKUP_TABLES - listed_tables)
    if missing_tables:
        raise DatabaseBackupError(
            "Backup is not a complete Buffetiser database dump. "
            f"Missing table(s): {', '.join(missing_tables)}"
        )


def restore_database_backup(path: Path) -> None:
    with _database_lock:
        _logger.info("Starting database restore from %s", path)
        validate_database_backup(path)

        with tempfile.TemporaryDirectory(prefix="buffetiser-safety-") as directory:
            safety_backup = Path(directory) / "before-restore.dump"
            _dump_to(safety_backup)
            engine.dispose()

            try:
                _restore_from(path)
                _logger.info("Running database migrations after restore")
                _run(
                    ["alembic", "upgrade", "head"],
                    os.environ.copy(),
                    timeout=180,
                )
                _logger.info("Ensuring database schema after restore")
                ensure_database_schema()
            except Exception as restore_error:
                _logger.exception("Database restore failed; attempting recovery")
                engine.dispose()
                try:
                    _restore_from(safety_backup)
                except Exception as recovery_error:
                    raise DatabaseBackupError(
                        "Restore failed and the automatic recovery also failed: "
                        f"{recovery_error}"
                    ) from restore_error
                raise DatabaseBackupError(
                    f"Restore failed; the original database was recovered. {restore_error}"
                ) from restore_error
            finally:
                engine.dispose()
