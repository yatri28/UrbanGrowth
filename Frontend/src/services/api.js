const BASE = 'https://urbangrowth.onrender.com'
export const API_URL = "https://urbangrowth.onrender.com"
// ── Core fetch helper ──────────────────────────────────
async function get(path) {
  try {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`API error [${path}]:`, e)
    return null
  }
}

// ── Per-area endpoints (used by Atlas, Compare) ────────
export const api = {
  areas:     year    => get(`/areas/${year}`),
  predTrend: gid     => get(`/prediction-trend/${gid}`),
  predStats: year    => get(`/prediction-stats/${year}`),
  history:   gid     => get(`/history/${gid}`),
  scatter:   year    => get(`/scatter/${year}`),
}

// ── City-wide aggregates (used by Overview, Forecast, Insights) ──
export const cityApi = {
  history:      () => get('/city-history'),
  predictions:  () => get('/city-predictions'),
  topGrowing:   (n = 8) => get(`/top-growing?n=${n}`),
  mostBuilt:    (n = 8) => get(`/most-built?n=${n}`),
  correlations: ()      => get('/correlations'),
  yoyChanges:   ()      => get('/yoy-changes'),
}