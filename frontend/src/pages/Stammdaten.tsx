import { useEffect, useState } from "react";
import { api } from "../api";
import type { Firma, Kunde, Mietpark } from "../types";
import EditKundeModal from "../widgets/EditKundeModal";
import EditFirmaModal from "../widgets/EditFirmaModal";
import EditMietparkModal from "../widgets/EditMietparkModal";

export default function Stammdaten() {
  const [firmen, setFirmen] = useState<Firma[]>([]);
  const [mietparks, setMietparks] = useState<Mietpark[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);

  const [editFirma, setEditFirma] = useState<Firma | null>(null);
  const [editPark, setEditPark] = useState<Mietpark | null>(null);
  const [editKunde, setEditKunde] = useState<Kunde | null>(null);

  async function loadAll() {
    const [f, p, k] = await Promise.all([
      api.listFirmen(),
      api.listMietparks(),
      api.listKunden(),
    ]);
    setFirmen(f as any);
    setMietparks(p as any);
    setKunden(k as any);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function delFirma(f: Firma) {
    if (!confirm(`Firma „${f.name}“ wirklich löschen?`)) return;
    await api.deleteFirma(f.id);
    setFirmen((x) => x.filter((i) => i.id !== f.id));
  }

  async function delPark(p: Mietpark) {
    if (!confirm(`Mietpark „${p.name}“ wirklich löschen?`)) return;
    await api.deleteMietpark(p.id);
    setMietparks((x) => x.filter((i) => i.id !== p.id));
  }

  async function delKunde(k: Kunde) {
    if (!confirm(`Kunde „${k.name}“ wirklich löschen?`)) return;
    await api.deleteKunde(k.id);
    setKunden((x) => x.filter((i) => i.id !== k.id));
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Firmen */}
      <section>
        <h2 className="font-semibold mb-2">Firmen</h2>
        <ul className="border rounded divide-y">
          {firmen.map((f) => (
            <li key={f.id} className="p-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-500">{(f as any).ust_id}</div>
                <div className="text-xs text-slate-500">{(f as any).adresse}</div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button className="btn" onClick={() => setEditFirma(f)}>Bearbeiten</button>
                <button className="btn-danger" onClick={() => delFirma(f)}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Mietparks */}
      <section>
        <h2 className="font-semibold mb-2">Mietparks</h2>
        <ul className="border rounded divide-y">
          {mietparks.map((m) => (
            <li key={m.id} className="p-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-slate-500">{(m as any).adresse}</div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button className="btn" onClick={() => setEditPark(m)}>Bearbeiten</button>
                <button className="btn-danger" onClick={() => delPark(m)}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Kunden */}
      <section>
        <h2 className="font-semibold mb-2">Kunden</h2>
        <ul className="border rounded divide-y">
          {kunden.map((k) => (
            <li key={k.id} className="p-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="text-xs text-slate-500">{(k as any).ust_id}</div>
                <div className="text-xs text-slate-500">{(k as any).adresse}</div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button className="btn" onClick={() => setEditKunde(k)}>Bearbeiten</button>
                <button className="btn-danger" onClick={() => delKunde(k)}>Löschen</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Modals */}
      <EditFirmaModal
        open={!!editFirma}
        firma={editFirma}
        onClose={() => setEditFirma(null)}
        onSaved={(saved) => setFirmen((arr) => arr.map((x) => (x.id === saved.id ? saved : x)))}
      />
      <EditMietparkModal
        open={!!editPark}
        park={editPark}
        onClose={() => setEditPark(null)}
        onSaved={(saved) => setMietparks((arr) => arr.map((x) => (x.id === saved.id ? saved : x)))}
      />
      <EditKundeModal
        open={!!editKunde}
        kunde={editKunde}
        onClose={() => setEditKunde(null)}
        onSaved={(saved) => setKunden((arr) => arr.map((x) => (x.id === saved.id ? saved : x)))}
      />
    </div>
  );
}
