import logging
import os
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.constants import get_constants
from app.core.database_backup import (
    DatabaseBackupError,
    create_database_backup,
    database_write_dependency,
    restore_database_backup,
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
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    FastAPI,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# from app.api.v1.main import api_router
_logger = logging.getLogger(__name__)
MAX_BACKUP_UPLOAD_BYTES = 100 * 1024 * 1024


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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


@api_v1.get("/all", response_model=AllInvestmentsRead)
def all_investments(
    include_history: bool = True,
    db: Session = Depends(get_db),
):
    """
    Return the investment summaries and price history required by the dashboard.
    """
    _logger.info("All investments endpoint hit")
    return get_all_investments(db, include_history=include_history)


@api_v1.get(
    "/investments/{investment_key}/history",
    response_model=list[InvestmentHistoryRead],
)
def investment_history(
    investment_key: str,
    db: Session = Depends(get_db),
):
    try:
        return get_investment_history(db, investment_key)
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
    _guard=Depends(database_write_dependency),
):
    try:
        archive_investment(db, investment_key)
    except InvestmentDeleteNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_v1.get("/reports/")
def investment_reports(db: Session = Depends(get_db)):
    return get_investment_reports(db)


@api_v1.get("/constants")
def constants():
    _logger.info("Constants endpoint hit")
    return {"constants": get_constants()}


def _remove_backup(path: Path) -> None:
    shutil.rmtree(path.parent, ignore_errors=True)


@api_v1.post("/backup_db/")
def backup_database(
    background_tasks: BackgroundTasks,
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
    backup: UploadFile,
    _guard=Depends(database_write_dependency),
):
    suffix = Path(backup.filename or "backup.dump").suffix or ".dump"
    with tempfile.TemporaryDirectory(prefix="buffetiser-upload-") as directory:
        path = Path(directory) / f"uploaded-backup{suffix}"
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
            restore_database_backup(path)
        except DatabaseBackupError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc
        finally:
            backup.file.close()

    return {"message": "Database restored successfully"}


@api_v1.post(
    "/purchase",
    response_model=PurchaseRead,
    status_code=status.HTTP_201_CREATED,
)
def post_purchase(
    purchase_in: PurchaseCreate,
    db: Session = Depends(get_db),
    _guard=Depends(database_write_dependency),
):
    try:
        purchase = create_purchase(db, purchase_in)
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
    _guard=Depends(database_write_dependency),
):
    """Update active investments with their latest Yahoo daily prices."""
    return update_all_prices(db)


@api_v1.get("/portfolio", response_model=PortfolioRead)
def portfolio(db: Session = Depends(get_db)):
    """Return one year of daily portfolio totals and realised sale profits."""
    return get_portfolio(db)


@api_v1.get("/cron_time/")
def get_cron_time(db: Session = Depends(get_db)):
    configuration = get_configuration(db)
    return {
        "cron_time": configuration.update_time,
        "time_zone": configuration.update_time_zone,
    }


@api_v1.post("/cron_time/")
def set_cron_time(
    update_time: str = Body(...),
    db: Session = Depends(get_db),
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
    _guard=Depends(database_write_dependency),
):
    try:
        return create_sale(db, sale_in)
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
    _guard=Depends(database_write_dependency),
):
    try:
        return create_dividend_payment(db, payment_in)
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
    _guard=Depends(database_write_dependency),
):
    try:
        return create_dividend_reinvestment(db, reinvestment_in)
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
