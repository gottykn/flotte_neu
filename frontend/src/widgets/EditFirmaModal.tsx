import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import type { Firma } from "../types";
import { api } from "../api";

export default function EditFirmaModal({
  open,
  onClose,
  firma,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  firma: Firma | null;
  onSaved: (f: Firma) => void;
}) {
  const [form, setForm] = useState<Firma | null>(firma);
  useEffect(() => setForm(firma), [firma]);

  const setField = (key: keyof Firma | "ust_id" | "adresse", value: any) => {
    if (!form) return;
    setForm({ ...(form as any), [key]: value } as Firma);
  };

  async function submit() {
    if (!form) return;
    const body = {
      name: form.name,
      ust_id: (form as any).ust_id ?? "",
      adresse: (form as any).adresse ?? "",
    };
    const saved = await api.updateFirma(form.id, body);
    onSaved(saved as any);
    onClose();
  }

  if (!open || !form) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Firma bearbeiten #${form.id}`}>
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
