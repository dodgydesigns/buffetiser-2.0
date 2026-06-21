import logging

from app.core.constants import get_constants
from app.core.investment import AllInvestmentsRead
from app.core.investment import InvestmentNotFoundError as InvestmentDeleteNotFoundError
from app.core.investment import delete_investment, get_all_investments
from app.core.purchase import (
    DuplicatePurchaseError,
    InvestmentNotFoundError,
    PurchaseCreate,
    PurchaseRead,
    create_purchase,
)
from app.core.sale import (
    DuplicateSaleError,
    InsufficientUnitsError,
    InvestmentNotFoundError as SaleInvestmentNotFoundError,
    SaleCreate,
    SaleRead,
    create_sale,
)
from app.db.session import get_db
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# from app.api.v1.main import api_router
_logger = logging.getLogger(__name__)

app = FastAPI(title="Buffetiser API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins - adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")


@api_v1.get("/health")
def health():
    return {"status": "ok"}


@api_v1.get("/all", response_model=AllInvestmentsRead)
def all_investments(db: Session = Depends(get_db)):
    """
    Return the investment summaries and price history required by the dashboard.
    """
    _logger.info("All investments endpoint hit")
    return get_all_investments(db)


@api_v1.delete(
    "/investments/{investment_key}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_investment(investment_key: str, db: Session = Depends(get_db)):
    try:
        delete_investment(db, investment_key)
    except InvestmentDeleteNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@api_v1.get("/constants")
def constants():
    _logger.info("Constants endpoint hit")
    return {"constants": get_constants()}


@api_v1.post(
    "/purchase",
    response_model=PurchaseRead,
    status_code=status.HTTP_201_CREATED,
)
def post_purchase(purchase_in: PurchaseCreate, db: Session = Depends(get_db)):
    try:
        return create_purchase(db, purchase_in)
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


@api_v1.post(
    "/sale",
    response_model=SaleRead,
    status_code=status.HTTP_201_CREATED,
)
def post_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
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


app.include_router(api_v1)
