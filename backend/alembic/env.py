from sqlmodel import SQLModel
from app import models

_ = models

target_metadata = SQLModel.metadata
