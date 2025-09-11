import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Rechnung } from "../types";
import Toggle from "../components/Toggle";
import Money from "../components/Money";
import NewRentalModal from "../components/NewRentalModal";

// *** passender Typ für die List-API ***
type VermietungLite = {
  id: number;
  geraet_id: number;
  kunde_id: number;
  von: string;
  bis: string;
  satz_wert: number;
  satz_einheit: string; // z.B. "MONATLICH"
  status: "GEPLANT" | "OFFEN" | "GESCHLOSSEN" | string;
};

type IdName = { id: number; name: string };

export default function Vermietungen() {
  const [vermietungen, setV] = useState<VermietungLite[]>([]);
  const [sel, setSel] = useState<VermietungLite | null>(null);

  const [rechnungen, setRe] = useState<Rechnung[]>([]);
  const [abrechnung, setAb] = useState<any>(null);

  // Lookups für Anzeige
  const [gMap, setGMap] = useState<Record<number, string>>({});
  const [kMap, setKMap] = useState<Record<number, string>>({});

  const [newOpen, setNewOpen] = useState(false);

  async function loadListAndLookups() {
    const [list, geraete, kunden] = await Promise.all([
      api.listVermietungen() as Promise<VermietungLite[]>,
      api.listGeraete({ skip: 0, limit: 500 }) as Promise<any[]>,
      api.listKunden() as Promise<IdName[]>,
    ]);

    setV(list);

    const gm: Record<number, string> = {};
    (geraete || []).forEach((g) => (gm[g.id] = g.name ?? `Gerät ${g.id}`));
    setGMap(gm);

    const km: Record<number, string> = {};
    (kunden || []).forEach((k) => (km[k.id] = k.name ?? `Kunde ${k.id}`));
    setKMap(km);
  }

  useEffect(() => {
    loadListAndLookups();
  }, []);

  useEffect(() => {
    if (!sel) {
      setRe([]);
      setAb(null);
      return;
    }
    (async () => {
      const rs = await api.searchRechnungen(String(sel.id));
      setRe(rs);
      setAb(await api.abrechnung(sel.id));
    })();
  }, [sel]);

  async function reloadAndKeepSelection() {
    const keepId = sel?.id;
    const list = (await api.listVermietungen()) as VermietungLite[];
    setV(list);
    setSel(keepId ? list.find((x) => x.id === keepId) ?? null : null);
  }

  const togglePaid = async (r: Rechnung, paid: boolean) => {
    const updated = await api.toggleRechnungBezahlt(r.id, paid);
    setRe(rechnungen.map((x) => (x.id === r.id ? updated : x)));
  };

  const startSel = async () => {
    if (!sel) return;
    await api.startenVermietung(sel.id);
    await reloadAndKeepSelection();
  };

  const closeSel = async () => {
    if (!sel) return;
    await api.schliessenVermietung(sel.id);
    await reloadAndKeepSelection();
  };

  const canStart = sel?.status === "GEPLANT";
  const canClose = sel?.status === "OFFEN";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Vermietungen</h2>
          <button className="btn" onClick={() => setNewOpen(true)}>
            ＋ Neue Vermietung
          </button>
        </div>

        <ul className="divide-y rounded border">
          {vermietungen.map((v) => (
            <li
              key={v.id}
              className={`cursor-pointer p-2 ${sel?.id === v.id ? "bg-blue-50" : ""}`}
              onClick={() => setSel(v)}
            >
              <div className="font-medium">
                #{v.id} {gMap[v.geraet_id] ?? `Gerät ${v.geraet_id}`} →{" "}
                {kMap[v.kunde_id] ?? `Kunde ${v.kunde_id}`}
              </div>
              <div className="text-xs text-slate-500">
                {v.von} bis {v.bis} · {v.satz_wert} / {v.satz_einheit} · {v.status}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Details</h2>

        {!sel ? (
          <div className="text-slate-500">Bitte Vermietung auswählen.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={startSel} disabled={!canStart}>
                Starten
              </button>
              <button className="btn" onClick={closeSel} disabled={!canClose}>
                Schließen
              </button>
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 font-semibold">Rechnungen</div>
              {!rechnungen.length && (
                <div className="text-sm text-slate-500">Keine Rechnungen gefunden.</div>
              )}
              {rechnungen.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b py-2 last:border-0">
                  <div>
                    <div className="font-medium">#{r.nummer}</div>
                    <div className="text-xs text-slate-500">{r.datum}</div>
                  </div>
                  <Toggle checked={r.bezahlt} onChange={(v) => togglePaid(r, v)} />
                </div>
              ))}
            </div>

            <div className="rounded border p-3">
              <div className="mb-1 font-semibold">Abrechnung</div>
              {!abrechnung ? (
                <div className="text-sm text-slate-500">—</div>
              ) : (
                <ul className="text-sm">
                  <li>
                    Tage: <b>{abrechnung.mietdauer_tage}</b>
                  </li>
                  <li>
                    Miete: <Money value={abrechnung.miete_summe} />
                  </li>
                  <li>
                    Zusatzposten: <Money value={abrechnung.positionen_summe} />
                  </li>
                  <li>
                    Einnahmen: <Money value={abrechnung.einnahmen} />
                  </li>
                  <li>
                    Kosten: <Money value={abrechnung.kosten_summe} />
                  </li>
                  <li>
                    Marge: <Money value={abrechnung.marge} />
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <NewRentalModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => reloadAndKeepSelection()}
      />
    </div>
  );
}
