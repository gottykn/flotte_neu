import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { api } from "../api";
import type { Geraet /* , SatzEinheit */ } from "../types";

// Wenn du SatzEinheit in types.ts definiert hast (TAEGLICH|WOECHENTLICH|MONATLICH),
// kannst du den lokalen Typ unten entfernen und stattdessen importieren.
type SatzEinheitLocal = "TAEGLICH" | "WOECHENTLICH" | "MONATLICH";

export default function EditGeraetModal({
  open,
  onClose,
  geraet,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  geraet: Geraet | null;
  onSaved: (g: Geraet) => void;
}) {
  // form als "any", damit es auch funktioniert, falls die neuen Felder
  // noch nicht in deiner Geraet-Schnittstelle sind.
  const [form, setForm] = useState<any>(geraet);

  useEffect(() => {
    if (!geraet) return;
    setForm({
      ...geraet,
      // Fallbacks für neue Felder
      baujahr: geraet?.baujahr ?? null,
      vermietet_in: geraet?.vermietet_in ?? "",
      mietpreis_wert: geraet?.mietpreis_wert ?? null,
      mietpreis_einheit:
        (geraet?.mietpreis_einheit as SatzEinheitLocal) ?? "MONATLICH",
    });
  }, [geraet]);

  if (!open || !form) return null;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const hasPrice =
    form.mietpreis_wert !== null &&
    form.mietpreis_wert !== undefined &&
    form.mietpreis_wert !== "";

  const submit = async () => {
    // sauber konvertieren
    const payload: any = {
      ...form,
      anschaffungsdatum: form.anschaffungsdatum || null,
      mietpark_id:
        form.standort_typ === "MIETPARK"
          ? form.mietpark_id || null
          : null,
      baujahr:
        form.baujahr === "" || form.baujahr === null
          ? null
          : Number(form.baujahr),
      vermietet_in: form.vermietet_in
        ? String(form.vermietet_in).toUpperCase()
        : null,
      mietpreis_wert:
        form.mietpreis_wert === "" || form.mietpreis_wert === null
          ? null
          : Number(form.mietpreis_wert),
      mietpreis_einheit: hasPrice ? form.mietpreis_einheit : null,
    };

    const saved = await api.updateGeraet(form.id, payload);
    onSaved(saved);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Gerät bearbeiten #${form.id}`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Basis */}
        <label className="flex flex-col text-sm">
          Name
          <input className="input" value={form.name} onChange={e => set("name", e.target.value)} />
        </label>

        <label className="flex flex-col text-sm">
          Kategorie
          <input className="input" value={form.kategorie || ""} onChange={e => set("kategorie", e.target.value)} />
        </label>

        <label className="flex flex-col text-sm">
          Status
          <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="VERFUEGBAR">VERFUEGBAR</option>
            <option value="VERMIETET">VERMIETET</option>
            <option value="WARTUNG">WARTUNG</option>
            <option value="AUSGEMUSTERT">AUSGEMUSTERT</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Standort-Typ
          <select className="input" value={form.standort_typ} onChange={e => set("standort_typ", e.target.value)}>
            <option value="MIETPARK">MIETPARK</option>
            <option value="KUNDE">KUNDE</option>
          </select>
        </label>

        {/* Zuordnung */}
        <label className="flex flex-col text-sm">
          Firma-ID
          <input className="input" type="number" inputMode="numeric"
                 value={form.firma_id ?? ""} onChange={e => set("firma_id", Number(e.target.value))}/>
        </label>

        {form.standort_typ === "MIETPARK" && (
          <label className="flex flex-col text-sm">
            Mietpark-ID
            <input className="input" type="number" inputMode="numeric"
                   value={form.mietpark_id ?? ""} onChange={e => set("mietpark_id", e.target.value === "" ? null : Number(e.target.value))}/>
          </label>
        )}

        {/* Zusatzinfos (neu) */}
        <label className="flex flex-col text-sm">
          Baujahr
          <input className="input" inputMode="numeric" placeholder="z. B. 2021"
                 value={form.baujahr ?? ""} onChange={e => set("baujahr", e.target.value === "" ? "" : Number(e.target.value))}/>
        </label>

        <label className="flex flex-col text-sm">
          Vermietet in (Land)
          <input className="input" placeholder="DE / AT / CH …" maxLength={2}
                 value={form.vermietet_in ?? ""} onChange={e => set("vermietet_in", e.target.value.toUpperCase())}/>
        </label>

        <label className="flex flex-col text-sm">
          Mietpreis
          <input className="input" inputMode="decimal" placeholder="z. B. 1200"
                 value={form.mietpreis_wert ?? ""} onChange={e => set("mietpreis_wert", e.target.value)}/>
        </label>

        <label className="flex flex-col text-sm">
          Einheit
          <select
            className="input"
            value={(form.mietpreis_einheit as SatzEinheitLocal) ?? "MONATLICH"}
            onChange={e => set("mietpreis_einheit", e.target.value as SatzEinheitLocal)}
            disabled={!hasPrice}
            title={!hasPrice ? "Erst Mietpreis eingeben" : undefined}
          >
            <option value="TAEGLICH">TAEGLICH</option>
            <option value="WOECHENTLICH">WOECHENTLICH</option>
            <option value="MONATLICH">MONATLICH</option>
          </select>
        </label>

        {/* (Optional) bestehende Felder beibehalten */}
        <label className="flex flex-col text-sm">
          Modell
          <input className="input" value={form.modell || ""} onChange={e => set("modell", e.target.value)} />
        </label>
        <label className="flex flex-col text-sm">
          Seriennummer
          <input className="input" value={form.seriennummer || ""} onChange={e => set("seriennummer", e.target.value)} />
        </label>
        <label className="flex flex-col text-sm">
          Stundenzähler
          <input className="input" type="number" inputMode="decimal"
                 value={form.stundenzähler} onChange={e => set("stundenzähler", Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">
          Anschaffungspreis
          <input className="input" type="number" inputMode="decimal"
                 value={form.anschaffungspreis ?? ""} onChange={e => set("anschaffungspreis", e.target.value === "" ? null : Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">
          Anschaffungsdatum
          <input className="input" type="date"
                 value={form.anschaffungsdatum ?? ""} onChange={e => set("anschaffungsdatum", e.target.value || null)} />
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>Abbrechen</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>Speichern</button>
      </div>
    </Modal>
  );
}
