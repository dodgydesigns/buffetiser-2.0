from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import logging
from sqlalchemy.orm import Session

from app.core.constants import get_constants
from app.core.purchase import (
    DuplicatePurchaseError,
    InvestmentNotFoundError,
    PurchaseCreate,
    PurchaseRead,
    create_purchase,
)
from app.db.session import get_db

# from app.api.v1.main import api_router
_logger = logging.getLogger(__name__)
_all_investment_data = [
      {
         "name": "Aussie Broadband Ltd",
         "symbol": "ABB",
         "visible": True,
         "last_price": 4.53,
         "variation": 0.040000000000000036,
         "daily_change": 0,
         "daily_change_percent": 0,
         "units": 2000,
         "average_cost": 1.837633639768471,
         "total_cost": 3675.2672795369417,
         "profit": 5384.732720463058,
         "profit_percent": 146.51268359294667,
         "history": [
            {
               "date": "2024-10-10",
               "low": 3.8,
               "high": 3.885,
               "close": 3.88,
               "volume": 376741
            },
            {
               "date": "2024-10-11",
               "low": 3.825,
               "high": 3.935,
               "close": 3.85,
               "volume": 316813
            },
            {
               "date": "2024-10-13",
               "low": 3.825,
               "high": 3.935,
               "close": 3.85,
               "volume": 316813
            },
            {
               "date": "2024-10-14",
               "low": 3.85,
               "high": 3.945,
               "close": 3.94,
               "volume": 508811
            },
            {
               "date": "2024-10-05",
               "low": 3.66,
               "high": 3.78,
               "close": 3.76,
               "volume": 262166
            },
            {
               "date": "2024-10-07",
               "low": 3.71,
               "high": 3.73,
               "close": 3.72,
               "volume": 10405
            },
            {
               "date": "2024-10-08",
               "low": 3.64,
               "high": 3.69,
               "close": 3.64,
               "volume": 10949
            },
            {
               "date": "2024-10-15",
               "low": 3.83,
               "high": 4.02,
               "close": 3.91,
               "volume": 739544
            },
            {
               "date": "2024-10-16",
               "low": 3.885,
               "high": 3.93,
               "close": 3.89,
               "volume": 31630
            },
            {
               "date": "2024-10-17",
               "low": 3.73,
               "high": 3.85,
               "close": 3.8,
               "volume": 333415
            },
            {
               "date": "2024-10-18",
               "low": 3.74,
               "high": 3.8,
               "close": 3.755,
               "volume": 81896
            },
            {
               "date": "2024-10-22",
               "low": 3.64,
               "high": 3.73,
               "close": 3.7,
               "volume": 496689
            },
            {
               "date": "2024-10-23",
               "low": 3.68,
               "high": 3.74,
               "close": 3.72,
               "volume": 277937
            },
            {
               "date": "2024-10-24",
               "low": 3.7,
               "high": 3.79,
               "close": 3.78,
               "volume": 724699
            },
            {
               "date": "2024-10-25",
               "low": 3.78,
               "high": 4.02,
               "close": 3.9,
               "volume": 964574
            },
            {
               "date": "2024-10-28",
               "low": 3.77,
               "high": 3.89,
               "close": 3.8,
               "volume": 158609
            },
            {
               "date": "2024-10-29",
               "low": 3.75,
               "high": 3.91,
               "close": 3.76,
               "volume": 1014731
            },
            {
               "date": "2024-10-30",
               "low": 3.68,
               "high": 3.8,
               "close": 3.76,
               "volume": 971227
            },
            {
               "date": "2024-10-31",
               "low": 3.64,
               "high": 3.78,
               "close": 3.64,
               "volume": 357410
            },
            {
               "date": "2024-11-02",
               "low": 3.57,
               "high": 3.68,
               "close": 3.65,
               "volume": 331712
            },
            {
               "date": "2024-11-04",
               "low": 3.63,
               "high": 3.71,
               "close": 3.66,
               "volume": 635435
            },
            {
               "date": "2024-11-05",
               "low": 3.58,
               "high": 3.67,
               "close": 3.63,
               "volume": 466657
            },
            {
               "date": "2024-11-06",
               "low": 3.58,
               "high": 3.66,
               "close": 3.63,
               "volume": 449643
            },
            {
               "date": "2024-11-07",
               "low": 3.64,
               "high": 3.75,
               "close": 3.75,
               "volume": 274377
            },
            {
               "date": "2024-11-08",
               "low": 3.73,
               "high": 3.82,
               "close": 3.77,
               "volume": 215872
            },
            {
               "date": "2024-11-11",
               "low": 3.65,
               "high": 3.76,
               "close": 3.69,
               "volume": 214916
            },
            {
               "date": "2024-11-12",
               "low": 3.7,
               "high": 3.81,
               "close": 3.79,
               "volume": 534554
            },
            {
               "date": "2024-11-13",
               "low": 3.68,
               "high": 3.78,
               "close": 3.7,
               "volume": 346832
            },
            {
               "date": "2024-11-14",
               "low": 3.655,
               "high": 3.775,
               "close": 3.72,
               "volume": 232734
            },
            {
               "date": "2024-11-15",
               "low": 3.67,
               "high": 3.745,
               "close": 3.67,
               "volume": 168892
            },
            {
               "date": "2024-11-18",
               "low": 3.63,
               "high": 3.7,
               "close": 3.66,
               "volume": 247470
            },
            {
               "date": "2024-11-20",
               "low": 3.52,
               "high": 3.68,
               "close": 3.59,
               "volume": 415968
            },
            {
               "date": "2024-11-22",
               "low": 3.48,
               "high": 3.55,
               "close": 3.52,
               "volume": 580260
            },
            {
               "date": "2024-11-25",
               "low": 3.51,
               "high": 3.58,
               "close": 3.53,
               "volume": 325616
            },
            {
               "date": "2024-11-26",
               "low": 3.53,
               "high": 3.65,
               "close": 3.58,
               "volume": 463274
            },
            {
               "date": "2024-11-27",
               "low": 3.57,
               "high": 3.78,
               "close": 3.75,
               "volume": 444500
            },
            {
               "date": "2024-11-28",
               "low": 3.72,
               "high": 3.8,
               "close": 3.75,
               "volume": 375495
            },
            {
               "date": "2024-11-29",
               "low": 3.71,
               "high": 3.77,
               "close": 3.77,
               "volume": 219177
            },
            {
               "date": "2024-12-02",
               "low": 3.68,
               "high": 3.79,
               "close": 3.69,
               "volume": 153855
            },
            {
               "date": "2024-12-03",
               "low": 3.68,
               "high": 3.75,
               "close": 3.72,
               "volume": 259644
            },
            {
               "date": "2024-12-04",
               "low": 3.64,
               "high": 3.73,
               "close": 3.7,
               "volume": 269846
            },
            {
               "date": "2024-12-05",
               "low": 3.685,
               "high": 3.83,
               "close": 3.8,
               "volume": 481451
            },
            {
               "date": "2024-12-06",
               "low": 3.73,
               "high": 3.79,
               "close": 3.79,
               "volume": 111260
            },
            {
               "date": "2024-12-09",
               "low": 3.68,
               "high": 3.75,
               "close": 3.7,
               "volume": 219026
            },
            {
               "date": "2024-12-10",
               "low": 3.6,
               "high": 3.71,
               "close": 3.66,
               "volume": 262502
            },
            {
               "date": "2024-12-11",
               "low": 3.65,
               "high": 3.7,
               "close": 3.67,
               "volume": 174591
            },
            {
               "date": "2024-12-12",
               "low": 3.66,
               "high": 3.7,
               "close": 3.69,
               "volume": 224841
            },
            {
               "date": "2024-12-13",
               "low": 3.66,
               "high": 3.72,
               "close": 3.7,
               "volume": 387001
            },
            {
               "date": "2024-12-16",
               "low": 3.61,
               "high": 3.71,
               "close": 3.64,
               "volume": 273360
            },
            {
               "date": "2024-12-17",
               "low": 3.6,
               "high": 3.665,
               "close": 3.62,
               "volume": 227046
            },
            {
               "date": "2024-12-18",
               "low": 3.55,
               "high": 3.65,
               "close": 3.61,
               "volume": 579429
            },
            {
               "date": "2024-12-19",
               "low": 3.52,
               "high": 3.58,
               "close": 3.57,
               "volume": 340056
            },
            {
               "date": "2024-12-23",
               "low": 3.47,
               "high": 3.545,
               "close": 3.52,
               "volume": 397249
            },
            {
               "date": "2024-12-24",
               "low": 3.49,
               "high": 3.55,
               "close": 3.53,
               "volume": 129389
            },
            {
               "date": "2024-12-27",
               "low": 3.5,
               "high": 3.57,
               "close": 3.57,
               "volume": 165530
            },
            {
               "date": "2024-12-30",
               "low": 3.55,
               "high": 3.615,
               "close": 3.58,
               "volume": 256528
            },
            {
               "date": "2024-12-31",
               "low": 3.56,
               "high": 3.6,
               "close": 3.58,
               "volume": 116140
            },
            {
               "date": "2025-01-02",
               "low": 3.53,
               "high": 3.6,
               "close": 3.54,
               "volume": 138475
            },
            {
               "date": "2025-01-03",
               "low": 3.525,
               "high": 3.565,
               "close": 3.54,
               "volume": 137346
            },
            {
               "date": "2025-01-06",
               "low": 3.51,
               "high": 3.575,
               "close": 3.51,
               "volume": 399229
            },
            {
               "date": "2025-01-07",
               "low": 3.48,
               "high": 3.54,
               "close": 3.53,
               "volume": 404105
            },
            {
               "date": "2025-01-08",
               "low": 3.49,
               "high": 3.57,
               "close": 3.57,
               "volume": 394056
            },
            {
               "date": "2025-01-09",
               "low": 3.54,
               "high": 3.595,
               "close": 3.58,
               "volume": 151405
            },
            {
               "date": "2025-01-10",
               "low": 3.51,
               "high": 3.57,
               "close": 3.52,
               "volume": 246543
            },
            {
               "date": "2025-01-13",
               "low": 3.46,
               "high": 3.52,
               "close": 3.48,
               "volume": 226486
            },
            {
               "date": "2025-01-14",
               "low": 3.48,
               "high": 3.56,
               "close": 3.56,
               "volume": 188478
            },
            {
               "date": "2025-01-15",
               "low": 3.5,
               "high": 3.63,
               "close": 3.61,
               "volume": 230841
            },
            {
               "date": "2025-01-16",
               "low": 3.59,
               "high": 3.64,
               "close": 3.64,
               "volume": 152634
            },
            {
               "date": "2025-01-17",
               "low": 3.36,
               "high": 3.87,
               "close": 3.84,
               "volume": 1095885
            },
            {
               "date": "2025-01-20",
               "low": 3.74,
               "high": 3.88,
               "close": 3.81,
               "volume": 1439522
            },
            {
               "date": "2025-01-27",
               "low": 3.59,
               "high": 3.72,
               "close": 3.65,
               "volume": 216410
            },
            {
               "date": "2025-01-28",
               "low": 3.56,
               "high": 3.7,
               "close": 3.7,
               "volume": 238469
            },
            {
               "date": "2025-01-29",
               "low": 3.63,
               "high": 3.73,
               "close": 3.73,
               "volume": 327342
            },
            {
               "date": "2025-01-30",
               "low": 3.75,
               "high": 3.89,
               "close": 3.87,
               "volume": 370648
            },
            {
               "date": "2025-01-31",
               "low": 3.86,
               "high": 3.95,
               "close": 3.94,
               "volume": 446277
            },
            {
               "date": "2025-02-01",
               "low": 3.86,
               "high": 3.95,
               "close": 3.94,
               "volume": 446277
            },
            {
               "date": "2025-02-03",
               "low": 3.79,
               "high": 3.93,
               "close": 3.8,
               "volume": 255593
            },
            {
               "date": "2025-02-04",
               "low": 3.79,
               "high": 3.85,
               "close": 3.81,
               "volume": 166496
            },
            {
               "date": "2025-02-05",
               "low": 3.77,
               "high": 3.88,
               "close": 3.8,
               "volume": 120301
            },
            {
               "date": "2025-02-06",
               "low": 3.79,
               "high": 3.87,
               "close": 3.84,
               "volume": 318600
            },
            {
               "date": "2025-02-07",
               "low": 3.85,
               "high": 3.95,
               "close": 3.91,
               "volume": 393166
            },
            {
               "date": "2025-02-10",
               "low": 3.92,
               "high": 3.99,
               "close": 3.97,
               "volume": 365666
            },
            {
               "date": "2025-02-11",
               "low": 3.98,
               "high": 4.115,
               "close": 4.08,
               "volume": 456082
            },
            {
               "date": "2025-02-12",
               "low": 4,
               "high": 4.08,
               "close": 4.04,
               "volume": 664757
            },
            {
               "date": "2025-02-13",
               "low": 3.925,
               "high": 4.05,
               "close": 3.94,
               "volume": 193269
            },
            {
               "date": "2025-02-14",
               "low": 3.89,
               "high": 3.98,
               "close": 3.91,
               "volume": 217403
            },
            {
               "date": "2025-02-17",
               "low": 3.83,
               "high": 3.96,
               "close": 3.96,
               "volume": 805553
            },
            {
               "date": "2025-02-18",
               "low": 3.91,
               "high": 4,
               "close": 3.93,
               "volume": 92562
            },
            {
               "date": "2025-02-19",
               "low": 3.84,
               "high": 3.95,
               "close": 3.87,
               "volume": 273360
            },
            {
               "date": "2025-02-20",
               "low": 3.79,
               "high": 3.85,
               "close": 3.84,
               "volume": 361255
            },
            {
               "date": "2025-02-21",
               "low": 3.82,
               "high": 3.87,
               "close": 3.83,
               "volume": 412881
            },
            {
               "date": "2025-02-25",
               "low": 3.74,
               "high": 4.2,
               "close": 3.74,
               "volume": 994472
            },
            {
               "date": "2025-02-26",
               "low": 3.675,
               "high": 3.89,
               "close": 3.87,
               "volume": 942199
            },
            {
               "date": "2025-02-27",
               "low": 3.87,
               "high": 4.035,
               "close": 4.01,
               "volume": 686686
            },
            {
               "date": "2025-02-28",
               "low": 3.89,
               "high": 4.01,
               "close": 3.96,
               "volume": 898416
            },
            {
               "date": "2025-03-10",
               "low": 3.59,
               "high": 3.69,
               "close": 3.67,
               "volume": 829920
            },
            {
               "date": "2025-03-12",
               "low": 3.64,
               "high": 3.74,
               "close": 3.69,
               "volume": 959224
            },
            {
               "date": "2025-03-13",
               "low": 3.67,
               "high": 3.78,
               "close": 3.71,
               "volume": 575810
            },
            {
               "date": "2025-03-14",
               "low": 3.72,
               "high": 3.87,
               "close": 3.85,
               "volume": 432518
            },
            {
               "date": "2025-03-17",
               "low": 3.86,
               "high": 3.9,
               "close": 3.87,
               "volume": 283883
            },
            {
               "date": "2025-03-18",
               "low": 3.85,
               "high": 3.93,
               "close": 3.92,
               "volume": 510968
            },
            {
               "date": "2025-03-20",
               "low": 3.91,
               "high": 4.05,
               "close": 3.99,
               "volume": 1469435
            },
            {
               "date": "2025-03-21",
               "low": 3.905,
               "high": 4.055,
               "close": 3.99,
               "volume": 2125583
            },
            {
               "date": "2025-04-07",
               "low": 3.56,
               "high": 3.69,
               "close": 3.6,
               "volume": 0
            },
            {
               "date": "2025-04-04",
               "low": 3.74,
               "high": 3.87,
               "close": 3.8,
               "volume": 0
            },
            {
               "date": "2025-04-03",
               "low": 3.83,
               "high": 3.94,
               "close": 3.9,
               "volume": 0
            },
            {
               "date": "2025-04-02",
               "low": 3.91,
               "high": 4.01,
               "close": 3.95,
               "volume": 0
            },
            {
               "date": "2025-04-01",
               "low": 3.89,
               "high": 4.01,
               "close": 3.97,
               "volume": 0
            },
            {
               "date": "2025-03-31",
               "low": 3.92,
               "high": 4.055,
               "close": 3.99,
               "volume": 0
            },
            {
               "date": "2025-03-28",
               "low": 4.02,
               "high": 4.09,
               "close": 4.09,
               "volume": 0
            },
            {
               "date": "2025-03-27",
               "low": 4.07,
               "high": 4.125,
               "close": 4.08,
               "volume": 0
            },
            {
               "date": "2025-03-26",
               "low": 4.04,
               "high": 4.16,
               "close": 4.1,
               "volume": 0
            },
            {
               "date": "2025-03-25",
               "low": 4.04,
               "high": 4.14,
               "close": 4.09,
               "volume": 0
            },
            {
               "date": "2025-03-24",
               "low": 3.97,
               "high": 4.05,
               "close": 4.04,
               "volume": 0
            },
            {
               "date": "2025-04-08",
               "low": 3.66,
               "high": 3.84,
               "close": 3.81,
               "volume": 909892
            },
            {
               "date": "2025-04-09",
               "low": 3.62,
               "high": 3.79,
               "close": 3.66,
               "volume": 894617
            },
            {
               "date": "2025-04-10",
               "low": 3.77,
               "high": 4.1,
               "close": 3.84,
               "volume": 2064776
            },
            {
               "date": "2025-04-11",
               "low": 3.705,
               "high": 3.97,
               "close": 3.93,
               "volume": 2000313
            },
            {
               "date": "2025-04-14",
               "low": 3.815,
               "high": 3.95,
               "close": 3.89,
               "volume": 999453
            },
            {
               "date": "2025-04-15",
               "low": 3.875,
               "high": 4,
               "close": 3.88,
               "volume": 443796
            },
            {
               "date": "2025-04-16",
               "low": 3.87,
               "high": 3.97,
               "close": 3.88,
               "volume": 704265
            },
            {
               "date": "2025-04-17",
               "low": 3.83,
               "high": 3.91,
               "close": 3.87,
               "volume": 315100
            },
            {
               "date": "2025-04-22",
               "low": 3.74,
               "high": 3.83,
               "close": 3.75,
               "volume": 919493
            },
            {
               "date": "2025-04-23",
               "low": 3.75,
               "high": 3.9,
               "close": 3.9,
               "volume": 700587
            },
            {
               "date": "2025-04-24",
               "low": 3.82,
               "high": 3.94,
               "close": 3.91,
               "volume": 841298
            },
            {
               "date": "2025-04-28",
               "low": 3.91,
               "high": 4.03,
               "close": 4,
               "volume": 801947
            },
            {
               "date": "2025-04-29",
               "low": 3.96,
               "high": 4.13,
               "close": 4.1,
               "volume": 1054937
            },
            {
               "date": "2025-04-30",
               "low": 4.06,
               "high": 4.15,
               "close": 4.1,
               "volume": 1415063
            },
            {
               "date": "2025-05-01",
               "low": 4.06,
               "high": 4.15,
               "close": 4.07,
               "volume": 1007930
            },
            {
               "date": "2025-05-06",
               "low": 4.09,
               "high": 4.21,
               "close": 4.16,
               "volume": 989270
            },
            {
               "date": "2025-05-05",
               "low": 4.16,
               "high": 4.28,
               "close": 4.26,
               "volume": 1073096
            },
            {
               "date": "2025-05-02",
               "low": 4.16,
               "high": 4.28,
               "close": 4.26,
               "volume": 1372828
            },
            {
               "date": "2025-05-07",
               "low": 4.16,
               "high": 4.28,
               "close": 4.25,
               "volume": 1420160
            },
            {
               "date": "2025-05-08",
               "low": 4.18,
               "high": 4.3,
               "close": 4.18,
               "volume": 738479
            },
            {
               "date": "2025-05-09",
               "low": 4.09,
               "high": 4.21,
               "close": 4.18,
               "volume": 1095940
            },
            {
               "date": "2025-05-12",
               "low": 4.12,
               "high": 4.22,
               "close": 4.17,
               "volume": 631294
            },
            {
               "date": "2025-05-13",
               "low": 4.13,
               "high": 4.23,
               "close": 4.15,
               "volume": 419048
            },
            {
               "date": "2025-05-14",
               "low": 3.99,
               "high": 4.17,
               "close": 4,
               "volume": 963337
            },
            {
               "date": "2025-05-15",
               "low": 3.92,
               "high": 4.02,
               "close": 4.01,
               "volume": 1497102
            },
            {
               "date": "2025-05-16",
               "low": 3.9,
               "high": 3.99,
               "close": 3.96,
               "volume": 476608
            },
            {
               "date": "2025-05-18",
               "low": 3.9,
               "high": 3.99,
               "close": 3.97,
               "volume": 625453
            },
            {
               "date": "2025-05-19",
               "low": 3.88,
               "high": 4,
               "close": 3.91,
               "volume": 561158
            },
            {
               "date": "2025-05-20",
               "low": 3.83,
               "high": 3.98,
               "close": 3.865,
               "volume": 398767
            },
            {
               "date": "2025-05-21",
               "low": 3.83,
               "high": 3.98,
               "close": 3.87,
               "volume": 756624
            },
            {
               "date": "2025-05-22",
               "low": 3.83,
               "high": 3.94,
               "close": 3.92,
               "volume": 949239
            },
            {
               "date": "2025-05-23",
               "low": 3.89,
               "high": 4.03,
               "close": 4.01,
               "volume": 720801
            },
            {
               "date": "2025-05-26",
               "low": 4,
               "high": 4.11,
               "close": 4.04,
               "volume": 367848
            },
            {
               "date": "2025-05-27",
               "low": 4,
               "high": 4.12,
               "close": 4.04,
               "volume": 583767
            },
            {
               "date": "2025-05-28",
               "low": 4.01,
               "high": 4.1,
               "close": 4.05,
               "volume": 560975
            },
            {
               "date": "2025-05-29",
               "low": 4.01,
               "high": 4.12,
               "close": 4.08,
               "volume": 719333
            },
            {
               "date": "2025-06-05",
               "low": 4.17,
               "high": 4.275,
               "close": 4.23,
               "volume": 479379
            },
            {
               "date": "2025-06-06",
               "low": 4.13,
               "high": 4.26,
               "close": 4.135,
               "volume": 430719
            },
            {
               "date": "2025-06-09",
               "low": 4.115,
               "high": 4.26,
               "close": 4.13,
               "volume": 500087
            },
            {
               "date": "2025-06-10",
               "low": 4.06,
               "high": 4.14,
               "close": 4.11,
               "volume": 602518
            },
            {
               "date": "2025-06-11",
               "low": 4.04,
               "high": 4.15,
               "close": 4.1,
               "volume": 273974
            },
            {
               "date": "2025-06-12",
               "low": 4,
               "high": 4.11,
               "close": 4.02,
               "volume": 223525
            },
            {
               "date": "2025-06-13",
               "low": 4,
               "high": 4.07,
               "close": 4.01,
               "volume": 148632
            },
            {
               "date": "2025-06-16",
               "low": 3.96,
               "high": 4.07,
               "close": 4.07,
               "volume": 555897
            },
            {
               "date": "2025-06-17",
               "low": 4.04,
               "high": 4.115,
               "close": 4.07,
               "volume": 465180
            },
            {
               "date": "2025-06-18",
               "low": 4.03,
               "high": 4.12,
               "close": 4.11,
               "volume": 531893
            },
            {
               "date": "2025-06-19",
               "low": 4.04,
               "high": 4.14,
               "close": 4.04,
               "volume": 446062
            },
            {
               "date": "2025-06-20",
               "low": 3.99,
               "high": 4.07,
               "close": 4.07,
               "volume": 511130
            },
            {
               "date": "2025-06-23",
               "low": 3.93,
               "high": 4.11,
               "close": 4.02,
               "volume": 404079
            },
            {
               "date": "2025-06-24",
               "low": 3.955,
               "high": 4.03,
               "close": 4.01,
               "volume": 537455
            },
            {
               "date": "2025-06-25",
               "low": 3.91,
               "high": 4.005,
               "close": 3.96,
               "volume": 433828
            },
            {
               "date": "2025-06-26",
               "low": 3.91,
               "high": 3.985,
               "close": 3.92,
               "volume": 218402
            },
            {
               "date": "2025-06-27",
               "low": 3.89,
               "high": 4.005,
               "close": 3.91,
               "volume": 877989
            },
            {
               "date": "2025-06-30",
               "low": 3.905,
               "high": 3.985,
               "close": 3.91,
               "volume": 3519705
            },
            {
               "date": "2025-07-01",
               "low": 3.88,
               "high": 3.99,
               "close": 3.9,
               "volume": 1370900
            },
            {
               "date": "2025-07-02",
               "low": 3.87,
               "high": 3.965,
               "close": 3.87,
               "volume": 533691
            },
            {
               "date": "2025-07-03",
               "low": 3.79,
               "high": 3.93,
               "close": 3.87,
               "volume": 4614197
            },
            {
               "date": "2025-07-04",
               "low": 3.82,
               "high": 3.92,
               "close": 3.86,
               "volume": 1088853
            },
            {
               "date": "2025-07-07",
               "low": 3.85,
               "high": 3.96,
               "close": 3.88,
               "volume": 2993313
            },
            {
               "date": "2025-07-08",
               "low": 3.83,
               "high": 3.91,
               "close": 3.91,
               "volume": 807887
            },
            {
               "date": "2025-07-09",
               "low": 3.9,
               "high": 3.99,
               "close": 3.98,
               "volume": 369944
            },
            {
               "date": "2025-07-10",
               "low": 3.98,
               "high": 4.08,
               "close": 4.08,
               "volume": 407748
            },
            {
               "date": "2025-07-11",
               "low": 4.04,
               "high": 4.09,
               "close": 4.08,
               "volume": 316399
            },
            {
               "date": "2025-07-13",
               "low": 4.04,
               "high": 4.09,
               "close": 4.08,
               "volume": 316399
            },
            {
               "date": "2025-07-14",
               "low": 4.035,
               "high": 4.1,
               "close": 4.07,
               "volume": 465530
            },
            {
               "date": "2025-07-15",
               "low": 4.04,
               "high": 4.12,
               "close": 4.07,
               "volume": 264109
            },
            {
               "date": "2025-07-16",
               "low": 4.05,
               "high": 4.13,
               "close": 4.09,
               "volume": 333559
            },
            {
               "date": "2025-07-17",
               "low": 4.075,
               "high": 4.14,
               "close": 4.14,
               "volume": 360776
            },
            {
               "date": "2025-07-18",
               "low": 4.08,
               "high": 4.18,
               "close": 4.12,
               "volume": 414358
            },
            {
               "date": "2025-07-21",
               "low": 4.05,
               "high": 4.14,
               "close": 4.12,
               "volume": 368481
            },
            {
               "date": "2025-07-22",
               "low": 4.13,
               "high": 4.26,
               "close": 4.23,
               "volume": 858741
            },
            {
               "date": "2025-07-23",
               "low": 4.19,
               "high": 4.25,
               "close": 4.21,
               "volume": 464854
            },
            {
               "date": "2025-07-24",
               "low": 4.18,
               "high": 4.25,
               "close": 4.21,
               "volume": 659508
            },
            {
               "date": "2025-07-25",
               "low": 4.2,
               "high": 4.32,
               "close": 4.26,
               "volume": 508902
            },
            {
               "date": "2025-07-28",
               "low": 4.27,
               "high": 4.37,
               "close": 4.36,
               "volume": 1938676
            },
            {
               "date": "2025-07-29",
               "low": 4.35,
               "high": 4.42,
               "close": 4.39,
               "volume": 1366505
            },
            {
               "date": "2025-07-30",
               "low": 4.38,
               "high": 4.56,
               "close": 4.48,
               "volume": 1252321
            },
            {
               "date": "2025-07-31",
               "low": 4.46,
               "high": 4.53,
               "close": 4.51,
               "volume": 510395
            },
            {
               "date": "2025-08-01",
               "low": 4.45,
               "high": 4.52,
               "close": 4.47,
               "volume": 413826
            },
            {
               "date": "2025-08-04",
               "low": 4.39,
               "high": 4.52,
               "close": 4.5,
               "volume": 475748
            },
            {
               "date": "2025-08-05",
               "low": 4.49,
               "high": 4.615,
               "close": 4.61,
               "volume": 1130671
            },
            {
               "date": "2025-08-06",
               "low": 4.54,
               "high": 4.635,
               "close": 4.6,
               "volume": 764498
            },
            {
               "date": "2025-08-07",
               "low": 4.57,
               "high": 4.68,
               "close": 4.67,
               "volume": 1326431
            },
            {
               "date": "2025-08-08",
               "low": 4.56,
               "high": 4.7,
               "close": 4.6,
               "volume": 1154082
            },
            {
               "date": "2025-08-12",
               "low": 4.46,
               "high": 4.56,
               "close": 4.51,
               "volume": 408154
            },
            {
               "date": "2025-08-13",
               "low": 4.5,
               "high": 4.57,
               "close": 4.57,
               "volume": 313692
            },
            {
               "date": "2025-08-18",
               "low": 4.47,
               "high": 4.57,
               "close": 4.54,
               "volume": 245980
            },
            {
               "date": "2025-08-19",
               "low": 4.51,
               "high": 4.57,
               "close": 4.55,
               "volume": 217789
            },
            {
               "date": "2025-08-20",
               "low": 4.45,
               "high": 4.58,
               "close": 4.49,
               "volume": 250963
            },
            {
               "date": "2025-08-14",
               "low": 4.45,
               "high": 4.58,
               "close": 4.51,
               "volume": 294152
            },
            {
               "date": "2025-08-15",
               "low": 4.42,
               "high": 4.525,
               "close": 4.475,
               "volume": 372339
            },
            {
               "date": "2025-08-21",
               "low": 4.42,
               "high": 4.56,
               "close": 4.53,
               "volume": 518372
            }
         ]
      }]

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

@api_v1.get("/all")
def all_investments():
    _logger.info("All investments endpoint hit")
    return {"all_investment_data": _all_investment_data}

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

app.include_router(api_v1)
