import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import type { Kunde } from "../types";
import { api } from "../api";

export default function EditKundeModal({
  open,
  onClose,
  kunde,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  kunde: Kunde | null;
  onSaved: (k: Kunde) => void;
}) {
  const [form, setForm] = useState<Kunde | null>(kunde);
  useEffect(() => setForm(kunde), [kunde]);

  const setField = (key: keyof Kunde | "ust_id" | "adresse", value: any) => {
    if (!form) return;
    setForm({ ...(form as any), [key]: value } as Kunde);
  };

  async function submit() {
    if (!form) return;
    const body = {
      name: form.name,
      ust_id: (form as any).ust_id ?? "",
      adresse: (form as any).adresse ?? "",
    };
    const saved = await api.updateKunde(form.id, body);
    onSaved(saved as any);
    onClose();
  }

  if (!open || !form) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Kunde bearbeiten #${form.id}`}>
      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col text-sm">
          Name
          <input
            className="input"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm">
          USt-ID
          <input
            className="input"
            value={(form as any).ust_id ?? ""}
            onChange={(e) => setField("ust_id", e.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm">
          Adresse
          <input
            className="input"
            value={(form as any).adresse ?? ""}
            onChange={(e) => setField("adresse", e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>
          Abbrechen
        </button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>
          Speichern
        </button>
      </div>
    </Modal>
  );
}
