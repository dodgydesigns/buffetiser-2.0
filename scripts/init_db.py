import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
load_dotenv(BACKEND / ".env")

import sys

sys.path.insert(0, str(BACKEND))

from app.db.base import SQLModelBase  # noqa: E402

database_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://buffetiser:password@localhost:5433/BUFFETISER_DB",
)
db_echo = os.getenv("DB_ECHO", "false").lower() == "true"

engine = create_engine(database_url, echo=db_echo)
SQLModelBase.metadata.create_all(bind=engine)

print("Created database tables")
