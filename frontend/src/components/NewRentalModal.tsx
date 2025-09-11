import { useEffect, useState } from "react";
import { api } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // nach erfolgreichem Anlegen: Liste neu laden
};

type IdName = { id: number; name: string };

export default function NewRentalModal({ open, onClose, onCreated }: Props) {
  const [geraete, setGeraete] = useState<IdName[]>([]);
  const [kunden, setKunden] = useState<IdName[]>([]);

  const [geraetId, setGeraetId] = useState<number | "">("");
  const [kundeId, setKundeId] = useState<number | "">("");
  const [von, setVon] = useState<string>("");
  const [bis, setBis] = useState<string>("");
  const [preis, setPreis] = useState<string>("");             // optional
  const [preisEinheit, setPreisEinheit] = useState("MONATLICH"); // optional

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    Promise.all([
      // nur verfügbare Geräte zur Auswahl
      api.listGeraete({ status: "VERFUEGBAR", skip: 0, limit: 500 }),
      api.listKunden(),
    ])
      .then(([gs, ks]) => {
        // `listGeraete` liefert mehr Felder; wir brauchen nur id & name
        setGeraete(gs.map((g: any) => ({ id: g.id, name: g.name })));
        setKunden(ks.map((k: any) => ({ id: k.id, name: k.name })));
      })
      .catch((e) => setErr(String(e)));
  }, [open]);

  async function submit() {
    setErr(null);

    if (!geraetId) return setErr("Bitte ein Gerät wählen.");
    if (!kundeId) return setErr("Bitte einen Kunden wählen.");
    if (!von || !bis) return setErr("Bitte Zeitraum (von/bis) wählen.");
    if (bis < von) return setErr("Das Enddatum liegt vor dem Startdatum.");

    const body: any = {
      geraet_id: Number(geraetId),
      kunde_id: Number(kundeId),
      von,
      bis,
    };
    if (preis.trim() !== "") {
      // Feldnamen optional – Backend akzeptiert sie, falls vorhanden
      body.preis = Number(preis);
      body.preis_einheit = preisEinheit; // z.B. "MONATLICH"
    }

    setBusy(true);
    try {
      await api.createVermietung(body);
      // Reset + schließen
      setGeraetId(""); setKundeId(""); setVon(""); setBis(""); setPreis(""); setPreisEinheit("MONATLICH");
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Fehler beim Anlegen der Vermietung.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Neue Vermietung</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">✕</button>
        </div>

        {err && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Gerät *</span>
            <select
              className="rounded-xl border p-2"
              value={geraetId}
              onChange={(e) => setGeraetId(Number(e.target.value))}
            >
              <option value="">— wählen —</option>
              {geraete.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Kunde *</span>
            <select
              className="rounded-xl border p-2"
              value={kundeId}
              onChange={(e) => setKundeId(Number(e.target.value))}
            >
              <option value="">— wählen —</option>
              {kunden.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Von *</span>
              <input type="date" className="rounded-xl border p-2" value={von} onChange={(e) => setVon(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Bis *</span>
              <input type="date" className="rounded-xl border p-2" value={bis} onChange={(e) => setBis(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Preis (optional)</span>
              <input
                inputMode="decimal"
                className="rounded-xl border p-2"
                placeholder="z. B. 9000"
                value={preis}
                onChange={(e) => setPreis(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Einheit</span>
              <select
                className="rounded-xl border p-2"
                value={preisEinheit}
                onChange={(e) => setPreisEinheit(e.target.value)}
              >
                <option>TAEGLICH</option>
                <option>WOECHENTLICH</option>
                <option>MONATLICH</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>Abbrechen</button>
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Speichern…" : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
