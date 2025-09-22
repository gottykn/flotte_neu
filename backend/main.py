# backend/main.py
from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text


from . import models as m
from . import schemas as s
from .database import engine, get_db
from .logic import (
    report_auslastung,
    report_abrechnung,
    report_geraet_finanzen,
    list_geraete,
    count_geraete,
)

# -------------------------------------------------------------------
# FastAPI & CORS
# -------------------------------------------------------------------
app = FastAPI(title="Mietpark API", version="1.0.0")

ALLOWED_ORIGINS = [
    "https://flotte-neu-1.onrender.com",  # Frontend (Render static site)
    "https://flotte-neu.onrender.com",    # API (für Tests mit Swagger etc.)
    "http://localhost:5173",              # Lokale Entwicklung (Vite)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# Tabellen bei Start anlegen (nur für den ersten Boot; produktiv Alembic verwenden)
@app.on_event("startup")
def startup_create_tables() -> None:
    m.Base.metadata.create_all(bind=engine)
    ensure_columns()


# Healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}

def ensure_columns() -> None:
    stmts = """
    ALTER TABLE geraete ADD COLUMN IF NOT EXISTS baujahr INTEGER;
    ALTER TABLE geraete ADD COLUMN IF NOT EXISTS mietpreis_wert NUMERIC;
    ALTER TABLE geraete ADD COLUMN IF NOT EXISTS mietpreis_einheit VARCHAR(20);
    ALTER TABLE geraete ADD COLUMN IF NOT EXISTS vermietet_in VARCHAR(2);
    """
    with engine.begin() as conn:
        conn.execute(text(stmts))

# -------------------------------------------------------------------
# FIRMA
# -------------------------------------------------------------------
@app.post("/firmen", response_model=s.FirmaOut)
def create_firma(payload: s.FirmaBase, db: Session = Depends(get_db)):
    obj = m.Firma(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/firmen", response_model=List[s.FirmaOut])
def list_firmen(db: Session = Depends(get_db)):
    return db.query(m.Firma).order_by(m.Firma.name).all()

@app.put("/firmen/{firma_id}", response_model=s.FirmaOut)
def update_firma(firma_id: int, payload: s.FirmaBase, db: Session = Depends(get_db)):
    obj = db.get(m.Firma, firma_id)
    if not obj:
        raise HTTPException(404, "Firma nicht gefunden")
    for k, v in payload.dict().items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@app.delete("/firmen/{firma_id}", status_code=204)
def delete_firma(firma_id: int, db: Session = Depends(get_db)):
    obj = db.get(m.Firma, firma_id)
    if not obj:
        raise HTTPException(404, "Firma nicht gefunden")
    db.delete(obj); db.commit()
    return
# -------------------------------------------------------------------
# MIETPARK
# -------------------------------------------------------------------
@app.post("/mietparks", response_model=s.MietparkOut)
def create_mietpark(payload: s.MietparkBase, db: Session = Depends(get_db)):
    obj = m.Mietpark(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/mietparks", response_model=List[s.MietparkOut])
def list_mietparks(db: Session = Depends(get_db)):
    return db.query(m.Mietpark).order_by(m.Mietpark.name).all()

# --- MIETPARK update/delete ---
@app.put("/mietparks/{mietpark_id}", response_model=s.MietparkOut)
def update_mietpark(mietpark_id: int, payload: s.MietparkBase, db: Session = Depends(get_db)):
    obj = db.get(m.Mietpark, mietpark_id)
    if not obj:
        raise HTTPException(404, "Mietpark nicht gefunden")
    for k, v in payload.dict().items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@app.delete("/mietparks/{mietpark_id}", status_code=204)
def delete_mietpark(mietpark_id: int, db: Session = Depends(get_db)):
    obj = db.get(m.Mietpark, mietpark_id)
    if not obj:
        raise HTTPException(404, "Mietpark nicht gefunden")
    db.delete(obj); db.commit()
    return

# -------------------------------------------------------------------
# KUNDE
# -------------------------------------------------------------------
@app.post("/kunden", response_model=s.KundeOut)
def create_kunde(payload: s.KundeBase, db: Session = Depends(get_db)):
    obj = m.Kunde(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/kunden", response_model=List[s.KundeOut])
def list_kunden(db: Session = Depends(get_db)):
    return db.query(m.Kunde).order_by(m.Kunde.name).all()


@app.put("/kunden/{kunde_id}", response_model=s.KundeOut)
def update_kunde(kunde_id: int, payload: s.KundeBase, db: Session = Depends(get_db)):
    obj = db.get(m.Kunde, kunde_id)
    if not obj:
        raise HTTPException(404, "Kunde nicht gefunden")
    for k, v in payload.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


# -------------------------------------------------------------------
# GERÄT
# -------------------------------------------------------------------
@app.post("/geraete", response_model=s.GeraetOut)
def create_geraet(payload: s.GeraetBase, db: Session = Depends(get_db)):
    obj = m.Geraet(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/geraete", response_model=List[s.GeraetOut])
def list_geraete_endpoint(
    status: Optional[s.GeraetStatus] = Query(None),
    standort_typ: Optional[s.StandortTyp] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return list_geraete(db, status=status, standort_typ=standort_typ, skip=skip, limit=limit)


@app.get("/geraete/count")
def count_geraete_endpoint(
    status: Optional[s.GeraetStatus] = Query(None),
    standort_typ: Optional[s.StandortTyp] = Query(None),
    db: Session = Depends(get_db),
):
    # Frontend erwartet eine nackte Zahl (JSON number)
    return count_geraete(db, status=status, standort_typ=standort_typ)


@app.put("/geraete/{geraet_id}", response_model=s.GeraetOut)
def update_geraet(geraet_id: int, payload: s.GeraetBase, db: Session = Depends(get_db)):
    obj = db.get(m.Geraet, geraet_id)
    if not obj:
        raise HTTPException(404, "Gerät nicht gefunden")
    for k, v in payload.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

@app.delete("/geraete/{geraet_id}")
def delete_geraet(geraet_id: int, db: Session = Depends(get_db)):
    g = db.get(m.Geraet, geraet_id)
    if not g:
        raise HTTPException(404, "Gerät nicht gefunden")
    try:
        db.delete(g)
        db.commit()
    except IntegrityError:
        db.rollback()
        # Falls z. B. Vermietungen/Wartungen auf das Gerät zeigen
        raise HTTPException(409, "Gerät hat Referenzen (z. B. Vermietungen/Wartungen) und kann nicht gelöscht werden.")
    return {"ok": True}

# Einzelgerät laden
@app.get("/geraete/{geraet_id}", response_model=s.GeraetOut)
def get_geraet(geraet_id: int, db: Session = Depends(get_db)):
    obj = db.get(m.Geraet, geraet_id)
    if not obj:
        raise HTTPException(404, "Gerät nicht gefunden")
    return obj

# Vermietungen zu einem Gerät
@app.get("/geraete/{geraet_id}/vermietungen", response_model=List[s.VermietungOut])
def list_vermietungen_geraet(geraet_id: int, db: Session = Depends(get_db)):
    return (
        db.query(m.Vermietung)
        .filter(m.Vermietung.geraet_id == geraet_id)
        .order_by(m.Vermietung.von.desc())
        .all()
    )


# -------------------------------------------------------------------
# VERMIETUNG
# -------------------------------------------------------------------
@app.post("/vermietungen", response_model=s.VermietungOut)
def create_vermietung(payload: s.VermietungBase, db: Session = Depends(get_db)):
    # Validierung macht das Schema; hier nur persistieren
    obj = m.Vermietung(**payload.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/vermietungen", response_model=list[s.VermietungOut])
def list_vermietungen(db: Session = Depends(get_db)):
    return db.query(m.Vermietung).order_by(m.Vermietung.id.desc()).all()

@app.post("/vermietungen/{vermietung_id}/starten", response_model=s.VermietungOut)
def starten(vermietung_id: int, db: Session = Depends(get_db)):
    v = db.get(m.Vermietung, vermietung_id)
    if not v:
        raise HTTPException(404, "Vermietung nicht gefunden")
    v.status = s.VermietStatus.OFFEN
    v.geraet.status = s.GeraetStatus.VERMIETET
    v.geraet.standort_typ = s.StandortTyp.KUNDE
    db.commit(); db.refresh(v)
    return v

@app.post("/vermietungen/{vermietung_id}/schliessen", response_model=s.VermietungOut)
def schliessen(vermietung_id: int, bis: Optional[_date] = None, db: Session = Depends(get_db)):
    v = db.get(m.Vermietung, vermietung_id)
    if not v:
        raise HTTPException(404, "Vermietung nicht gefunden")
    v.status = s.VermietStatus.GESCHLOSSEN
    v.bis = bis or _date.today()  # Default: heute
    v.geraet.status = s.GeraetStatus.VERFUEGBAR
    v.geraet.standort_typ = s.StandortTyp.MIETPARK
    db.commit(); db.refresh(v)
    return v


# -------------------------------------------------------------------
# POSITIONEN
# -------------------------------------------------------------------
@app.post("/vermietung-positionen", response_model=s.VermietungPositionOut)
def add_position(payload: s.VermietungPositionBase, db: Session = Depends(get_db)):
    obj = m.VermietungPosition(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# -------------------------------------------------------------------
# RECHNUNG
# -------------------------------------------------------------------
@app.post("/rechnungen", response_model=s.RechnungOut)
def create_rechnung(payload: s.RechnungBase, db: Session = Depends(get_db)):
    obj = m.Rechnung(**payload.dict())
    db.add(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(400, "Rechnungsnummer bereits vergeben")
    db.refresh(obj)
    return obj


@app.get("/rechnungen/suche", response_model=List[s.RechnungOut])
def search_rechnungen(nummer: str, db: Session = Depends(get_db)):
    return db.query(m.Rechnung).filter(m.Rechnung.nummer.ilike(f"%{nummer}%")).all()


@app.patch("/rechnungen/{rechnung_id}/bezahlt", response_model=s.RechnungOut)
def toggle_rechnung_bezahlt(rechnung_id: int, bezahlt: bool, db: Session = Depends(get_db)):
    r = db.get(m.Rechnung, rechnung_id)
    if not r:
        raise HTTPException(404, "Rechnung nicht gefunden")
    r.bezahlt = bezahlt
    db.commit()
    db.refresh(r)
    return r


# -------------------------------------------------------------------
# WARTUNG / ZÄHLER
# -------------------------------------------------------------------
@app.post("/wartungen", response_model=s.WartungOut)
def create_wartung(payload: s.WartungBase, db: Session = Depends(get_db)):
    obj = m.Wartung(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/wartungen", response_model=List[s.WartungOut])
def list_wartungen(db: Session = Depends(get_db)):
    return db.query(m.Wartung).order_by(m.Wartung.datum.desc()).all()


@app.post("/zaehlerstaende", response_model=s.ZaehlerstandOut)
def create_zaehler(payload: s.ZaehlerstandBase, db: Session = Depends(get_db)):
    obj = m.Zaehlerstand(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# -------------------------------------------------------------------
# BERICHTE
# -------------------------------------------------------------------
@app.post("/berichte/auslastung", response_model=s.AuslastungResponse)
def berichte_auslastung(req: s.AuslastungRequest, db: Session = Depends(get_db)):
    try:
        data = report_auslastung(db, req.von, req.bis, req.geraet_id)
    except AssertionError:
        raise HTTPException(400, "Ungültiger Zeitraum")
    return data


@app.get("/berichte/vermietungen/{vermietung_id}/abrechnung", response_model=s.AbrechnungResponse)
def abrechnung(vermietung_id: int, db: Session = Depends(get_db)):
    try:
        data = report_abrechnung(db, vermietung_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return data


@app.get("/berichte/geraete/{geraet_id}/finanzen", response_model=s.GeraetFinanzenResponse)
def geraet_finanzen(
    geraet_id: int,
    von: Optional[date] = None,
    bis: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        data = report_geraet_finanzen(db, geraet_id, von, bis)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return data
