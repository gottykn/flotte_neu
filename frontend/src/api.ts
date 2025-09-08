const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Bei GET KEINE Header setzen, um Preflight zu vermeiden.
  const hasBody = !!init.body;
  const isGet = !init.method || init.method.toUpperCase() === "GET";

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    ...(isGet
      ? {} // GET: keine Header
      : {
          // POST/PUT/PATCH: JSON-Header nur, wenn wir ein Body senden
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
  // Stammdaten
  listFirmen: () => request("/firmen"),
  listMietparks: () => request("/mietparks"),
  listKunden: () => request("/kunden"),
  createKunde: (body: any) => request("/kunden", { method: "POST", body: JSON.stringify(body) }),
  updateKunde: (id: number, body: any) => request(`/kunden/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Geräte
  listGeraete: (params: {status?: string; standort_typ?: string; skip?: number; limit?: number}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.standort_typ) q.set("standort_typ", params.standort_typ);
    q.set("skip", String(params.skip ?? 0));
    q.set("limit", String(params.limit ?? 50));
    return request(`/geraete?${q.toString()}`);
  },
  countGeraete: (params: {status?: string; standort_typ?: string}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.standort_typ) q.set("standort_typ", params.standort_typ);
    return request(`/geraete/count?${q.toString()}`);
  },
  createGeraet: (body: any) => request("/geraete", { method: "POST", body: JSON.stringify(body) }),
  updateGeraet: (id: number, body: any) => request(`/geraete/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Vermietungen
  listVermietungen: () => request("/vermietungen"),
  createVermietung: (body: any) => request("/vermietungen", { method: "POST", body: JSON.stringify(body) }),
  startenVermietung: (id: number) => request(`/vermietungen/${id}/starten`, { method: "POST" }),
  schliessenVermietung: (id: number) => request(`/vermietungen/${id}/schliessen`, { method: "POST" }),

  // Positionen & Rechnungen
  addPosition: (body: any) => request("/vermietung-positionen", { method: "POST", body: JSON.stringify(body) }),
  searchRechnungen: (nummer: string) => request(`/rechnungen/suche?nummer=${encodeURIComponent(nummer)}`),
  createRechnung: (body: any) => request("/rechnungen", { method: "POST", body: JSON.stringify(body) }),
  toggleRechnungBezahlt: (id: number, bezahlt: boolean) =>
    request(`/rechnungen/${id}/bezahlt?bezahlt=${bezahlt}`, { method: "PATCH" }),

  // Berichte
  auslastung: (body: any) => request("/berichte/auslastung", { method: "POST", body: JSON.stringify(body) }),
  abrechnung: (vermietungId: number) => request(`/berichte/vermietungen/${vermietungId}/abrechnung`),
  geraetFinanzen: (geraetId: number, von?: string, bis?: string) => {
    const q = new URLSearchParams();
    if (von) q.set("von", von);
    if (bis) q.set("bis", bis);
    return request(`/berichte/geraete/${geraetId}/finanzen?${q.toString()}`);
  }
};
