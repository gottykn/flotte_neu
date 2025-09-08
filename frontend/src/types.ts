export type ID = number;

export type GeraetStatus = "VERFUEGBAR"|"VERMIETET"|"WARTUNG"|"AUSGEMUSTERT";
export type StandortTyp = "MIETPARK"|"KUNDE";
export type SatzEinheit = "TAEGLICH"|"MONATLICH";
export type VermietStatus = "RESERVIERT"|"OFFEN"|"GESCHLOSSEN"|"STORNIERT";
export type PosTyp = "MONTAGE"|"ERSATZTEIL"|"SERVICEPAUSCHALE"|"VERSICHERUNG"|"SONSTIGES";

export interface Firma { id: ID; name: string; ust_id?: string; adresse?: string }
export interface Mietpark { id: ID; name: string; adresse?: string }
export interface Kunde { id: ID; name: string; adresse?: string; ust_id?: string }

export interface Geraet {
  id: ID; name: string; kategorie?: string; modell?: string; seriennummer?: string;
  status: GeraetStatus; standort_typ: StandortTyp; stundenzähler: number;
  anschaffungspreis?: number; anschaffungsdatum?: string | null;
  firma_id: ID; mietpark_id?: ID | null;
}

export interface Vermietung {
  id: ID; geraet_id: ID; kunde_id: ID;
  von: string; bis: string;
  satz_wert: number; satz_einheit: SatzEinheit; status: VermietStatus;
}

export interface VermietungPosition {
  id: ID; vermietung_id: ID; typ: PosTyp; menge: number; vk_einzelpreis: number; kosten_intern: number;
}

export interface Rechnung { id: ID; vermietung_id: ID; nummer: string; datum: string; bezahlt: boolean }

export interface AuslastungItem {
  geraet_id: ID; tage_gesamt: number; tage_vermietet: number; auslastung_prozent: number;
}
export interface AuslastungResponse {
  items: AuslastungItem[]; flotte_auslastung_prozent: number;
}
