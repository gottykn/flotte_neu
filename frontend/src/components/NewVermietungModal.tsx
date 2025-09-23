import { useEffect, useState } from "react";
import { api } from "../api";

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

type IdName = { id: number; name: string };

export default function NewVermietungModal({ open, onClose, onCreated }: Props) {
  const [geraete, setGeraete] = useState<IdName[]>([]);
  const [kunden, setKunden] = useState<IdName[]>([]);

  const [geraetId, setGeraetId] = useState<number | "">("");
  const [kundeId, setKundeId] = useState<number | "">("");
  const [von, setVon] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bis, setBis] = useState<string>("");
  const [offen, setOffen] = useState<boolean>(true); // <-- neu

  const [satzWert, setSatzWert] = useState<string>("");
  const [satzEinheit, setSatzEinheit] = useState<"TAEGLICH"|"WOECHENTLICH"|"MONATLICH">("MONATLICH");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setErr(null);
      try {
        // Für die Auswahl reicht uns eine flache Liste (id+name)
        const [gs, ks] = await Promise.all([
          // wir recyceln listGeraete & listKunden und mappen später
          api.listGeraete({ limit: 500 }),
          api.listKunden()
        ]);
        const gSimple: IdName[] = gs.map((g:any)=>({ id: g.id, name: g.name }));
        setGeraete(gSimple);
        setKunden(ks);
      } catch (e:any) {
        setErr(e?.message ?? "Laden fehlgeschlagen.");
      }
    })();
  }, [open]);

  async function submit() {
    setErr(null);
    if (!geraetId) return setErr("Bitte ein Gerät wählen.");
    if (!kundeId) return setErr("Bitte einen Kunden wählen.");
    if (!von) return setErr("Bitte Startdatum (von) wählen.");
    if (!offen && !bis) return setErr("Bitte Enddatum (bis) wählen oder 'ohne Enddatum' ankreuzen.");
    if (satzWert && isNaN(Number(satzWert))) return setErr("Satzwert muss eine Zahl sein.");

    setBusy(true);
    try {
      await api.createVermietung({
        geraet_id: Number(geraetId),
        kunde_id: Number(kundeId),
        von,
        bis: offen ? null : bis,                // <-- hier wird offenes Ende umgesetzt
        satz_wert: satzWert ? Number(satzWert) : 0,
        satz_einheit: satzEinheit,
        status: "RESERVIERT",
      });
      onCreated();
      onClose();
      // reset
      setGeraetId(""); setKundeId(""); setVon(new Date().toISOString().slice(0,10));
      setBis(""); setOffen(true); setSatzWert(""); setSatzEinheit("MONATLICH");
    } catch (e:any) {
      setErr(e?.message ?? "Speichern fehlgeschlagen.");
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
            <select className="rounded-xl border p-2" value={geraetId} onChange={e=>setGeraetId(Number(e.target.value))}>
              <option value="">— wählen —</option>
              {geraete.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Kunde *</span>
            <select className="rounded-xl border p-2" value={kundeId} onChange={e=>setKundeId(Number(e.target.value))}>
              <option value="">— wählen —</option>
              {kunden.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Von *</span>
              <input type="date" className="rounded-xl border p-2" value={von} onChange={e=>setVon(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Bis</span>
              <input
                type="date"
                className="rounded-xl border p-2 disabled:bg-gray-100"
                value={bis}
                onChange={e=>setBis(e.target.value)}
                disabled={offen}
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={offen} onChange={e=>setOffen(e.target.checked)} />
            Ohne Enddatum (offen)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Satzwert</span>
              <input className="rounded-xl border p-2" inputMode="decimal" value={satzWert} onChange={e=>setSatzWert(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Einheit</span>
              <select className="rounded-xl border p-2" value={satzEinheit} onChange={e=>setSatzEinheit(e.target.value as any)}>
                <option value="TAEGLICH">TAEGLICH</option>
                <option value="WOECHENTLICH">WOECHENTLICH</option>
                <option value="MONATLICH">MONATLICH</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>Abbrechen</button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50" onClick={submit} disabled={busy}>
            {busy ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
