import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Rechnung, Vermietung, VermietungPosition } from "../types";
import Toggle from "../components/Toggle";
import Money from "../components/Money";

export default function Vermietungen() {
  const [vermietungen, setV] = useState<Vermietung[]>([]);
  const [sel, setSel] = useState<Vermietung | null>(null);
  const [rechnungen, setRe] = useState<Rechnung[]>([]);
  const [pos, setPos] = useState<VermietungPosition[]>([]);
  const [abrechnung, setAb] = useState<any>(null);

  const load = async () => setV(await api.listVermietungen());
  useEffect(()=>{ load(); }, []);

  useEffect(()=> {
    if (!sel) return;
    (async ()=>{
      setRe(await api.searchRechnungen(String(sel.id))); // simplistic: often invoice numbers include rental id
      // no dedicated list positions endpoint -> quick fetch by abrechnung to show totals
      setAb(await api.abrechnung(sel.id));
    })();
  }, [sel]);

  const togglePaid = async (r: Rechnung, paid: boolean) => {
    const updated = await api.toggleRechnungBezahlt(r.id, paid);
    setRe(rechnungen.map(x => x.id === r.id ? updated : x));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h2 className="font-semibold mb-2">Vermietungen</h2>
        <ul className="border rounded divide-y">
          {vermietungen.map(v => (
            <li key={v.id} className={`p-2 cursor-pointer ${sel?.id===v.id?'bg-blue-50':''}`} onClick={()=>setSel(v)}>
              <div className="font-medium">#{v.id} Gerät {v.geraet_id} → Kunde {v.kunde_id}</div>
              <div className="text-xs text-slate-500">{v.von} bis {v.bis} · {v.satz_wert} / {v.satz_einheit} · {v.status}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Details</h2>
        {!sel ? <div className="text-slate-500">Bitte Vermietung auswählen.</div> : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button className="btn" onClick={()=>api.startenVermietung(sel.id).then(load)}>Starten</button>
              <button className="btn" onClick={()=>api.schliessenVermietung(sel.id).then(load)}>Schließen</button>
            </div>

            <div className="border rounded p-3">
              <div className="font-semibold mb-2">Rechnungen</div>
              {!rechnungen.length && <div className="text-sm text-slate-500">Keine Rechnungen gefunden.</div>}
              {rechnungen.map(r => (
                <div key={r.id} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium">#{r.nummer}</div>
                    <div className="text-xs text-slate-500">{r.datum}</div>
                  </div>
                  <Toggle checked={r.bezahlt} onChange={(v)=>togglePaid(r, v)} />
                </div>
              ))}
            </div>

            <div className="border rounded p-3">
              <div className="font-semibold mb-1">Abrechnung</div>
              {!abrechnung ? <div className="text-sm text-slate-500">—</div> : (
                <ul className="text-sm">
                  <li>Tage: <b>{abrechnung.mietdauer_tage}</b></li>
                  <li>Miete: <Money value={abrechnung.miete_summe} /></li>
                  <li>Zusatzposten: <Money value={abrechnung.positionen_summe} /></li>
                  <li>Einnahmen: <Money value={abrechnung.einnahmen} /></li>
                  <li>Kosten: <Money value={abrechnung.kosten_summe} /></li>
                  <li>Marge: <Money value={abrechnung.marge} /></li>
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
