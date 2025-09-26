import { useEffect, useState } from "react";
import { api } from "../api";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

type IdName = { id: number; name: string };

const EINHEITEN = ["TAEGLICH", "WOECHENTLICH", "MONATLICH"] as const;
type Einheit = typeof EINHEITEN[number];

export default function NewRentalModal({ open, onClose, onCreated }: Props) {
  const [geraete, setGeraete] = useState<IdName[]>([]);
  const [kunden, setKunden] = useState<IdName[]>([]);

  const [geraetId, setGeraetId] = useState<number | "">("");
  const [kundeId, setKundeId] = useState<number | "">("");
  const [von, setVon] = useState<string>("");
  const [bis, setBis] = useState<string>(""); // <-- optional

  const [satzWert, setSatzWert] = useState<string>("");
  const [satzEinheit, setSatzEinheit] = useState<Einheit>("MONATLICH");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [g, k] = await Promise.all([
          api.listGeraete({ skip: 0, limit: 500 }),
          api.listKunden(),
        ]);
        setGeraete((g as any[]).map(x => ({ id: x.id, name: x.name ?? `Gerät ${x.id}` })));
        setKunden(k as IdName[]);
      } catch (e: any) {
        setErr(e?.message ?? "Laden fehlgeschlagen");
      }
    })();
  }, [open]);

  async function submit() {
    setErr(null);

    if (!geraetId) return setErr("Bitte ein Gerät wählen.");
    if (!kundeId) return setErr("Bitte einen Kunden wählen.");
    if (!von) return setErr("Bitte Startdatum wählen.");
    if (bis && bis < von) return setErr("„Bis“ darf nicht vor „Von“ liegen.");
    if (!satzWert.trim()) return setErr("Bitte einen Mietsatz angeben.");
    const wertNum = Number(satzWert);
    if (Number.isNaN(wertNum) || wertNum < 0) return setErr("Ungültiger Mietsatz.");

    setBusy(true);
    try {
      await api.createVermietung({
        geraet_id: Number(geraetId),
        kunde_id: Number(kundeId),
        von,
        // WICHTIG: leeres Enddatum als null -> offenes Ende
        bis: bis ? bis : null,
        satz_wert: wertNum,
        satz_einheit: satzEinheit,
      });
      onCreated();
      onClose();
      // reset
      setGeraetId("");
      setKundeId("");
      setVon("");
      setBis("");
      setSatzWert("");
      setSatzEinheit("MONATLICH");
    } catch (e: any) {
      setErr(e?.message ?? "Anlegen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Neue Vermietung</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">✕</button>
        </div>

        {err && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Gerät *</span>
            <select
              className="rounded-xl border p-2"
              value={geraetId}
              onChange={e => {
                const v = e.target.value;
                setGeraetId(v === "" ? "" : Number(v));
              }}
            >
              <option value="">— wählen —</option>
              {geraete.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Kunde *</span>
            <select
              className="rounded-xl border p-2"
              value={kundeId}
              onChange={e => {
                const v = e.target.value;
                setKundeId(v === "" ? "" : Number(v));
              }}
            >
              <option value="">— wählen —</option>
              {kunden.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Von *</span>
              <input type="date" className="rounded-xl border p-2" value={von} onChange={e => setVon(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Bis <span className="text-slate-500">(optional)</span></span>
              <input
                type="date"
                className="rounded-xl border p-2"
                value={bis}
                onChange={e => setBis(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Mietsatz *</span>
              <input
                className="rounded-xl border p-2"
                inputMode="decimal"
                placeholder="z. B. 15000"
                value={satzWert}
                onChange={e => setSatzWert(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Einheit *</span>
              <select
                className="rounded-xl border p-2"
                value={satzEinheit}
                onChange={e => setSatzEinheit(e.target.value as Einheit)}
              >
                {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>Abbrechen</button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50" onClick={submit} disabled={busy}>
            {busy ? "Anlegen…" : "Anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
