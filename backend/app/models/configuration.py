from typing import Optional

from sqlmodel import Field, SQLModel


class Configuration(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    update_time: str = "15:00"
    update_time_zone: str = "Australia/Perth"
