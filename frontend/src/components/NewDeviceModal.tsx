import { useEffect, useState } from "react";
import { api } from "../api";

type Props = { open: boolean; onClose: () => void; onCreated: () => void; };

type Firma = { id: number; name: string };
type Mietpark = { id: number; name: string };

export default function NewDeviceModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [kategorie, setKategorie] = useState("Kompressor");
  const [status, setStatus] = useState("VERFUEGBAR");
  const [standort, setStandort] = useState<"MIETPARK" | "KUNDE">("MIETPARK");
  const [firmaId, setFirmaId] = useState<number | "">("");
  const [mietparkId, setMietparkId] = useState<number | "">("");
  const [firmen, setFirmen] = useState<Firma[]>([]);
  const [parks, setParks] = useState<Mietpark[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.listFirmen(), api.listMietparks()])
      .then(([f, p]) => { setFirmen(f); setParks(p); })
      .catch(e => setErr(String(e)));
  }, [open]);

  async function submit() {
    setErr(null);
    if (!name.trim()) return setErr("Name ist Pflicht.");
    if (!firmaId) return setErr("Bitte eine Firma wählen.");
    if (standort === "MIETPARK" && !mietparkId) return setErr("Bitte einen Mietpark wählen.");

    setBusy(true);
    try {
      await api.createGeraet({
        name,
        kategorie,
        status,
        standort_typ: standort,
        firma_id: Number(firmaId),
        mietpark_id: standort === "MIETPARK" ? Number(mietparkId) : null,
      });
      onCreated();
      onClose();
      // reset
      setName(""); setKategorie("Kompressor"); setStatus("VERFUEGBAR");
      setStandort("MIETPARK"); setFirmaId(""); setMietparkId("");
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
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">✕</button>
        </div>

        {err && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Name *</span>
            <input className="rounded-xl border p-2" value={name} onChange={e => setName(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Kategorie</span>
            <input className="rounded-xl border p-2" value={kategorie} onChange={e => setKategorie(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Status</span>
              <select className="rounded-xl border p-2" value={status} onChange={e => setStatus(e.target.value)}>
                <option>VERFUEGBAR</option>
                <option>VERMIETET</option>
                <option>WARTUNG</option>
                <option>AUSGEMUSTERT</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Standort-Typ</span>
              <select className="rounded-xl border p-2" value={standort} onChange={e => setStandort(e.target.value as any)}>
                <option>MIETPARK</option>
                <option>KUNDE</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Firma *</span>
            <select className="rounded-xl border p-2" value={firmaId} onChange={e => setFirmaId(Number(e.target.value))}>
              <option value="">— wählen —</option>
              {firmen.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>

          {standort === "MIETPARK" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm">Mietpark *</span>
              <select className="rounded-xl border p-2" value={mietparkId} onChange={e => setMietparkId(Number(e.target.value))}>
                <option value="">— wählen —</option>
                {parks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>Abbrechen</button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50" onClick={submit} disabled={busy}>
            {busy ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
