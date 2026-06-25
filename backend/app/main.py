import logging
import os
import shutil
import tempfile
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.core.constants import get_constants
from app.core.auth import (
    Credentials,
    PasswordChange,
    SetupStatus,
    UserCreate,
    UserRead,
    authenticate,
    change_password,
    complete_setup,
    create_user,
    current_admin,
    current_user,
    end_session,
    list_users,
    setup_required,
    start_session,
    user_read,
)
from app.core.database_backup import (
    DatabaseBackupError,
    create_database_backup,
    database_write_dependency,
    restore_database_backup,
    validate_database_backup,
)
from app.core.dividend import (
    AmbiguousInvestmentError,
    DividendPaymentCreate,
    DividendPaymentRead,
    DividendReinvestmentCreate,
    DividendReinvestmentRead,
    DuplicateReturnError,
    InvestmentNotFoundError as DividendInvestmentNotFoundError,
    create_dividend_payment,
    create_dividend_reinvestment,
)
from app.core.investment import AllInvestmentsRead
from app.core.investment import InvestmentNotFoundError as InvestmentDeleteNotFoundError
from app.core.investment import (
    InvestmentHistoryRead,
    archive_investment,
    get_all_investments,
    get_investment_history,
)
from app.core.purchase import (
    DuplicatePurchaseError,
    InvestmentNotFoundError,
    PurchaseCreate,
    PurchaseRead,
    create_purchase,
)
from app.core.price import PriceHistoryError, update_all_prices, update_investment_prices
from app.core.portfolio import PortfolioRead, get_portfolio
from app.core.sale import (
    DuplicateSaleError,
    InsufficientUnitsError,
    InvestmentNotFoundError as SaleInvestmentNotFoundError,
    SaleCreate,
    SaleRead,
    create_sale,
)
from app.core.report import get_investment_reports
from app.core.scheduler import (
    DailyPriceScheduler,
    InvalidScheduleError,
    get_configuration,
    save_update_time,
)
from app.db.session import get_db
from app.models.investment import Investment
from app.models.user import User
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    FastAPI,
    HTTPException,
    Response,
    UploadFile,
    Cookie,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# from app.api.v1.main import api_router
