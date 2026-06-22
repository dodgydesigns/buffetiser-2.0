from __future__ import annotations

import os
import subprocess
import tempfile
import threading
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from app.db.session import DATABASE_URL, engine
from sqlalchemy.engine import make_url

_database_lock = threading.RLock()


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


def _run(command: list[str], environment: dict[str, str]) -> None:
    try:
        result = subprocess.run(
            command,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        raise DatabaseBackupError(
            f"Could not run {command[0]}. PostgreSQL client tools are unavailable."
        ) from exc

    if result.returncode != 0:
        detail = result.stderr.strip().splitlines()
        message = detail[-1] if detail else f"{command[0]} failed"
        raise DatabaseBackupError(message)


def _dump_to(path: Path) -> None:
    connection, environment = _connection_details()
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
        )
        with generated_sql.open(encoding="utf-8") as source:
            with compatible_sql.open("w", encoding="utf-8") as destination:
                for line in source:
                    if line.strip() == "SET transaction_timeout = 0;":
                        continue
                    destination.write(line)

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
        )


def validate_database_backup(path: Path) -> None:
    _, environment = _connection_details()
    _run(["pg_restore", "--list", str(path)], environment)


def restore_database_backup(path: Path) -> None:
    with _database_lock:
        validate_database_backup(path)

        with tempfile.TemporaryDirectory(prefix="buffetiser-safety-") as directory:
            safety_backup = Path(directory) / "before-restore.dump"
            _dump_to(safety_backup)
            engine.dispose()

            try:
                _restore_from(path)
                _run(
                    ["alembic", "upgrade", "head"],
                    os.environ.copy(),
                )
            except Exception as restore_error:
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
