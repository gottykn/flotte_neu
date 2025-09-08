import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Geraet, GeraetStatus, StandortTyp } from "../types";
import { api } from "../api";

export default function EditGeraetModal({ open, onClose, geraet, onSaved }:{
  open: boolean; onClose: ()=>void; geraet: Geraet|null; onSaved: (g:Geraet)=>void;
}) {
  const [form, setForm] = useState<Geraet | null>(geraet);
  useEffect(()=> setForm(geraet), [geraet]);

  if (!form) return null;
  const set = (k: keyof Geraet, v: any) => setForm({ ...form, [k]: v });

  const submit = async () => {
    const saved = await api.updateGeraet(form.id, {
      ...form,
      anschaffungsdatum: form.anschaffungsdatum || null,
      mietpark_id: form.mietpark_id || null
    });
    onSaved(saved);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Gerät bearbeiten #${form.id}`}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">Name<input className="input" value={form.name} onChange={e=>set("name", e.target.value)} /></label>
        <label className="flex flex-col text-sm">Kategorie<input className="input" value={form.kategorie||""} onChange={e=>set("kategorie", e.target.value)} /></label>
        <label className="flex flex-col text-sm">Modell<input className="input" value={form.modell||""} onChange={e=>set("modell", e.target.value)} /></label>
        <label className="flex flex-col text-sm">Seriennummer<input className="input" value={form.seriennummer||""} onChange={e=>set("seriennummer", e.target.value)} /></label>

        <label className="flex flex-col text-sm">Status
          <select className="input" value={form.status} onChange={e=>set("status", e.target.value as GeraetStatus)}>
            {["VERFUEGBAR","VERMIETET","WARTUNG","AUSGEMUSTERT"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-sm">Standorttyp
          <select className="input" value={form.standort_typ} onChange={e=>set("standort_typ", e.target.value as StandortTyp)}>
            {["MIETPARK","KUNDE"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-sm">Stundenzähler<input className="input" type="number" value={form.stundenzähler} onChange={e=>set("stundenzähler", parseFloat(e.target.value))} /></label>
        <label className="flex flex-col text-sm">Anschaffungspreis<input className="input" type="number" value={form.anschaffungspreis??""} onChange={e=>set("anschaffungspreis", e.target.value===""?null:parseFloat(e.target.value))} /></label>
        <label className="flex flex-col text-sm">Anschaffungsdatum<input className="input" type="date" value={form.anschaffungsdatum??""} onChange={e=>set("anschaffungsdatum", e.target.value||null)} /></label>
        <label className="flex flex-col text-sm">Firma-ID<input className="input" type="number" value={form.firma_id} onChange={e=>set("firma_id", parseInt(e.target.value))} /></label>
        <label className="flex flex-col text-sm">Mietpark-ID<input className="input" type="number" value={form.mietpark_id??""} onChange={e=>set("mietpark_id", e.target.value===""?null:parseInt(e.target.value))} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>Abbrechen</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>Speichern</button>
      </div>
    </Modal>
  );
}
