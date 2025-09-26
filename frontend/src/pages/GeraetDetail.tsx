// src/pages/GeraetDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Geraet, Vermietung } from "../types";
import Money from "../components/Money";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function GeraetDetailPage() {
  const { id } = useParams();
  const gid = Number(id);
  if (!gid) return <div className="p-4">Ungültige Geräte-ID.</div>;
  return <GeraetDetail id={gid} />;
}

function GeraetDetail({ id }: { id: number }) {
  const nav = useNavigate();
  const [g, setG] = useState<Geraet | null>(null);
  const [verm, setVerm] = useState<Vermietung[]>([]);
  const [fin, setFin] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Gerät immer zuerst (wenn das fehlschlägt, Seite sinnvoll beenden)
      try {
        const gd = await api.getGeraet(id);
        if (!cancelled) setG(gd);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Gerät konnte nicht geladen werden.");
          setLoading(false);
        }
        return; // nicht weiterladen
      }

      // 2) Rest tolerant laden
      const [vermRes, finRes] = await Promise.allSettled([
        api.listVermietungen(),
        api.geraetFinanzen(id),
      ]);

      if (!cancelled) {
        if (vermRes.status === "fulfilled") {
          const alle = vermRes.value as Vermietung[];
          setVerm(
            alle.filter(
              (v: any) => v.geraet_id === id || v.geraet?.id === id
            )
          );
        }
        if (finRes.status === "fulfilled") {
          setFin(finRes.value);
        } else {
          // Finanzen optional – kein Blocker für die Seite
          setFin(null);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const einnahmen = Number(fin?.einnahmen ?? fin?.miete_summe ?? 0);
  const kosten = Number(fin?.kosten ?? fin?.kosten_summe ?? 0);
  const marge = einnahmen - kosten;

  const chartData = useMemo(
    () => [
      { name: "Einnahmen", value: einnahmen },
      { name: "Ausgaben", value: kosten },
    ],
    [einnahmen, kosten]
  );

  if (loading) return <div className="p-4">Lade Gerät…</div>;
  if (err) return <div className="p-4 text-red-700">{err}</div>;
  if (!g) return <div className="p-4">Gerät nicht gefunden.</div>;

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex items-center gap-3">
        <button className="btn" onClick={() => nav(-1)}>
          ← Zurück
        </button>
        <h1 className="text-2xl font-semibold">{g.name}</h1>
        <span className="ml-auto text-xs rounded-xl px-2 py-1 bg-slate-100">
          {g.kategorie || "—"}
        </span>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Kpi title="Status" value={g.status} />
        <Kpi title="Standort" value={g.standort_typ} />
        <Kpi title="Stundenzähler" value={String(g.stundenzähler)} />
        <Kpi
          title="Marge"
          value={<Money value={marge} />}
          tone={marge >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="rounded-2xl border p-4">
        <div className="mb-2 font-semibold">Einnahmen vs. Ausgaben</div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            Einnahmen: <b><Money value={einnahmen} /></b>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            Ausgaben: <b><Money value={kosten} /></b>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            Marge: <b><Money value={marge} /></b>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="mb-2 font-semibold">Vergangene Vermietungen</div>
        {!verm.length ? (
          <div className="text-sm text-slate-500">Keine Vermietungen vorhanden.</div>
        ) : (
          <ul className="divide-y">
            {verm.map((v) => (
              <li key={v.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    #{v.id} → Kunde {v.kunde_id}
                  </div>
                  <div className="text-xs text-slate-500">
                    {v.von} bis {v.bis ?? "offen"} · {v.satz_wert} / {v.satz_einheit} · {v.status}
                  </div>
                </div>
                <Link className="text-sm text-blue-700 hover:underline" to="/vermietungen">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: React.ReactNode;
  tone?: "good" | "bad";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "good" ? "bg-green-50" : tone === "bad" ? "bg-red-50" : ""
      }`}
    >
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
