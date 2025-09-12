import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import type { Mietpark } from "../types";
import { api } from "../api";

export default function EditMietparkModal({
  open,
  onClose,
  park,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  park: Mietpark | null;
  onSaved: (p: Mietpark) => void;
}) {
  const [form, setForm] = useState<Mietpark | null>(park);
  useEffect(() => setForm(park), [park]);

  const setField = (key: keyof Mietpark | "adresse", value: any) => {
    if (!form) return;
    setForm({ ...(form as any), [key]: value } as Mietpark);
  };

  async function submit() {
    if (!form) return;
    const body = {
      name: form.name,
      adresse: (form as any).adresse ?? "",
    };
    const saved = await api.updateMietpark(form.id, body);
    onSaved(saved as any);
    onClose();
  }

  if (!open || !form) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Mietpark bearbeiten #${form.id}`}>
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
