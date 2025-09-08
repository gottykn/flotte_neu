import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Kunde } from "../types";
import { api } from "../api";

export default function EditKundeModal({ open, onClose, kunde, onSaved }:{
  open: boolean; onClose: ()=>void; kunde: Kunde|null; onSaved:(k:Kunde)=>void
}) {
  const [form, setForm] = useState<Kunde | null>(kunde);
  useEffect(()=>setForm(kunde), [kunde]);
  if (!form) return null;
  const set = (k: keyof Kunde, v:any) => setForm({ ...form, [k]: v });

  const submit = async () => {
    const saved = await api.updateKunde(form.id, form);
    onSaved(saved); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Kunde bearbeiten #${form.id}`}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">Name<input className="input" value={form.name} onChange={e=>set("name", e.target.value)} /></label>
        <label className="flex flex-col text-sm">Adresse<textarea className="input" value={form.adresse||""} onChange={e=>set("adresse", e.target.value)} /></label>
        <label className="flex flex-col text-sm">USt-ID<input className="input" value={form.ust_id||""} onChange={e=>set("ust_id", e.target.value)} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>Abbrechen</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>Speichern</button>
      </div>
    </Modal>
  );
}
