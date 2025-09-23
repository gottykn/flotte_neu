# backend/schemas.py
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, field_validator, FieldValidationInfo, ConfigDict


# ---------- Enums ----------
class GeraetStatus(str, Enum):
    VERFUEGBAR = "VERFUEGBAR"
    VERMIETET = "VERMIETET"
    WARTUNG = "WARTUNG"
    AUSGEMUSTERT = "AUSGEMUSTERT"


class StandortTyp(str, Enum):
    MIETPARK = "MIETPARK"
    KUNDE = "KUNDE"


class SatzEinheit(str, Enum):
    TAEGLICH = "TAEGLICH"
    WOECHENTLICH = "WOECHENTLICH"
    MONATLICH = "MONATLICH"


class VermietStatus(str, Enum):
    RESERVIERT = "RESERVIERT"
    OFFEN = "OFFEN"
    GESCHLOSSEN = "GESCHLOSSEN"
    STORNIERT = "STORNIERT"


class PosTyp(str, Enum):
    MONTAGE = "MONTAGE"
    ERSATZTEIL = "ERSATZTEIL"
    SERVICEPAUSCHALE = "SERVICEPAUSCHALE"
    VERSICHERUNG = "VERSICHERUNG"
    SONSTIGES = "SONSTIGES"


# ---------- Stammdaten ----------
class FirmaBase(BaseModel):
    name: str
    ust_id: Optional[str] = None
    adresse: Optional[str] = None


class FirmaOut(FirmaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class MietparkBase(BaseModel):
    name: str
    adresse: Optional[str] = None


class MietparkOut(MietparkBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class KundeBase(BaseModel):
    name: str
    adresse: Optional[str] = None
    ust_id: Optional[str] = None


class KundeOut(KundeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Gerät ----------
class GeraetBase(BaseModel):
    name: str
    kategorie: Optional[str] = None
    modell: Optional[str] = None
    seriennummer: Optional[str] = None

    status: GeraetStatus = GeraetStatus.VERFUEGBAR
    standort_typ: StandortTyp = StandortTyp.MIETPARK
    stundenzähler: float = 0.0

    anschaffungspreis: Optional[float] = None
    anschaffungsdatum: Optional[date] = None

    # NEU
    baujahr: Optional[int] = None
    mietpreis_wert: Optional[float] = None
    mietpreis_einheit: Optional[SatzEinheit] = None
    vermietet_in: Optional[str] = None  # ISO-3166-1 alpha-2

    firma_id: int
    mietpark_id: Optional[int] = None


class GeraetOut(GeraetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Vermietung ----------
class VermietungBase(BaseModel):
    geraet_id: int
    kunde_id: int
    von: date
    bis: Optional[date] = None  # offenes Ende erlaubt
    satz_wert: float
    satz_einheit: SatzEinheit
    status: VermietStatus = VermietStatus.RESERVIERT

    @field_validator("bis")
    @classmethod
    def _check_range(cls, v: Optional[date], info: FieldValidationInfo):
        von = info.data.get("von")
        if v is not None and von is not None and v < von:
            raise ValueError("bis < von")
        return v


class VermietungOut(VermietungBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class VermietungPositionBase(BaseModel):
    vermietung_id: int
    typ: PosTyp
    menge: float = 1.0
    vk_einzelpreis: float = 0.0
    kosten_intern: float = 0.0


class VermietungPositionOut(VermietungPositionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Rechnung / Wartung / Zähler ----------
class RechnungBase(BaseModel):
    vermietung_id: int
    nummer: str
    datum: date
    bezahlt: bool = False


class RechnungOut(RechnungBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WartungBase(BaseModel):
    geraet_id: int
    datum: date
    beschreibung: Optional[str] = None
    kosten: float = 0.0


class WartungOut(WartungBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ZaehlerstandBase(BaseModel):
    geraet_id: int
    zeitpunkt: datetime
    stunden: float


class ZaehlerstandOut(ZaehlerstandBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Reports ----------
class AuslastungRequest(BaseModel):
    von: date
    bis: date
    geraet_id: Optional[int] = None  # None = alle


class AuslastungItem(BaseModel):
    geraet_id: int
    tage_gesamt: int
    tage_vermietet: int
    auslastung_prozent: float


class AuslastungResponse(BaseModel):
    items: List[AuslastungItem]
    flotte_auslastung_prozent: float


class AbrechnungResponse(BaseModel):
    vermietung_id: int
    mietdauer_tage: int
    miete_summe: float
    positionen_summe: float
    einnahmen: float
    kosten_summe: float
    marge: float


class GeraetFinanzenResponse(BaseModel):
    geraet_id: int
    anzahl_vermietungen: int
    einnahmen: float
    kosten: float
    marge: float
    tage_gesamt: int
    tage_vermietet: int
    auslastung_prozent: float
