from __future__ import annotations
from datetime import date, datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Float, Date, DateTime, Boolean, ForeignKey, Enum as SAEnum,
    UniqueConstraint, CheckConstraint, Text, Index
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

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

# ---------- Entities ----------
class Firma(Base):
    __tablename__ = "firmen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    ust_id: Mapped[Optional[str]] = mapped_column(String(50))
    adresse: Mapped[Optional[str]] = mapped_column(Text)

    geraete: Mapped[List["Geraet"]] = relationship(back_populates="firma", cascade="all, delete")

class Mietpark(Base):
    __tablename__ = "mietparks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    adresse: Mapped[Optional[str]] = mapped_column(Text)

    geraete: Mapped[List["Geraet"]] = relationship(back_populates="mietpark")

class Kunde(Base):
    __tablename__ = "kunden"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    adresse: Mapped[Optional[str]] = mapped_column(Text)
    ust_id: Mapped[Optional[str]] = mapped_column(String(50))

    vermietungen: Mapped[List["Vermietung"]] = relationship(back_populates="kunde")

class Geraet(Base):
    __tablename__ = "geraete"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    kategorie: Mapped[Optional[str]] = mapped_column(String(120))
    modell: Mapped[Optional[str]] = mapped_column(String(120))
    seriennummer: Mapped[Optional[str]] = mapped_column(String(120), unique=True)
    status: Mapped[GeraetStatus] = mapped_column(SAEnum(GeraetStatus), default=GeraetStatus.VERFUEGBAR, nullable=False)
    standort_typ: Mapped[StandortTyp] = mapped_column(SAEnum(StandortTyp), default=StandortTyp.MIETPARK, nullable=False)
    stundenzähler: Mapped[float] = mapped_column(Float, default=0.0)
    anschaffungspreis: Mapped[Optional[float]] = mapped_column(Float)
    anschaffungsdatum: Mapped[Optional[date]] = mapped_column(Date)

    firma_id: Mapped[int] = mapped_column(ForeignKey("firmen.id"), nullable=False)
    mietpark_id: Mapped[Optional[int]] = mapped_column(ForeignKey("mietparks.id"))

    firma: Mapped["Firma"] = relationship(back_populates="geraete")
    mietpark: Mapped[Optional["Mietpark"]] = relationship(back_populates="geraete")
    vermietungen: Mapped[List["Vermietung"]] = relationship(back_populates="geraet")
    wartungen: Mapped[List["Wartung"]] = relationship(back_populates="geraet", cascade="all, delete-orphan")
    zaehlerstaende: Mapped[List["Zaehlerstand"]] = relationship(back_populates="geraet", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_geraete_status", "status"),
    )

class Vermietung(Base):
    __tablename__ = "vermietungen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    geraet_id: Mapped[int] = mapped_column(ForeignKey("geraete.id"), nullable=False, index=True)
    kunde_id: Mapped[int] = mapped_column(ForeignKey("kunden.id"), nullable=False, index=True)

    von: Mapped[date] = mapped_column(Date, nullable=False)
    bis: Mapped[date] = mapped_column(Date, nullable=False)
    satz_wert: Mapped[float] = mapped_column(Float, nullable=False)
    satz_einheit: Mapped[SatzEinheit] = mapped_column(SAEnum(SatzEinheit), nullable=False)
    status: Mapped[VermietStatus] = mapped_column(SAEnum(VermietStatus), default=VermietStatus.RESERVIERT, nullable=False)

    geraet: Mapped["Geraet"] = relationship(back_populates="vermietungen")
    kunde: Mapped["Kunde"] = relationship(back_populates="vermietungen")
    positionen: Mapped[List["VermietungPosition"]] = relationship(back_populates="vermietung", cascade="all, delete-orphan")
    rechnungen: Mapped[List["Rechnung"]] = relationship(back_populates="vermietung", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("bis >= von", name="ck_zeitraum_gueltig"),
    )

class VermietungPosition(Base):
    __tablename__ = "vermietung_positionen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vermietung_id: Mapped[int] = mapped_column(ForeignKey("vermietungen.id"), nullable=False, index=True)
    typ: Mapped[PosTyp] = mapped_column(SAEnum(PosTyp), nullable=False)
    menge: Mapped[float] = mapped_column(Float, default=1.0)
    vk_einzelpreis: Mapped[float] = mapped_column(Float, default=0.0)   # Verkaufspreis pro Einheit
    kosten_intern: Mapped[float] = mapped_column(Float, default=0.0)    # interne Kosten (Selbstkosten)

    vermietung: Mapped["Vermietung"] = relationship(back_populates="positionen")

class Rechnung(Base):
    __tablename__ = "rechnungen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vermietung_id: Mapped[int] = mapped_column(ForeignKey("vermietungen.id"), nullable=False, index=True)
    nummer: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    bezahlt: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    vermietung: Mapped["Vermietung"] = relationship(back_populates="rechnungen")

    __table_args__ = (UniqueConstraint("nummer", name="uq_rechnung_nummer"),)

class Wartung(Base):
    __tablename__ = "wartungen"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    geraet_id: Mapped[int] = mapped_column(ForeignKey("geraete.id"), nullable=False, index=True)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    beschreibung: Mapped[Optional[str]] = mapped_column(Text)
    kosten: Mapped[float] = mapped_column(Float, default=0.0)

    geraet: Mapped["Geraet"] = relationship(back_populates="wartungen")

class Zaehlerstand(Base):
    __tablename__ = "zaehlerstaende"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    geraet_id: Mapped[int] = mapped_column(ForeignKey("geraete.id"), nullable=False, index=True)
    zeitpunkt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stunden: Mapped[float] = mapped_column(Float, default=0.0)

    geraet: Mapped["Geraet"] = relationship(back_populates="zaehlerstaende")
