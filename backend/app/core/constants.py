import json
from enum import Enum


class InvestmentType(str, Enum):
    SHARES = "Shares"
    CRYPTO = "Crypto"


class Exchanges(str, Enum):
    XASX = "XASX"
    XAMS = "XAMS"
    XBOM = "XBOM"
    XBRU = "XBRU"
    XFRA = "XFRA"
    XHKG = "XHKG"
    XJPX = "XJPX"
    XKOS = "XKOS"
    XLIS = "XLIS"
    XLON = "XLON"
    XMIL = "XMIL"
    XMSM = "XMSM"
    XNAS = "XNAS"
    XNSE = "XNSE"
    XNYS = "XNYS"
    XOSL = "XOSL"
    XSAU = "XSAU"
    XSHE = "XSHE"
    XSHG = "XSHG"
    XSWX = "XSWX"
    XTAI = "XTAI"
    XTSE = "XTSE"


class Platforms(str, Enum):
    CMC = "CMC"
    LINK = "LINK"
    BOARDROOM = "BOARDROOM"
    DIRECT = "DIRECT"
    IPO = "IPO"


class Currencies(str, Enum):
    AUD = "AUD"
    USD = "USD"


def enum_to_list(enum_cls):
    return [e.value for e in enum_cls]


def get_constants():
    constants = {
        "type": enum_to_list(InvestmentType),
        "currency": enum_to_list(Currencies),
        "exchange": enum_to_list(Exchanges),
        "platform": enum_to_list(Platforms),
    }

    return json.dumps(constants)
