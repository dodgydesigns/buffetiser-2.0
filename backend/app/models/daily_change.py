from typing import Optional

from sqlmodel import Field, SQLModel


class DailyChange(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    symbol: str = ""
    daily_change: float = 0
    daily_change_percent: float = 0
