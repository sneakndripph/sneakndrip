// Last-touch UTM attribution, kept in localStorage for 30 days and attached to the order at checkout.
const KEY = "snd_utm";
const FIELDS = ["source", "medium", "campaign", "content", "term"] as const;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Utm = Partial<Record<(typeof FIELDS)[number], string>>;

export function captureUtm(search: string) {
  try {
    const params = new URLSearchParams(search);
    const utm: Utm = {};
    for (const f of FIELDS) {
      const v = params.get(`utm_${f}`)?.trim().slice(0, 100);
      if (v) utm[f] = v;
    }
    if (Object.keys(utm).length) localStorage.setItem(KEY, JSON.stringify({ ...utm, ts: Date.now() }));
  } catch { /* storage blocked */ }
}

export function readUtm(): Utm | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { ts, ...utm } = JSON.parse(raw) as Utm & { ts: number };
    if (!ts || Date.now() - ts > TTL_MS) return null;
    return utm;
  } catch {
    return null;
  }
}
