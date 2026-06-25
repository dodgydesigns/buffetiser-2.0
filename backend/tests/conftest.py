import os

import pytest
from app.core.auth import current_admin, current_user
from app.main import app
from app.models.user import User
from fastapi.testclient import TestClient

os.environ["BUFFETISER_SKIP_STARTUP_SCHEMA_CHECK"] = "true"


@pytest.fixture(autouse=True)
def authenticated_user():
    user = User(
        id=1,
        username="test-user",
        display_name="Test User",
        password_hash="!",
        is_admin=True,
    )
    app.dependency_overrides[current_user] = lambda: user
    app.dependency_overrides[current_admin] = lambda: user
    yield user
    app.dependency_overrides.pop(current_user, None)
    app.dependency_overrides.pop(current_admin, None)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
