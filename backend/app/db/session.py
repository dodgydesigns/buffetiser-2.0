import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://buffetiser:password@localhost:5433/BUFFETISER_DB",
)

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "connect_timeout": 10,
        "options": "-c statement_timeout=15000 -c lock_timeout=5000",
    },
    pool_pre_ping=True,
    pool_timeout=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
