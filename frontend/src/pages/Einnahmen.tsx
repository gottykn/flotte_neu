// src/pages/Einnahmen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Money from "../components/Money";
import type { Geraet, Kunde, Vermietung } from "../types";

type Row = {
  id: number;
  kunde: string;            // Name statt ID
  geraet: string;           // "Name (Seriennr.)" statt ID
  von: string;
  bis: string;
  miete: number;
  posten: number;
  kosten: number;
  einnahmen: number;
  marge: number;
};

export default function Einnahmen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [von, setVon] = useState<string>("2025-01-01");
  const [bis, setBis] = useState<string>(new Date().toISOString().slice(0, 10));

  // Lookups: Kunden & Geräte (einmalig laden)
  const [kundenById, setKundenById] = useState<Record<number, Kunde>>({});
  const [geraeteById, setGeraeteById] = useState<
    Record<number, Pick<Geraet, "id" | "name" | "seriennummer">>
  >({});

  useEffect(() => {
    (async () => {
      const [kunden, geraete] = await Promise.all([
        api.listKunden(),
        api.listGeraete({ skip: 0, limit: 10000 }), // großzügig, damit alle reinpassen
      ]);

      const km: Record<number, Kunde> = {};
      kunden.forEach((k) => (km[k.id] = k));
      setKundenById(km);

      const gm: Record<number, Pick<Geraet, "id" | "name" | "seriennummer">> = {};
      geraete.forEach((g) => (gm[g.id] = { id: g.id, name: g.name, seriennummer: g.seriennummer ?? undefined }));
      setGeraeteById(gm);
    })();
  }, []);

  const load = async () => {
    // naive composition: alle Vermietungen holen, Zeitraum filtern, pro ID Abrechnung laden
    const rentals = (await api.listVermietungen()) as Vermietung[];
    const within = rentals.filter((r:any) => {
  const rbis = r.bis ?? "9999-12-31";       // offenes Ende als "sehr weit in der Zukunft"
  return r.von <= bis && rbis >= von;
});
    const results: Row[] = [];
    for (const v of within) {
      const ab = await api.abrechnung(v.id);

      const kundeName = kundenById[v.kunde_id]?.name ?? `Kunde #${v.kunde_id}`;
      const g = geraeteById[v.geraet_id];
      const geraetLabel = g
        ? g.seriennummer
          ? `${g.name} (${g.seriennummer})`
          : g.name
        : `Gerät #${v.geraet_id}`;

      results.push({
        id: v.id,
        kunde: kundeName,
        geraet: geraetLabel,
        von: v.von,
        bis: v.bis,
        miete: Number(ab.miete_summe ?? 0),
        posten: Number(ab.positionen_summe ?? 0),
        kosten: Number(ab.kosten_summe ?? 0),
        einnahmen: Number(ab.einnahmen ?? 0),
        marge: Number(ab.marge ?? 0),
      });
    }
    setRows(results);
  };

  // neu laden, wenn Zeitraum geändert wurde ODER Lookups da sind
  useEffect(() => {
    // warten, bis Lookups wenigstens einmal gefüllt wurden
    if (!Object.keys(kundenById).length || !Object.keys(geraeteById).length) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [von, bis, kundenById, geraeteById]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          miete: a.miete + r.miete,
          posten: a.posten + r.posten,
          einnahmen: a.einnahmen + r.einnahmen,
          kosten: a.kosten + r.kosten,
          marge: a.marge + r.marge,
        }),
        { miete: 0, posten: 0, einnahmen: 0, kosten: 0, marge: 0 }
      ),
    [rows]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <label className="text-sm">
          Von{" "}
          <input
            className="input ml-1"
            type="date"
            value={von}
            onChange={(e) => setVon(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Bis{" "}
          <input
            className="input ml-1"
            type="date"
            value={bis}
            onChange={(e) => setBis(e.target.value)}
          />
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th className="th">#</th>
            <th className="th">Kunde</th>
            <th className="th">Gerät</th>
            <th className="th">Von</th>
            <th className="th">Bis</th>
            <th className="th">Miete</th>
            <th className="th">Posten</th>
            <th className="th">Einnahmen</th>
            <th className="th">Kosten</th>
            <th className="th">Marge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="td">{r.id}</td>
              <td className="td">{r.kunde}</td>
              <td className="td">{r.geraet}</td>
              <td className="td">{r.von}</td>
              <td className="td">{r.bis}</td>
              <td className="td">
                <Money value={r.miete} />
              </td>
              <td className="td">
                <Money value={r.posten} />
              </td>
              <td className="td">
                <Money value={r.einnahmen} />
              </td>
              <td className="td">
                <Money value={r.kosten} />
              </td>
              <td className="td font-semibold">
                <Money value={r.marge} />
              </td>
            </tr>
          ))}
          {/* Summenzeile */}
          <tr className="font-semibold bg-slate-50">
            <td className="td" colSpan={5}>
              Summe
            </td>
            <td className="td">
              <Money value={totals.miete} />
            </td>
            <td className="td">
              <Money value={totals.posten} />
            </td>
            <td className="td">
              <Money value={totals.einnahmen} />
            </td>
            <td className="td">
              <Money value={totals.kosten} />
            </td>
            <td className="td">
              <Money value={totals.marge} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
