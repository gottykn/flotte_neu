import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Geraet } from "../types";
import { Pagination } from "../components/Pagination";
import EditGeraetModal from "../widgets/EditGeraetModal";
import NewDeviceModal from "../components/NewDeviceModal";

export default function Geraete() {
  const [items, setItems] = useState<Geraet[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [standort, setStandort] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  async function load() {
    const list = await api.listGeraete({
      status: status || undefined,
      standort_typ: standort || undefined,
      skip,
      limit: pageSize,
    });
    const cnt = await api.countGeraete({
      status: status || undefined,
      standort_typ: standort || undefined,
    });
    setItems(list);
    setTotal(cnt.count);
  }

  useEffect(() => { load(); }, [status, standort, page]);

  const [edit, setEdit] = useState<Geraet | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <label className="text-sm">
          Status
          <select className="input ml-2" value={status}
                  onChange={e => { setPage(1); setStatus(e.target.value); }}>
            <option value="">Alle</option>
            {["VERFUEGBAR","VERMIETET","WARTUNG","AUSGEMUSTERT"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Standort
          <select className="input ml-2" value={standort}
                  onChange={e => { setPage(1); setStandort(e.target.value); }}>
            <option value="">Alle</option>
            {["MIETPARK","KUNDE"].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>

        <div className="ml-auto flex gap-3">
          <button className="btn" onClick={() => setNewOpen(true)}>＋ Neues Gerät</button>
          <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th className="th">ID</th>
            <th className="th">Name</th>
            <th className="th">Status</th>
            <th className="th">Standort</th>
            <th className="th">Stunden</th>
            <th className="th">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {items.map(g => (
            <tr key={g.id}>
              <td className="td">{g.id}</td>
              <td className="td">{g.name}</td>
              <td className="td">{g.status}</td>
              <td className="td">{g.standort_typ}</td>
              <td className="td">{g.stundenzähler}</td>
              <td className="td">
                <button className="btn" onClick={() => setEdit(g)}>Bearbeiten</button>
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
        onSaved={(saved) => setItems(items.map(g => g.id === saved.id ? saved : g))}
      />

      <NewDeviceModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => load()}
      />
    </div>
  );
}
