import app.main as main_module


def test_restore_rejects_oversized_upload(client, monkeypatch):
    monkeypatch.setattr(main_module, "MAX_BACKUP_UPLOAD_BYTES", 10)

    response = client.post(
        "/api/v1/restore_db/",
        files={
            "backup": (
                "too-large.dump",
                b"more than ten bytes",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Backup files must be 100 MB or smaller"


def test_restore_rejects_invalid_archive(client, monkeypatch):
    def reject_backup(_):
        from app.core.database_backup import DatabaseBackupError

        raise DatabaseBackupError("Invalid PostgreSQL archive")

    monkeypatch.setattr(main_module, "validate_database_backup", reject_backup)
    response = client.post(
        "/api/v1/restore_db/",
        files={
            "backup": (
                "invalid.dump",
                b"not a dump",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid PostgreSQL archive"


def test_restore_starts_background_job(client, monkeypatch):
    monkeypatch.setattr(main_module, "validate_database_backup", lambda _: None)
    monkeypatch.setattr(main_module, "restore_database_backup", lambda _: None)

    response = client.post(
        "/api/v1/restore_db/",
        files={
            "backup": (
                "valid.dump",
                b"dump",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["state"] == "running"

    status_response = client.get("/api/v1/restore_db/status")
    assert status_response.status_code == 200
    assert status_response.json()["state"] == "succeeded"
