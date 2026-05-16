import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from backend.app.db.base import SQLModelBase
from backend.app.core.config import settings

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / 'backend' / '.env')

engine = create_engine(settings.database_url, echo=settings.db_echo)
SQLModelBase.metadata.create_all(bind=engine)

print('Created database tables')
