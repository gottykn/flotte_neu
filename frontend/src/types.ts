export type ID = number;

export type GeraetStatus = "VERFUEGBAR" | "VERMIETET" | "WARTUNG" | "AUSGEMUSTERT";
export type StandortTyp  = "MIETPARK" | "KUNDE";

/** Einheiten für Miet-/Satzpreise */
export type SatzEinheit = "TAEGLICH" | "WOECHENTLICH" | "MONATLICH";

export type VermietStatus = "RESERVIERT" | "OFFEN" | "GESCHLOSSEN" | "STORNIERT";
export type PosTyp        = "MONTAGE" | "ERSATZTEIL" | "SERVICEPAUSCHALE" | "VERSICHERUNG" | "SONSTIGES";

export interface IdName   { id: ID; name: string }
export interface Firma    extends IdName { ust_id?: string; adresse?: string }
export interface Mietpark extends IdName { adresse?: string }
export interface Kunde    extends IdName { adresse?: string; ust_id?: string }

/** Serverantwort für /geraete/count */
export interface CountResponse { count: number }

/** Gerät – plus neue Felder (alle optional/nullable, wie in der DB) */
export interface Geraet {
  id: ID;
  name: string;
  kategorie?: string;
  modell?: string;
  seriennummer?: string;

  status: GeraetStatus;
  standort_typ: StandortTyp;
  stundenzähler: number;

  anschaffungspreis?: number;
  anschaffungsdatum?: string | null;

  // NEU
  baujahr?: number | null;
  mietpreis_wert?: number | null;
  mietpreis_einheit?: SatzEinheit | null;
  /** ISO-3166-1 alpha-2 (z. B. DE, AT) */
  vermietet_in?: string | null;

  firma_id: ID;
  mietpark_id?: ID | null;
}

export interface Vermietung {
  id: ID;
  geraet_id: ID;
  kunde_id: ID;
  von: string; // ISO-Date
  bis: string; // ISO-Date
  satz_wert: number;
  satz_einheit: SatzEinheit;
  status: VermietStatus;
}

export interface VermietungPosition {
  id: ID;
  vermietung_id: ID;
  typ: PosTyp;
  menge: number;
  vk_einzelpreis: number;
  kosten_intern: number;
}

export interface Rechnung {
  id: ID;
  vermietung_id: ID;
  nummer: string;
  datum: string; // ISO-Date
  bezahlt: boolean;
}

export interface AuslastungItem {
  geraet_id: ID;
  tage_gesamt: number;
  tage_vermietet: number;
  auslastung_prozent: number;
}
export interface AuslastungResponse {
  items: AuslastungItem[];
  flotte_auslastung_prozent: number;
}
