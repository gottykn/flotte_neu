import React, { useState } from "react";
import { api } from "../api";
import { AuslastungResponse } from "../types";

export default function Berichte() {
  const [von, setVon] = useState("2025-01-01");
  const [bis, setBis] = useState(new Date().toISOString().slice(0,10));
  const [geraetId, setGeraetId] = useState<string>("");
  const [res, setRes] = useState<AuslastungResponse | null>(null);

  const load = async () => {
    setRes(await api.auslastung({ von, bis, geraet_id: geraetId===""?null:Number(geraetId) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="text-sm">Von <input className="input ml-1" type="date" value={von} onChange={e=>setVon(e.target.value)} /></label>
        <label className="text-sm">Bis <input className="input ml-1" type="date" value={bis} onChange={e=>setBis(e.target.value)} /></label>
        <label className="text-sm">Gerät-ID <input className="input ml-1" type="number" placeholder="leer = alle" value={geraetId} onChange={e=>setGeraetId(e.target.value)} /></label>
        <button className="btn-primary ml-auto" onClick={load}>Berechnen</button>
      </div>

      {res && (
        <div className="space-y-2">
          <div className="font-semibold">Flotte: {res.flotte_auslastung_prozent}%</div>
          <table className="table">
            <thead><tr><th className="th">Gerät</th><th className="th">Tage gesamt</th><th className="th">Tage vermietet</th><th className="th">Auslastung %</th></tr></thead>
            <tbody>
              {res.items.map(i=>(
                <tr key={i.geraet_id}>
                  <td className="td">{i.geraet_id}</td>
                  <td className="td">{i.tage_gesamt}</td>
                  <td className="td">{i.tage_vermietet}</td>
                  <td className="td">{i.auslastung_prozent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
