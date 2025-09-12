import { useEffect, useState } from "react";
import { api } from "../api";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

// Falls du einen eigenen Typ willst, kannst du die Union hier verwenden.
type Einheit = "TAEGLICH" | "WOECHENTLICH" | "MONATLICH";

// Kategorie-Auswahl (Dropdown)
const CATEGORIES = [
  "Bohrgerät",
  "Bagger & Bohrlafette",
  "Kompressor",
  "Injektionstechnik",
  "Pumpe",
  "Datenlogger",
  "LiPAD",
] as const;
type Kategorie = (typeof CATEGORIES)[number];

type Firma = { id: number; name: string };
type Mietpark = { id: number; name: string };

export default function NewDeviceModal({ open, onClose, onCreated }: Props) {
  // Basis
  const [name, setName] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie>("Kompressor");
  const [status, setStatus] = useState<"VERFUEGBAR" | "VERMIETET" | "WARTUNG" | "AUSGEMUSTERT">("VERFUEGBAR");
  const [standort, setStandort] = useState<"MIETPARK" | "KUNDE">("MIETPARK");
  const [firmaId, setFirmaId] = useState<number | "">("");
  const [mietparkId, setMietparkId] = useState<number | "">("");

  // Zusatzfelder
  const [baujahr, setBaujahr] = useState<string>("");
  const [vermietetIn, setVermietetIn] = useState<string>("");
  const [mietpreis, setMietpreis] = useState<string>("");
  const [mietEinheit, setMietEinheit] = useState<Einheit>("MONATLICH");

  // Stammdaten
  const [firmen, setFirmen] = useState<Firma[]>([]);
  const [parks, setParks] = useState<Mietpark[]>([]);

  // UI
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.listFirmen(), api.listMietparks()])
      .then(([f, p]) => {
        setFirmen(f);
        setParks(p);
      })
      .catch((e) => setErr(String(e)));
  }, [open]);

  async function submit() {
    setErr(null);

    if (!name.trim()) return setErr("Name ist Pflicht.");
    if (!firmaId) return setErr("Bitte eine Firma wählen.");
    if (standort === "MIETPARK" && !mietparkId) return setErr("Bitte einen Mietpark wählen.");

    if (baujahr && !/^\d{4}$/.test(baujahr)) {
      return setErr("Baujahr bitte als vierstellige Zahl angeben (z. B. 2021).");
    }
    if (vermietetIn && !/^[A-Za-z]{2}$/.test(vermietetIn)) {
      return setErr("„Vermietet in“ bitte als 2-Buchstaben-Ländercode angeben (z. B. DE, AT).");
    }
    if (mietpreis && isNaN(Number(mietpreis))) {
      return setErr("Mietpreis bitte als Zahl angeben.");
    }

    setBusy(true);
    try {
      await api.createGeraet({
        name,
        kategorie, // kommt jetzt aus dem Dropdown
        status,
        standort_typ: standort,
        firma_id: Number(firmaId),
        mietpark_id: standort === "MIETPARK" ? Number(mietparkId) : null,

        baujahr: baujahr ? Number(baujahr) : null,
        vermietet_in: vermietetIn ? vermietetIn.toUpperCase() : null,
        mietpreis_wert: mietpreis ? Number(mietpreis) : null,
        mietpreis_einheit: mietpreis ? mietEinheit : null,
      });

      onCreated();
      onClose();

      // Reset
      setName("");
      setKategorie("Kompressor");
      setStatus("VERFUEGBAR");
      setStandort("MIETPARK");
      setFirmaId("");
      setMietparkId("");
      setBaujahr("");
      setVermietetIn("");
      setMietpreis("");
      setMietEinheit("MONATLICH");
    } catch (e: any) {
      setErr(e?.message ?? "Fehler beim Anlegen.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Neues Gerät</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">
            ✕
          </button>
        </div>

        {err && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="space-y-3">
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Name *</span>
            <input className="rounded-xl border p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          {/* Kategorie: als Dropdown */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Kategorie</span>
            <select
              className="rounded-xl border p-2"
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value as Kategorie)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Status + Standort */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Status</span>
              <select
                className="rounded-xl border p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="VERFUEGBAR">VERFUEGBAR</option>
                <option value="VERMIETET">VERMIETET</option>
                <option value="WARTUNG">WARTUNG</option>
                <option value="AUSGEMUSTERT">AUSGEMUSTERT</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Standort-Typ</span>
              <select
                className="rounded-xl border p-2"
                value={standort}
                onChange={(e) => setStandort(e.target.value as any)}
              >
                <option value="MIETPARK">MIETPARK</option>
                <option value="KUNDE">KUNDE</option>
              </select>
            </label>
          </div>

          {/* Zuordnung */}
          <label className="flex flex-col gap-1">
            <span className="text-sm">Firma *</span>
            <select
              className="rounded-xl border p-2"
              value={firmaId}
              onChange={(e) => setFirmaId(Number(e.target.value))}
            >
              <option value="">— wählen —</option>
              {firmen.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          {standort === "MIETPARK" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm">Mietpark *</span>
              <select
                className="rounded-xl border p-2"
                value={mietparkId}
                onChange={(e) => setMietparkId(Number(e.target.value))}
              >
                <option value="">— wählen —</option>
                {parks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Zusatzinfos */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Baujahr</span>
              <input
                className="rounded-xl border p-2"
                inputMode="numeric"
                placeholder="z. B. 2021"
                value={baujahr}
                onChange={(e) => setBaujahr(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Vermietet in (Land)</span>
              <input
                className="rounded-xl border p-2"
                placeholder="DE / AT / CH …"
                value={vermietetIn}
                onChange={(e) => setVermietetIn(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Mietpreis</span>
              <input
                className="rounded-xl border p-2"
                inputMode="decimal"
                placeholder="z. B. 1200"
                value={mietpreis}
                onChange={(e) => setMietpreis(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Einheit</span>
              <select
                className="rounded-xl border p-2"
                value={mietEinheit}
                onChange={(e) => setMietEinheit(e.target.value as Einheit)}
                disabled={!mietpreis}
                title={!mietpreis ? "Erst Mietpreis eingeben" : undefined}
              >
                <option value="TAEGLICH">TAEGLICH</option>
                <option value="WOECHENTLICH">WOECHENTLICH</option>
                <option value="MONATLICH">MONATLICH</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>
            Abbrechen
          </button>
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
