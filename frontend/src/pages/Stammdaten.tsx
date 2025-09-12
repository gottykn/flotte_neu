import { useEffect, useState } from "react";
import { api } from "../api";
import type { Firma, Mietpark, Kunde } from "../types";
import EditKundeModal from "../widgets/EditKundeModal";
import EditFirmaModal from "../widgets/EditFirmaModal";
import EditMietparkModal from "../widgets/EditMietparkModal";

export default function Stammdaten() {
  // Daten
  const [firmen, setFirmen] = useState<Firma[]>([]);
  const [parks, setParks] = useState<Mietpark[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [busy, setBusy] = useState(false);

  // Modals
  const [editKunde, setEditKunde] = useState<Kunde | null>(null);
  const [editFirma, setEditFirma] = useState<Firma | null>(null);
  const [editPark, setEditPark] = useState<Mietpark | null>(null);

  // Quick-Add Inputs
  const [neuFirma, setNeuFirma] = useState({ name: "", ust_id: "", adresse: "" });
  const [neuPark, setNeuPark] = useState({ name: "", adresse: "" });

  async function load() {
    setBusy(true);
    try {
      const [f, p, k] = await Promise.all([
        api.listFirmen(),
        api.listMietparks(),
        api.listKunden(),
      ]);
      setFirmen(f as any); // falls Backend nur Id/Name liefert, casten wir tolerant
      setParks(p as any);
      setKunden(k);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ---- Firmen: Add/Delete ----
  async function addFirma() {
    if (!neuFirma.name.trim()) return;
    const saved = await api.createFirma(neuFirma);
    setFirmen(prev => [...prev, saved as any]);
    setNeuFirma({ name: "", ust_id: "", adresse: "" });
  }
  async function delFirma(f: Firma) {
    if (!confirm(`Firma "${f.name}" löschen?`)) return;
    await api.deleteFirma(f.id);
    setFirmen(prev => prev.filter(x => x.id !== f.id));
  }

  // ---- Mietparks: Add/Delete ----
  async function addPark() {
    if (!neuPark.name.trim()) return;
    const saved = await api.createMietpark(neuPark);
    setParks(prev => [...prev, saved as any]);
    setNeuPark({ name: "", adresse: "" });
  }
  async function delPark(p: Mietpark) {
    if (!confirm(`Mietpark "${p.name}" löschen?`)) return;
    await api.deleteMietpark(p.id);
    setParks(prev => prev.filter(x => x.id !== p.id));
  }

  return (
    <div className="space-y-8">
      {/* Firmen */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Firmen</h2>
          {busy && <span className="text-xs text-slate-500">lädt…</span>}
        </div>

        {/* Quick-Add Firma */}
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input
            className="input"
            placeholder="Neue Firma – Name"
            value={neuFirma.name}
            onChange={e => setNeuFirma({ ...neuFirma, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="USt-ID (optional)"
            value={neuFirma.ust_id}
            onChange={e => setNeuFirma({ ...neuFirma, ust_id: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Adresse (optional)"
              value={neuFirma.adresse}
              onChange={e => setNeuFirma({ ...neuFirma, adresse: e.target.value })}
            />
            <button className="btn" onClick={addFirma}>Hinzufügen</button>
          </div>
        </div>

        <ul className="border rounded divide-y">
          {firmen.map(f => (
            <li key={f.id} className="p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-500">{(f as any).ust_id ?? "—"}</div>
                <div className="text-xs text-slate-500">{(f as any).adresse ?? "—"}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setEditFirma(f)}>Bearbeiten</button>
                <button className="btn-danger" onClick={() => delFirma(f)}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Mietparks */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Mietparks</h2>
        </div>

        {/* Quick-Add Mietpark */}
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input
            className="input"
            placeholder="Neuer Mietpark – Name"
            value={neuPark.name}
            onChange={e => setNeuPark({ ...neuPark, name: e.target.value })}
          />
          <div className="flex gap-2 md:col-span-2">
            <input
              className="input flex-1"
              placeholder="Adresse (optional)"
              value={neuPark.adresse}
              onChange={e => setNeuPark({ ...neuPark, adresse: e.target.value })}
            />
            <button className="btn" onClick={addPark}>Hinzufügen</button>
          </div>
        </div>

        <ul className="border rounded divide-y">
          {parks.map(p => (
            <li key={p.id} className="p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">{(p as any).adresse ?? "—"}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setEditPark(p)}>Bearbeiten</button>
                <button className="btn-danger" onClick={() => delPark(p)}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Kunden (wie gehabt – nur bearbeiten) */}
      <section>
        <h2 className="font-semibold mb-2">Kunden</h2>
        <ul className="border rounded divide-y">
          {kunden.map(k => (
            <li key={k.id} className="p-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="text-xs text-slate-500">{k.ust_id || "—"}</div>
                <div className="text-xs text-slate-500">{k.adresse || "—"}</div>
              </div>
              <button className="btn" onClick={() => setEditKunde(k)}>Bearbeiten</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Modals */}
      <EditKundeModal
        open={!!editKunde}
        kunde={editKunde}
        onClose={() => setEditKunde(null)}
        onSaved={(saved) => setKunden(prev => prev.map(k => (k.id === saved.id ? saved : k)))}
      />

      <EditFirmaModal
        open={!!editFirma}
        firma={editFirma}
        onClose={() => setEditFirma(null)}
        onSaved={(saved) => setFirmen(prev => prev.map(x => (x.id === saved.id ? (saved as any) : x)))}
      />

      <EditMietparkModal
        open={!!editPark}
        park={editPark}
        onClose={() => setEditPark(null)}
        onSaved={(saved) => setParks(prev => prev.map(x => (x.id === saved.id ? (saved as any) : x)))}
      />
    </div>
  );
}
