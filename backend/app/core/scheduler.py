from __future__ import annotations

import asyncio
import logging
import re
from contextlib import suppress
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.price import update_all_prices
from app.core.database_backup import database_write_guard
from app.db.session import SessionLocal
from app.models.configuration import Configuration
from sqlalchemy.orm import Session
from sqlmodel import col, select

_logger = logging.getLogger("uvicorn.error")
DEFAULT_UPDATE_TIME = "15:00"
DEFAULT_TIME_ZONE = "Australia/Perth"


class InvalidScheduleError(ValueError):
    pass


def validate_update_time(value: str) -> str:
    if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", value):
        raise InvalidScheduleError("Time must use 24-hour HH:MM format")
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except ValueError as exc:
        raise InvalidScheduleError("Time must use 24-hour HH:MM format") from exc
    return parsed.strftime("%H:%M")


def validate_time_zone(value: str) -> str:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise InvalidScheduleError("Unknown time zone") from exc
    return value


def get_configuration(db: Session) -> Configuration:
    configuration = db.scalar(
        select(Configuration).order_by(col(Configuration.id))
    )
    if configuration is None:
        configuration = Configuration(
            update_time=DEFAULT_UPDATE_TIME,
            update_time_zone=DEFAULT_TIME_ZONE,
        )
        db.add(configuration)
        db.commit()
        db.refresh(configuration)
    return configuration


def save_update_time(db: Session, update_time: str) -> Configuration:
    valid_time = validate_update_time(update_time)
    configuration = get_configuration(db)
    configuration.update_time = valid_time
    db.add(configuration)
    db.commit()
    db.refresh(configuration)
    return configuration


def next_run_at(
    update_time: str,
    time_zone: str,
    *,
    now: datetime | None = None,
) -> datetime:
    valid_time = validate_update_time(update_time)
    zone = ZoneInfo(validate_time_zone(time_zone))
    current = now.astimezone(zone) if now else datetime.now(zone)
    hour, minute = (int(part) for part in valid_time.split(":"))
    next_run = current.replace(
        hour=hour,
        minute=minute,
        second=0,
        microsecond=0,
    )
    if next_run <= current:
        next_run += timedelta(days=1)
    return next_run


def _load_schedule() -> tuple[str, str]:
    with SessionLocal() as db:
        configuration = get_configuration(db)
        return configuration.update_time, configuration.update_time_zone


def _run_price_update() -> dict:
    with database_write_guard():
        with SessionLocal() as db:
            return update_all_prices(db)


class DailyPriceScheduler:
    def __init__(self) -> None:
        self._reschedule = asyncio.Event()
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(
                self._run(),
                name="daily-price-update",
            )

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        with suppress(asyncio.CancelledError):
            await self._task
        self._task = None

    def reschedule(self) -> None:
        self._reschedule.set()

    async def _wait(self, seconds: float) -> bool:
        try:
            await asyncio.wait_for(self._reschedule.wait(), timeout=seconds)
        except TimeoutError:
            return False
        self._reschedule.clear()
        return True

    async def _run(self) -> None:
        while True:
            try:
                update_time, time_zone = await asyncio.to_thread(_load_schedule)
                next_run = next_run_at(update_time, time_zone)
                delay = max(0, (next_run - datetime.now(next_run.tzinfo)).total_seconds())
                _logger.info(
                    "Next automatic price update scheduled for %s",
                    next_run.isoformat(),
                )

                if await self._wait(delay):
                    continue

                _logger.info("Starting scheduled price update")
                result = await asyncio.to_thread(_run_price_update)
                _logger.info(
                    "Scheduled price update finished: %s updated, %s failed",
                    result["updated_count"],
                    result["failed_count"],
                )
            except asyncio.CancelledError:
                raise
            except Exception:
                _logger.exception(
                    "Automatic price scheduler failed; retrying in 60 seconds"
                )
                await self._wait(60)
