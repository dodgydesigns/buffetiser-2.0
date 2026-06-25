from __future__ import annotations

import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.user_session import UserSession
from fastapi import Cookie, Depends, HTTPException, Response, status
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlmodel import Field, SQLModel, col, select

SESSION_COOKIE = "buffetiser_session"
SESSION_DAYS = int(os.getenv("SESSION_DAYS", "30"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
_password_hash = PasswordHash.recommended()


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class Credentials(SQLModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=10, max_length=256)


class UserCreate(Credentials):
    display_name: str = Field(min_length=1, max_length=128)


class PasswordChange(SQLModel):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=10, max_length=256)


class UserRead(SQLModel):
    id: int
    username: str
    display_name: str
    is_admin: bool


class SetupStatus(SQLModel):
    setup_required: bool


def _normalise_username(username: str) -> str:
    return username.strip().lower()


def _user_read(user: User) -> UserRead:
    if user.id is None:
        raise RuntimeError("Persisted user has no id")
    return UserRead(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        is_admin=user.is_admin,
    )


def setup_required(db: Session) -> bool:
    return (
        db.scalar(
            text(
                """
                SELECT 1
                FROM "user"
                WHERE is_bootstrap IS TRUE
                LIMIT 1
                """
            )
        )
        is not None
    )


def complete_setup(db: Session, user_in: UserCreate) -> User:
    bootstrap = db.scalar(
        select(User).where(col(User.is_bootstrap).is_(True))
    )
    if bootstrap is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Initial setup has already been completed",
        )

    username = _normalise_username(user_in.username)
    existing = db.scalar(select(User).where(col(User.username) == username))
    if existing is not None and existing.id != bootstrap.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    bootstrap.username = username
    bootstrap.display_name = user_in.display_name.strip()
    bootstrap.password_hash = _password_hash.hash(user_in.password)
    bootstrap.is_admin = True
    bootstrap.is_bootstrap = False
    db.add(bootstrap)
    db.commit()
    db.refresh(bootstrap)
    return bootstrap


def create_user(db: Session, user_in: UserCreate) -> User:
    username = _normalise_username(user_in.username)
    if db.scalar(select(User).where(col(User.username) == username)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    user = User(
        username=username,
        display_name=user_in.display_name.strip(),
        password_hash=_password_hash.hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_password(
    db: Session,
    user: User,
    password_in: PasswordChange,
) -> None:
    if not _password_hash.verify(
        password_in.current_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.password_hash = _password_hash.hash(password_in.new_password)
    db.add(user)
    db.commit()


def authenticate(db: Session, credentials: Credentials) -> User:
    user = db.scalar(
        select(User).where(
            col(User.username) == _normalise_username(credentials.username),
            col(User.is_bootstrap).is_(False),
        )
    )
    if user is None or not _password_hash.verify(
        credentials.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return user


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def start_session(db: Session, response: Response, user: User) -> None:
    if user.id is None:
        raise RuntimeError("Persisted user has no id")
    token = secrets.token_urlsafe(48)
    now = _utcnow()
    db.add(
        UserSession(
            token_hash=_token_hash(token),
            user_id=user.id,
            created_at=now,
            expires_at=now + timedelta(days=SESSION_DAYS),
        )
    )
    db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="strict",
        path="/",
    )


def end_session(
    db: Session,
    response: Response,
    token: str | None,
) -> None:
    if token:
        session = db.get(UserSession, _token_hash(token))
        if session is not None:
            db.delete(session)
            db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


def current_user(
    db: Session = Depends(get_db),
    token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    session = db.get(UserSession, _token_hash(token))
    if session is None or session.expires_at <= _utcnow():
        if session is not None:
            db.delete(session)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired",
        )
    user = db.get(User, session.user_id)
    if user is None or user.is_bootstrap:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def current_admin(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return user


def list_users(db: Session) -> list[UserRead]:
    users = db.scalars(
        select(User)
        .where(col(User.is_bootstrap).is_(False))
        .order_by(col(User.username))
    ).all()
    return [_user_read(user) for user in users]


def user_read(user: User) -> UserRead:
    return _user_read(user)
