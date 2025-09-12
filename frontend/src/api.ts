import type { Geraet, Kunde, Vermietung, CountResponse, IdName } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = !!init.body;
  const isGet = !init.method || init.method.toUpperCase() === "GET";

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    ...(isGet
      ? {}
      : {
          headers: {
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            ...(init.headers || {}),
          },
        }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET/POST ${path} ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  // ---- Stammdaten ----
  listFirmen: () => request<IdName[]>("/firmen"),
  listMietparks: () => request<IdName[]>("/mietparks"),
  listKunden: () => request<Kunde[]>("/kunden"),
  createKunde: (body: any) =>
    request<Kunde>("/kunden", { method: "POST", body: JSON.stringify(body) }),
  updateKunde: (id: number, body: any) =>
    request<Kunde>(`/kunden/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  createMietpark: (body: any) =>
    request<IdName>("/mietparks", { method: "POST", body: JSON.stringify(body) }),
  createFirma: (body: any) =>
    request<IdName>("/firmen", { method: "POST", body: JSON.stringify(body) }),

  // ---- Geräte ----
  listGeraete: (params: {
    status?: string;
    standort_typ?: string;
    skip?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.standort_typ) q.set("standort_typ", params.standort_typ);
    q.set("skip", String(params.skip ?? 0));
    q.set("limit", String(params.limit ?? 50));
    return request<Geraet[]>(`/geraete?${q.toString()}`);
  },

  countGeraete: (params: { status?: string; standort_typ?: string }) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.standort_typ) q.set("standort_typ", params.standort_typ);
    return request<CountResponse>(`/geraete/count?${q.toString()}`);
  },

  createGeraet: (body: any) =>
    request<Geraet>("/geraete", { method: "POST", body: JSON.stringify(body) }),
  updateGeraet: (id: number, body: any) =>
    request<Geraet>(`/geraete/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteGeraet: (id: number) => request(`/geraete/${id}`, { method: "DELETE" }),

  getGeraet: (id: number) => request<Geraet>(`/geraete/${id}`),
  // Falls dein Backend diese Route hat:
  vermietungenByGeraet: (id: number) =>
    request<Vermietung[]>(`/geraete/${id}/vermietungen`),

  // ---- Vermietungen ----
  listVermietungen: () => request<Vermietung[]>("/vermietungen"),
  createVermietung: (body: any) =>
    request<Vermietung>("/vermietungen", { method: "POST", body: JSON.stringify(body) }),
  startenVermietung: (id: number) =>
    request<Vermietung>(`/vermietungen/${id}/starten`, { method: "POST" }),
  schliessenVermietung: (id: number) =>
    request<Vermietung>(`/vermietungen/${id}/schliessen`, { method: "POST" }),

  // ---- Positionen & Rechnungen ----
  addPosition: (body: any) =>
    request<any>("/vermietung-positionen", { method: "POST", body: JSON.stringify(body) }),
  searchRechnungen: (nummer: string) =>
    request<any[]>(`/rechnungen/suche?nummer=${encodeURIComponent(nummer)}`),
  createRechnung: (body: any) =>
    request<any>("/rechnungen", { method: "POST", body: JSON.stringify(body) }),
  toggleRechnungBezahlt: (id: number, bezahlt: boolean) =>
    request<any>(`/rechnungen/${id}/bezahlt?bezahlt=${bezahlt}`, { method: "PATCH" }),

  // ---- Berichte ----
  auslastung: (body: any) =>
    request<any>("/berichte/auslastung", { method: "POST", body: JSON.stringify(body) }),
  abrechnung: (vermietungId: number) =>
    request<any>(`/berichte/vermietungen/${vermietungId}/abrechnung`),
  geraetFinanzen: (geraetId: number, von?: string, bis?: string) => {
    const q = new URLSearchParams();
    if (von) q.set("von", von);
    if (bis) q.set("bis", bis);
    return request<any>(`/berichte/geraete/${geraetId}/finanzen?${q.toString()}`);
  },
};

