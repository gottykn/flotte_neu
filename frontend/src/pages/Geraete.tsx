import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Geraet } from "../types";
import { Pagination } from "../components/Pagination";
import EditGeraetModal from "../widgets/EditGeraetModal";
import NewDeviceModal from "../components/NewDeviceModal";

// Hilfstypen
type IdName = { id: number; name: string };
type AnyVermietung = {
  status: string;
  geraet_id?: number;
  kunde_id?: number;
  geraet?: { id: number };
  kunde?: { id: number };
};

export default function Geraete() {
  const [items, setItems] = useState<Geraet[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [standort, setStandort] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Lookups
  const [parkNameById, setParkNameById] = useState<Record<number, string>>({});
  const [kundeNameById, setKundeNameById] = useState<Record<number, string>>({});
  const [kundeByGeraetId, setKundeByGeraetId] = useState<Record<number, number>>({});

  // Modals
  const [edit, setEdit] = useState<Geraet | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Stammdaten laden
  useEffect(() => {
    (async () => {
      const [parks, kunden] = await Promise.all([
        api.listMietparks() as Promise<IdName[]>,
        api.listKunden() as Promise<IdName[]>,
      ]);
      const pMap: Record<number, string> = {};
      parks.forEach((p) => (pMap[p.id] = p.name));
      setParkNameById(pMap);

      const kMap: Record<number, string> = {};
      kunden.forEach((k) => (kMap[k.id] = k.name || `Kunde #${k.id}`));
      setKundeNameById(kMap);
    })();
  }, []);

  async function load() {
    const [list, cnt] = await Promise.all([
      api.listGeraete({
        status: status || undefined,
        standort_typ: standort || undefined,
        skip,
        limit: pageSize,
      }),
      api.countGeraete({
        status: status || undefined,
        standort_typ: standort || undefined,
      }),
    ]);
    setItems(list);
    setTotal(cnt.count);

    // offene Vermietungen → aktueller Kunde pro Gerät
    try {
      const vermietungen = (await api.listVermietungen()) as AnyVermietung[];
      const openByDevice: Record<number, number> = {};
      for (const v of vermietungen) {
        if (v.status === "OFFEN") {
          const gid = v.geraet_id ?? v.geraet?.id;
          const kid = v.kunde_id ?? v.kunde?.id;
          if (gid && kid) openByDevice[gid] = kid;
        }
      }
      setKundeByGeraetId(openByDevice);
    } catch {
      /* okay */
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, standort, page]);

  async function onDelete(g: Geraet) {
    if (!window.confirm(`Gerät "${g.name}" wirklich löschen?`)) return;
    try {
      await api.deleteGeraet(g.id);
      setItems((prev) => prev.filter((i) => i.id !== g.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e?.message ?? "Löschen fehlgeschlagen.");
    }
  }

  function renderStandort(g: Geraet) {
    if (g.standort_typ === "MIETPARK") {
      return g.mietpark_id != null
        ? parkNameById[g.mietpark_id] ?? `Mietpark #${g.mietpark_id}`
        : "Mietpark";
    }
    if (g.standort_typ === "KUNDE") {
      const kid = kundeByGeraetId[g.id];
      return kid ? kundeNameById[kid] ?? `Kunde #${kid}` : "Kunde";
    }
    return g.standort_typ;
  }

  return (
    <div className="space-y-4">
      {/* Filterleiste als Card */}
      <div className="rounded-xl border bg-slate-50/60 p-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Status
          <select
            className="input ml-2"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Alle</option>
            {["VERFUEGBAR", "VERMIETET", "WARTUNG", "AUSGEMUSTERT"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Standort
          <select
            className="input ml-2"
            value={standort}
            onChange={(e) => {
              setPage(1);
              setStandort(e.target.value);
            }}
          >
            <option value="">Alle</option>
            {["MIETPARK", "KUNDE"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="ml-auto">
          <button className="btn" onClick={() => setNewOpen(true)}>
            ＋ Neues Gerät
          </button>
        </div>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100/80 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Standort</th>
              <th className="px-3 py-2 text-left">Seriennr.</th>
              <th className="px-3 py-2 text-left">Baujahr</th>
              <th className="px-3 py-2 text-left">Mietpreis</th>
              <th className="px-3 py-2 text-left">Vermietet in</th>
              <th className="px-3 py-2 text-left">Stunden</th>
              <th className="px-3 py-2 text-left">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr
                key={g.id}
                className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors"
              >
                {/* Name (fett, Link) */}
                <td className="px-3 py-2">
                  <Link
                    className="font-medium text-blue-700 hover:underline"
                    to={`/geraete/${g.id}`}
                  >
                    {g.name}
                  </Link>
                </td>

                {/* Status mit Badge */}
                <td className="px-3 py-2">
                  <StatusBadge status={g.status} />
                </td>

                {/* Standort */}
                <td className="px-3 py-2">{renderStandort(g)}</td>

                {/* Seriennummer dezent */}
                <td className="px-3 py-2 text-slate-500 font-mono text-xs">
                  {g.seriennummer ?? "—"}
                </td>

                <td className="px-3 py-2">{g.baujahr ?? "—"}</td>
                <td className="px-3 py-2">
                  {g.mietpreis_wert != null && g.mietpreis_einheit
                    ? `${g.mietpreis_wert.toLocaleString("de-DE")} / ${g.mietpreis_einheit}`
                    : "—"}
                </td>
                <td className="px-3 py-2">{g.vermietet_in ?? "—"}</td>
                <td className="px-3 py-2">{g.stundenzähler}</td>

                {/* Icon-Aktionen */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-slate-700 hover:bg-slate-100"
                      title="Bearbeiten"
                      onClick={() => setEdit(g)}
                    >
                      {/* ✏️ */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path
                          d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-red-700 hover:bg-red-50"
                      title="Löschen"
                      onClick={() => onDelete(g)}
                    >
                      {/* 🗑️ */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={9}>
                  Keine Geräte gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination unten mittig */}
      <div className="mt-3 flex justify-center">
        <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} />
      </div>

      {/* Modals */}
      <EditGeraetModal
        open={!!edit}
        geraet={edit}
        onClose={() => setEdit(null)}
        onSaved={(saved) =>
          setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))
        }
      />
      <NewDeviceModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => load()} />
    </div>
  );
}

/** Farbige Badges für Status */
function StatusBadge({ status }: { status: Geraet["status"] }) {
  const map: Record<string, string> = {
    VERFUEGBAR: "bg-green-100 text-green-800 ring-green-200",
    VERMIETET: "bg-red-100 text-red-800 ring-red-200",
    WARTUNG: "bg-amber-100 text-amber-900 ring-amber-200",
    AUSGEMUSTERT: "bg-slate-200 text-slate-700 ring-slate-300",
  };
  const cls = map[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 " + cls
      }
    >
      {status}
    </span>
  );
}
