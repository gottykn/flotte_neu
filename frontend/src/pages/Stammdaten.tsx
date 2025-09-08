import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Firma, Kunde, Mietpark } from "../types";
import EditKundeModal from "../widgets/EditKundeModal";

export default function Stammdaten() {
  const [firmen, setFirmen] = useState<Firma[]>([]);
  const [mietparks, setMietparks] = useState<Mietpark[]>([]);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [editKunde, setEditKunde] = useState<Kunde|null>(null);

  useEffect(() => { (async ()=>{
    setFirmen(await api.listFirmen());
    setMietparks(await api.listMietparks());
    setKunden(await api.listKunden());
  })(); }, []);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section>
        <h2 className="font-semibold mb-2">Firmen</h2>
        <ul className="border rounded divide-y">
          {firmen.map(f => <li key={f.id} className="p-2">
            <div className="font-medium">{f.name}</div>
            <div className="text-xs text-slate-500">{f.ust_id}</div>
            <div className="text-xs text-slate-500">{f.adresse}</div>
          </li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Mietparks</h2>
        <ul className="border rounded divide-y">
          {mietparks.map(m => <li key={m.id} className="p-2">
            <div className="font-medium">{m.name}</div>
            <div className="text-xs text-slate-500">{m.adresse}</div>
          </li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Kunden</h2>
        <ul className="border rounded divide-y">
          {kunden.map(k => <li key={k.id} className="p-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{k.name}</div>
              <div className="text-xs text-slate-500">{k.ust_id}</div>
              <div className="text-xs text-slate-500">{k.adresse}</div>
            </div>
            <button className="btn" onClick={()=>setEditKunde(k)}>Bearbeiten</button>
          </li>)}
        </ul>
      </section>

      <EditKundeModal open={!!editKunde} kunde={editKunde} onClose={()=>setEditKunde(null)}
        onSaved={(saved)=>setKunden(kunden.map(k=>k.id===saved.id?saved:k))} />
    </div>
  );
}
