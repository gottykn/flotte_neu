from __future__ import annotations
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_
from . import models as m
from .utils.date_math import overlap_days, days_inclusive
from .schemas import SatzEinheit, VermietStatus

# ---------- CRUD helpers (illustrative subset; FastAPI endpoints use these) ----------
def list_geraete(db: Session, status=None, standort_typ=None, skip=0, limit=50):
    stmt = select(m.Geraet)
    if status:
        stmt = stmt.where(m.Geraet.status == status)
    if standort_typ:
        stmt = stmt.where(m.Geraet.standort_typ == standort_typ)
    stmt = stmt.order_by(m.Geraet.id).offset(skip).limit(limit)
    return db.scalars(stmt).all()

def count_geraete(db: Session, status=None, standort_typ=None):
    stmt = select(func.count(m.Geraet.id))
    if status:
        stmt = stmt.where(m.Geraet.status == status)
    if standort_typ:
        stmt = stmt.where(m.Geraet.standort_typ == standort_typ)
    return db.scalar(stmt)

# ---------- Reports ----------
def calc_miete_for_zeitraum(satz_wert: float, einheit: SatzEinheit, tage: int) -> float:
    if tage <= 0:
        return 0.0
    if einheit == SatzEinheit.TAEGLICH:
        return satz_wert * tage
    if einheit == SatzEinheit.MONATLICH:
        # Civil months are variable; for reporting, use 30-day commercial month for fairness
        return satz_wert * (tage / 30.0)
    return 0.0

def report_auslastung(db: Session, von: date, bis: date, geraet_id: int | None):
    assert bis >= von
    tage_gesamt = days_inclusive(von, bis)

    # Rentals overlapping the window
    v_stmt = select(m.Vermietung)
    if geraet_id:
        v_stmt = v_stmt.where(m.Vermietung.geraet_id == geraet_id)
    # Only rentals that are (offen or geschlossen or reserviert overlapping) and overlap
    v_stmt = v_stmt.where(
        or_(
            m.Vermietung.status.in_([VermietStatus.OFFEN, VermietStatus.GESCHLOSSEN, VermietStatus.RESERVIERT]),
        )
    )
    vermietungen = db.scalars(v_stmt).all()

    by_geraet = {}
    for v in vermietungen:
        overlap = overlap_days(v.von, v.bis, von, bis)
        if overlap <= 0:
            continue
        agg = by_geraet.setdefault(v.geraet_id, 0)
        by_geraet[v.geraet_id] = agg + overlap

    items = []
    sum_vermietet = 0
    # Include devices with zero rental in range
    dev_stmt = select(m.Geraet.id)
    if geraet_id:
        dev_stmt = dev_stmt.where(m.Geraet.id == geraet_id)
    dev_ids = [row for row in db.scalars(dev_stmt).all()]

    for gid in dev_ids:
        tage_v = by_geraet.get(gid, 0)
        sum_vermietet += tage_v
        auslast = (tage_v / tage_gesamt) * 100.0 if tage_gesamt else 0.0
        items.append({
            "geraet_id": gid,
            "tage_gesamt": tage_gesamt,
            "tage_vermietet": tage_v,
            "auslastung_prozent": round(auslast, 2),
        })

    flotte_auslastung = round(
        (sum_vermietet / (len(dev_ids) * tage_gesamt) * 100.0), 2
    ) if dev_ids and tage_gesamt else 0.0

    return {"items": items, "flotte_auslastung_prozent": flotte_auslastung}

def report_abrechnung(db: Session, vermietung_id: int):
    v = db.get(m.Vermietung, vermietung_id)
    if not v:
        raise ValueError("Vermietung nicht gefunden")
    if v.status not in [VermietStatus.OFFEN, VermietStatus.GESCHLOSSEN, VermietStatus.STORNIERT, VermietStatus.RESERVIERT]:
        raise ValueError("Ungültiger Status")

    tage = days_inclusive(v.von, v.bis)
    miete = calc_miete_for_zeitraum(v.satz_wert, v.satz_einheit, tage)

    # Positions
    pos_stmt = select(m.VermietungPosition).where(m.VermietungPosition.vermietung_id == v.id)
    positionen = db.scalars(pos_stmt).all()
    pos_sum = sum(p.menge * p.vk_einzelpreis for p in positionen)
    kosten_sum = sum(p.kosten_intern for p in positionen)

    einnahmen = miete + pos_sum
    marge = einnahmen - kosten_sum

    return {
        "vermietung_id": v.id,
        "mietdauer_tage": tage,
        "miete_summe": round(miete, 2),
        "positionen_summe": round(pos_sum, 2),
        "einnahmen": round(einnahmen, 2),
        "kosten_summe": round(kosten_sum, 2),
        "marge": round(marge, 2),
    }

def report_geraet_finanzen(db: Session, geraet_id: int, von: date | None = None, bis: date | None = None):
    g = db.get(m.Geraet, geraet_id)
    if not g:
        raise ValueError("Gerät nicht gefunden")

    v_stmt = select(m.Vermietung).where(m.Vermietung.geraet_id == geraet_id)
    if von and bis:
        v_stmt = v_stmt.where(or_(
            and_(m.Vermietung.von <= bis, m.Vermietung.bis >= von)
        ))
    vermietungen = db.scalars(v_stmt).all()

    einnahmen = 0.0
    kosten = 0.0
    tage_vermietet = 0
    # Evaluate each rental
    for v in vermietungen:
        w_start = von or v.von
        w_end = bis or v.bis
        overlap = overlap_days(v.von, v.bis, w_start, w_end)
        tage_vermietet += overlap

        einnahmen += calc_miete_for_zeitraum(v.satz_wert, v.satz_einheit, overlap)
        # positions
        for p in v.positionen:
            einnahmen += p.menge * p.vk_einzelpreis
            kosten += p.kosten_intern

    tage_gesamt = days_inclusive(von, bis) if (von and bis) else max(tage_vermietet, 1)  # avoid /0
    auslastung = (tage_vermietet / tage_gesamt * 100.0) if tage_gesamt else 0.0

    return {
        "geraet_id": geraet_id,
        "anzahl_vermietungen": len(vermietungen),
        "einnahmen": round(einnahmen, 2),
        "kosten": round(kosten, 2),
        "marge": round(einnahmen - kosten, 2),
        "tage_gesamt": tage_gesamt,
        "tage_vermietet": tage_vermietet,
        "auslastung_prozent": round(auslastung, 2),
    }
