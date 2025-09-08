import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Money from "../components/Money";

type Row = {
  id: number;
  kunde: string;
  geraet: number;
  von: string; bis: string;
  miete: number; posten: number; kosten: number; einnahmen: number; marge: number;
};

export default function Einnahmen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [von, setVon] = useState<string>("2025-01-01");
  const [bis, setBis] = useState<string>(new Date().toISOString().slice(0,10));

  const load = async () => {
    // naive composition: get all rentals and compute via /berichte/vermietungen/:id/abrechnung
    const rentals = await api.listVermietungen();
    const within = rentals.filter((r:any) => r.von <= bis && r.bis >= von);
    const results: Row[] = [];
    for (const v of within) {
      const ab = await api.abrechnung(v.id);
      results.push({
        id: v.id,
        kunde: String(v.kunde_id),
        geraet: v.geraet_id,
        von: v.von, bis: v.bis,
        miete: ab.miete_summe,
        posten: ab.positionen_summe,
        kosten: ab.kosten_summe,
        einnahmen: ab.einnahmen,
        marge: ab.marge
      });
    }
    setRows(results);
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [von,bis]);

  const totals = useMemo(()=> rows.reduce((a,r)=>({
    miete: a.miete + r.miete,
    posten: a.posten + r.posten,
    einnahmen: a.einnahmen + r.einnahmen,
    kosten: a.kosten + r.kosten,
    marge: a.marge + r.marge
  }), { miete:0, posten:0, einnahmen:0, kosten:0, marge:0 }), [rows]);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <label className="text-sm">Von <input className="input ml-1" type="date" value={von} onChange={e=>setVon(e.target.value)} /></label>
        <label className="text-sm">Bis <input className="input ml-1" type="date" value={bis} onChange={e=>setBis(e.target.value)} /></label>
      </div>

      <table className="table">
        <thead><tr>
          <th className="th">#</th><th className="th">Kunde</th><th className="th">Gerät</th><th className="th">Von</th><th className="th">Bis</th>
          <th className="th">Miete</th><th className="th">Posten</th><th className="th">Einnahmen</th><th className="th">Kosten</th><th className="th">Marge</th>
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td className="td">{r.id}</td>
              <td className="td">{r.kunde}</td>
              <td className="td">{r.geraet}</td>
              <td className="td">{r.von}</td>
              <td className="td">{r.bis}</td>
              <td className="td"><Money value={r.miete} /></td>
              <td className="td"><Money value={r.posten} /></td>
              <td className="td"><Money value={r.einnahmen} /></td>
              <td className="td"><Money value={r.kosten} /></td>
              <td className="td font-semibold"><Money value={r.marge} /></td>
            </tr>
          ))}
          {/* Summenzeile */}
          <tr className="font-semibold bg-slate-50">
            <td className="td" colSpan={5}>Summe</td>
            <td className="td"><Money value={totals.miete} /></td>
            <td className="td"><Money value={totals.posten} /></td>
            <td className="td"><Money value={totals.einnahmen} /></td>
            <td className="td"><Money value={totals.kosten} /></td>
            <td className="td"><Money value={totals.marge} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