_logger = logging.getLogger(__name__)
MAX_BACKUP_UPLOAD_BYTES = 100 * 1024 * 1024
_restore_status_lock = threading.Lock()
_restore_status = {
    "state": "idle",
    "message": "No restore has been started.",
    "started_at": None,
    "finished_at": None,
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _set_restore_status(
    state: str,
    message: str,
    *,
    started_at: str | None = None,
    finished_at: str | None = None,
) -> None:
    with _restore_status_lock:
        if started_at is not None:
            _restore_status["started_at"] = started_at
        if finished_at is not None:
            _restore_status["finished_at"] = finished_at
        _restore_status["state"] = state
        _restore_status["message"] = message


def _run_restore_job(path: Path) -> None:
    try:
        restore_database_backup(path)
    except Exception as exc:
        _logger.exception("Database restore failed")
        _set_restore_status(
            "failed",
            str(exc),
            finished_at=_utc_now_iso(),
        )
    else:
        _set_restore_status(
            "succeeded",
            "Database restored successfully.",
            finished_at=_utc_now_iso(),
        )
    finally:
        shutil.rmtree(path.parent, ignore_errors=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = DailyPriceScheduler()
    app.state.price_scheduler = scheduler
    scheduler.start()
    try:
        yield
    finally:
        await scheduler.stop()


app = FastAPI(title="Buffetiser API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost,http://127.0.0.1",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


@api_v1.get("/auth/status", response_model=SetupStatus)
def auth_status(db: Session = Depends(get_db)):
    return SetupStatus(setup_required=setup_required(db))


@api_v1.post("/auth/setup", response_model=UserRead)
def auth_setup(
    user_in: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    user = complete_setup(db, user_in)
    start_session(db, response, user)
    return user_read(user)


@api_v1.post("/auth/login", response_model=UserRead)
def auth_login(
    credentials: Credentials,
    response: Response,
    db: Session = Depends(get_db),
):
    user = authenticate(db, credentials)
    start_session(db, response, user)
    return user_read(user)


@api_v1.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def auth_logout(
    response: Response,
    db: Session = Depends(get_db),
    token: str | None = Cookie(default=None, alias="buffetiser_session"),
):
    end_session(db, response, token)
    response.status_code = status.HTTP_204_NO_CONTENT


@api_v1.get("/auth/me", response_model=UserRead)
def auth_me(user: User = Depends(current_user)):
    return user_read(user)


@api_v1.post("/auth/password", status_code=status.HTTP_204_NO_CONTENT)
def auth_password(
    password_in: PasswordChange,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    change_password(db, user, password_in)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_v1.get("/users", response_model=list[UserRead])
def get_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(current_admin),
):
    return list_users(db)


@api_v1.post(
    "/users",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def post_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(current_admin),
):
    return user_read(create_user(db, user_in))


@api_v1.get("/all", response_model=AllInvestmentsRead)
def all_investments(
    include_history: bool = True,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """
    Return the investment summaries and price history required by the dashboard.
    """
    _logger.info("All investments endpoint hit")
    return get_all_investments(
        db,
        user.id,
        include_history=include_history,
    )


@api_v1.get(
    "/investments/{investment_key}/history",
    response_model=list[InvestmentHistoryRead],
)
def investment_history(
    investment_key: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    try:
        return get_investment_history(db, investment_key, user.id)
    except InvestmentDeleteNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc


@api_v1.patch(
    "/investments/{investment_key}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_investment(
    investment_key: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    try:
        archive_investment(db, investment_key, user.id)
    except InvestmentDeleteNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_v1.get("/reports/")
def investment_reports(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    return get_investment_reports(db, user.id)


@api_v1.get("/constants")
def constants(_user: User = Depends(current_user)):
    _logger.info("Constants endpoint hit")
    return {"constants": get_constants()}


def _remove_backup(path: Path) -> None:
    shutil.rmtree(path.parent, ignore_errors=True)


@api_v1.post("/backup_db/")
def backup_database(
    background_tasks: BackgroundTasks,
    _admin: User = Depends(current_admin),
    _guard=Depends(database_write_dependency),
):
    try:
        path, filename = create_database_backup()
    except DatabaseBackupError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    background_tasks.add_task(_remove_backup, path)
    return FileResponse(
        path,
        filename=filename,
        media_type="application/octet-stream",
        background=background_tasks,
    )


@api_v1.post("/restore_db/")
def restore_database(
    background_tasks: BackgroundTasks,
    backup: UploadFile,
    _admin: User = Depends(current_admin),
):
    started_at = _utc_now_iso()
    with _restore_status_lock:
        if _restore_status["state"] == "running":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A database restore is already running.",
            )
        _restore_status["state"] = "running"
        _restore_status["message"] = "Database backup is being uploaded."
        _restore_status["started_at"] = started_at
        _restore_status["finished_at"] = ""

    suffix = Path(backup.filename or "backup.dump").suffix or ".dump"
    directory = Path(tempfile.mkdtemp(prefix="buffetiser-upload-"))
    path = directory / f"uploaded-backup{suffix}"
    try:
        with path.open("wb") as destination:
            total_bytes = 0
            while chunk := backup.file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_BACKUP_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="Backup files must be 100 MB or smaller",
                    )
                destination.write(chunk)

        validate_database_backup(path)
    except HTTPException as exc:
        shutil.rmtree(directory, ignore_errors=True)
        _set_restore_status(
            "failed",
            str(exc.detail),
            finished_at=_utc_now_iso(),
        )
        raise
    except DatabaseBackupError as exc:
        shutil.rmtree(directory, ignore_errors=True)
        _set_restore_status(
            "failed",
            str(exc),
            finished_at=_utc_now_iso(),
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        _set_restore_status(
            "failed",
            "Restore failed while reading the uploaded backup.",
            finished_at=_utc_now_iso(),
        )
        raise
    finally:
        backup.file.close()

    _set_restore_status(
        "running",
        "Database restore is running.",
    )
    background_tasks.add_task(_run_restore_job, path)

    return {
        "message": "Database restore started.",
        "state": "running",
        "started_at": started_at,
    }


@api_v1.get("/restore_db/status")
def restore_database_status(_admin: User = Depends(current_admin)):
    with _restore_status_lock:
        return dict(_restore_status)


@api_v1.post(
    "/purchase",
    response_model=PurchaseRead,
    status_code=status.HTTP_201_CREATED,
)
def post_purchase(
    purchase_in: PurchaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    try:
        purchase = create_purchase(db, purchase_in, user.id)
        investment = purchase.investment or db.get(Investment, purchase.investment_key)
        if investment is not None and not investment.history:
            try:
                update_investment_prices(db, investment, period="1y")
            except PriceHistoryError as exc:
                _logger.warning(
                    "Purchase saved but initial price history failed for %s: %s",
                    investment.key,
                    exc,
                )
        return purchase
    except InvestmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc
    except DuplicatePurchaseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Purchase already exists",
        ) from exc


@api_v1.post("/update_all/")
def update_prices(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    """Update active investments with their latest Yahoo daily prices."""
    return update_all_prices(db, owner_id=user.id)


@api_v1.get("/portfolio", response_model=PortfolioRead)
def portfolio(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    """Return one year of daily portfolio totals and realised sale profits."""
    return get_portfolio(db, user.id)


@api_v1.get("/cron_time/")
def get_cron_time(
    db: Session = Depends(get_db),
    _admin: User = Depends(current_admin),
):
    configuration = get_configuration(db)
    return {
        "cron_time": configuration.update_time,
        "time_zone": configuration.update_time_zone,
    }


@api_v1.post("/cron_time/")
def set_cron_time(
    update_time: str = Body(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(current_admin),
    _guard=Depends(database_write_dependency),
):
    try:
        configuration = save_update_time(db, update_time)
    except InvalidScheduleError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    scheduler: DailyPriceScheduler = app.state.price_scheduler
    scheduler.reschedule()
    return {
        "cron_time": configuration.update_time,
        "time_zone": configuration.update_time_zone,
    }


@api_v1.post(
    "/sale",
    response_model=SaleRead,
    status_code=status.HTTP_201_CREATED,
)
def post_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    try:
        return create_sale(db, sale_in, user.id)
    except SaleInvestmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc
    except InsufficientUnitsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot sell more than {exc.available_units} available units",
        ) from exc
    except DuplicateSaleError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sale already exists",
        ) from exc


@api_v1.post(
    "/dividends",
    response_model=DividendPaymentRead,
    status_code=status.HTTP_201_CREATED,
)
def post_dividend(
    payment_in: DividendPaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    try:
        return create_dividend_payment(db, payment_in, user.id)
    except DividendInvestmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc
    except AmbiguousInvestmentError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="More than one active investment uses this symbol",
        ) from exc
    except DuplicateReturnError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Dividend payment already exists",
        ) from exc


@api_v1.post(
    "/reinvestments",
    response_model=DividendReinvestmentRead,
    status_code=status.HTTP_201_CREATED,
)
def post_reinvestment(
    reinvestment_in: DividendReinvestmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    _guard=Depends(database_write_dependency),
):
    try:
        return create_dividend_reinvestment(db, reinvestment_in, user.id)
    except DividendInvestmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc
    except AmbiguousInvestmentError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="More than one active investment uses this symbol",
        ) from exc
    except DuplicateReturnError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Dividend reinvestment already exists",
        ) from exc


app.include_router(api_v1)
