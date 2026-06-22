from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from app.core.scheduler import (
    InvalidScheduleError,
    next_run_at,
    save_update_time,
)
from app.models.configuration import Configuration
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def test_next_run_uses_configured_time_zone():
    perth = ZoneInfo("Australia/Perth")
    now = datetime(2026, 6, 21, 14, 30, tzinfo=perth)

    assert next_run_at("15:00", "Australia/Perth", now=now) == datetime(
        2026,
        6,
        21,
        15,
        0,
        tzinfo=perth,
    )


def test_next_run_moves_to_tomorrow_after_scheduled_time():
    perth = ZoneInfo("Australia/Perth")
    now = datetime(2026, 6, 21, 15, 1, tzinfo=perth)

    assert next_run_at("15:00", "Australia/Perth", now=now) == datetime(
        2026,
        6,
        22,
        15,
        0,
        tzinfo=perth,
    )


def test_save_update_time_persists_single_configuration():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        configuration = save_update_time(session, "07:45")
        assert configuration.update_time == "07:45"
        assert configuration.update_time_zone == "Australia/Perth"
        assert session.get(Configuration, configuration.id).update_time == "07:45"


@pytest.mark.parametrize("value", ["7:30", "24:00", "midday", ""])
def test_invalid_update_times_are_rejected(value):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        with pytest.raises(InvalidScheduleError):
            save_update_time(session, value)
