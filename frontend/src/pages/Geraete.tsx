import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Geraet } from "../types";
import { Pagination } from "../components/Pagination";
import EditGeraetModal from "../widgets/EditGeraetModal";
import NewDeviceModal from "../components/NewDeviceModal";

// Hilfstypen für Namen-Tabellen
type IdName = { id: number; name: string };

// Toleranter Typ für Vermietungen: funktioniert, egal ob die API flach (…_id)
// oder verschachtelt (…{ id }) zurückgibt.
type AnyVermietung = {
  status: string;                 // "OFFEN" | "GESCHLOSSEN" | …
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

  // Lookup-Maps
  const [parkNameById, setParkNameById] = useState<Record<number, string>>({});
  const [kundeNameById, setKundeNameById] = useState<Record<number, string>>({});
  const [kundeByGeraetId, setKundeByGeraetId] = useState<Record<number, number>>({});

  const [edit, setEdit] = useState<Geraet | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Stammdaten (Mietparks/Kunden) einmalig laden
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

    // offene Vermietungen -> aktueller Kunde pro Gerät
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
      // Wenn Vermietungen nicht geladen werden können, wird nur der Mietpark angezeigt.
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
      <div className="flex items-end gap-3">
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

        <div className="ml-auto flex gap-3">
          <button className="btn" onClick={() => setNewOpen(true)}>
            ＋ Neues Gerät
          </button>
          <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} />
        </div>
      </div>

      
<table className="table">
  <thead>
    <tr>
      <th className="th">Seriennr.</th>
      <th className="th">Name</th>
      <th className="th">Status</th>
      <th className="th">Standort</th>
      <th className="th">Baujahr</th>
      <th className="th">Mietpreis</th>
      <th className="th">Vermietet in</th>
      <th className="th">Stunden</th>
      <th className="th">Aktion</th>
    </tr>
  </thead>
  <tbody>
    {items.map(g => (
      <tr key={g.id}>
        <td className="td">{g.seriennummer ?? "—"}</td>
        <td className="td">{g.name}</td>
        <td className="td">{g.status}</td>
        <td className="td">{g.standort_typ}</td>
        <td className="td">{g.baujahr ?? "—"}</td>
        <td className="td">
          {g.mietpreis_wert != null && g.mietpreis_einheit
            ? `${g.mietpreis_wert.toLocaleString("de-DE")} / ${g.mietpreis_einheit}`
            : "—"}
        </td>
        <td className="td">{g.vermietet_in ?? "—"}</td>
        <td className="td">{g.stundenzähler}</td>
        <td className="td">
          <button className="btn mr-2" onClick={() => setEdit(g)}>Bearbeiten</button>
          <button className="btn-danger" onClick={async () => { await api.deleteGeraet(g.id); load(); }}>Löschen</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>


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
