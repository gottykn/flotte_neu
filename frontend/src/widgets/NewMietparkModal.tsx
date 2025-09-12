import { useState } from "react";
import Modal from "../components/Modal";
import { api } from "../api";
import type { Mietpark } from "../types";

export default function NewMietparkModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: Mietpark) => void;
}) {
  const [name, setName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!name.trim()) return setErr("Name ist Pflicht.");
    setBusy(true);
    try {
      const created = await api.createMietpark({ name, adresse });
      onCreated(created as any);
      onClose();
      setName(""); setAdresse("");
    } catch (e: any) {
      setErr(e?.message ?? "Anlegen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Neuer Mietpark">
      {err && <div className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">{err}</div>}
      <div className="grid gap-3">
        <label className="flex flex-col text-sm">
          Name *
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="flex flex-col text-sm">
          Adresse
          <input className="input" value={adresse} onChange={e => setAdresse(e.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>Abbrechen</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit} disabled={busy}>
          Speichern
        </button>
      </div>
    </Modal>
  );
}
