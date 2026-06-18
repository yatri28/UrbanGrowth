import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../services/api'
import { useCompare } from '../hooks/useCompare'
import { useGeoJSON, AREA_BOUNDARIES, COMPARE_COLORS } from '../hooks/useGeoJSON'
import AreaBoundary from '../components/map/AreaBoundary'
import FitBounds from '../components/map/FitBounds'
import { Search, X, GitCompare, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'

const YEARS = [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2035,2040]

const CLASS_COLORS = {
  high:   '#1E7A4A',
  medium: '#C06A1A',
  low:    '#6B7280',
}
const CLASS_BG = {
  high:   '#f0f7f2',
  medium: '#fdf4ee',
  low:    '#f5f6f7',
}
const CLASS_LABEL = {
  high:   'High Growth',
  medium: 'Moderate Growth',
  low:    'Stable',
}

const M = {
  built: '#D4730E',
  green: '#1E7A4A',
  night: '#2457B3',
}

const CLASS_ORDER = { high: 0, medium: 1, low: 2 }

function FlyTo({ area }) {
  const map = useMap()
  useEffect(() => {
    if (area?.center_lat) map.flyTo([area.center_lat, area.center_lon], 15, { duration: 1.2 })
  }, [area?.area_name])
  return null
}

function KpiChip({ label, value, unit = '%', color }) {
  const num = parseFloat(value)
  const display = isNaN(num) ? '—' : `${num.toFixed(1)}${unit}`
  return (
    <div style={{
      flex: 1, minWidth: 0,
      padding: '10px 12px',
      borderRadius: 8,
      background: 'var(--paper)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'IBM Plex Mono', lineHeight: 1 }}>
        {display}
      </div>
    </div>
  )
}

function MetricRow({ label, value, unit = '%', color, note, barMax = 100 }) {
  const num      = parseFloat(value)
  const barWidth = isNaN(num) ? 0 : Math.min((Math.abs(num) / barMax) * 100, 100)
  const display  = isNaN(num) ? '—' : `${num.toFixed(1)}${unit}`

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontSize: 17, fontWeight: 900, color, fontFamily: 'IBM Plex Mono', lineHeight: 1 }}>
          {display}
        </span>
      </div>
      <div style={{ height: 3, background: `${color}20`, borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 99, transition: 'width 0.55s ease' }} />
      </div>
      {note && (
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', lineHeight: 1.5 }}>{note}</div>
      )}
    </div>
  )
}

function ClassPill({ growthClass, confidence, year }) {
  const color = CLASS_COLORS[growthClass] ?? '#888'
  const bg    = CLASS_BG[growthClass]    ?? 'var(--paper)'
  const label = CLASS_LABEL[growthClass] ?? growthClass

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 10,
      background: bg,
      border: `1.5px solid ${color}50`,
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: 4 }}>
          Growth Class · {year}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color, letterSpacing: '-0.01em' }}>
          {label}
        </div>
      </div>
      {confidence != null && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: 4 }}>
            Confidence
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'IBM Plex Mono', color: 'var(--ink)' }}>
            {parseFloat(confidence).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  )
}

function MapContent({ selected, compareMode, activeBoundary, activeBounds, compareBoundaries }) {
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      {activeBounds
        ? <FitBounds bounds={activeBounds} />
        : <FlyTo area={selected} />
      }
      {!compareMode && activeBoundary && selected && (
        <AreaBoundary
          key={`boundary-${selected.area_name}`}
          boundary={activeBoundary}
          growthClass={selected.growth_class?.toLowerCase()}
          areaName={selected.area_name}
          confidence={selected.confidence}
          builtPercent={selected.built_percent}
        />
      )}
      {compareMode && compareBoundaries.map(({ areaName, boundary, growthClass, compareIndex }) => (
        <AreaBoundary
          key={`compare-${areaName}`}
          boundary={boundary}
          growthClass={growthClass}
          isCompare
          compareColor={COMPARE_COLORS[compareIndex % COMPARE_COLORS.length]}
          areaName={areaName}
        />
      ))}
    </>
  )
}

export default function Atlas() {
  const [year, setYear]         = useState(2024)
  const [areas, setAreas]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  const [activeBoundary, setActiveBoundary]       = useState(null)
  const [activeBounds, setActiveBounds]           = useState(null)
  const [compareBoundaries, setCompareBoundaries] = useState([])
  const [noBoundaryArea, setNoBoundaryArea]       = useState(null)
  const noBoundaryTimer = useRef(null)

  const { compareAreas, toggleCompareArea } = useCompare()
  const { getBoundary, getMultipleBoundaries, loading: loadingBoundary } = useGeoJSON()

  // ── Load areas ──
  useEffect(() => {
    setLoading(true)
    api.areas(year).then(d => {
      if (d?.areas) setAreas(d.areas)
      setLoading(false)
    })
  }, [year])

  // ── Boundary for selected area ──
  useEffect(() => {
    if (!selected || compareMode) {
      setActiveBoundary(null); setActiveBounds(null); return
    }
    setActiveBoundary(null); setActiveBounds(null)
    getBoundary(selected.area_name).then(result => {
      if (result) {
        setActiveBoundary(result); setActiveBounds(result.bounds)
      } else {
        clearTimeout(noBoundaryTimer.current)
        setNoBoundaryArea(selected.area_name)
        noBoundaryTimer.current = setTimeout(() => setNoBoundaryArea(null), 3500)
      }
    })
  }, [selected?.area_name, compareMode])

  // ── Boundaries for compare mode ──
  useEffect(() => {
    if (!compareMode || !compareAreas.length) {
      setCompareBoundaries([]); setActiveBounds(null); return
    }
    getMultipleBoundaries(compareAreas.map(a => a.area_name)).then(results => {
      const withIndex = results.map((r, i) => ({
        ...r,
        growthClass:  compareAreas.find(a => a.area_name === r.areaName)?.growth_class?.toLowerCase(),
        compareIndex: i,
      }))
      setCompareBoundaries(withIndex)
      if (withIndex.length > 0) {
        const allBounds = withIndex.map(r => r.boundary.bounds).filter(Boolean)
        if (allBounds.length) {
          const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0])
          setActiveBounds(combined)
        }
      }
    })
  }, [compareMode, compareAreas.map(a => a.area_name).join(',')])

  // ── Area summary ──
  useEffect(() => {
    if (!selected?.area_name) { setOverview(null); return }
    const controller = new AbortController()
    setOverview(null)
    setOverviewLoading(true)
    fetch(
      `https://urbangrowth.onrender.com/area-overview?area_name=${encodeURIComponent(selected.area_name)}&year=${year}`,
      { signal: controller.signal }
    )
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { setOverview(d); setOverviewLoading(false) })
      .catch(err => { if (err.name !== 'AbortError') { setOverview(null); setOverviewLoading(false) } })
    return () => controller.abort()
  }, [year, selected?.area_name])

  const handleSelectArea = useCallback(area => setSelected(area), [])

  // ── Filter, sort (High → Medium → Low, then built_percent desc), counts ──
  const filtered = areas
    .filter(a => {
      const matchClass  = filter === 'all' || a.growth_class?.toLowerCase() === filter
      const matchSearch = !search || a.area_name?.toLowerCase().includes(search.toLowerCase())
      return matchClass && matchSearch
    })
    .sort((a, b) => {
      const ca = CLASS_ORDER[a.growth_class?.toLowerCase()] ?? 99
      const cb = CLASS_ORDER[b.growth_class?.toLowerCase()] ?? 99
      if (ca !== cb) return ca - cb
      return (parseFloat(b.built_percent) || 0) - (parseFloat(a.built_percent) || 0)
    })

  const isPred    = year > 2024
  const highCount = filtered.filter(a => a.growth_class?.toLowerCase() === 'high').length
  const medCount  = filtered.filter(a => a.growth_class?.toLowerCase() === 'medium').length
  const lowCount  = filtered.filter(a => a.growth_class?.toLowerCase() === 'low').length

  // ── Selected area values ──
  const currentArea = selected
    ? areas.find(a => a.area_name?.trim().toLowerCase() === selected.area_name?.trim().toLowerCase())
    : null

  const builtVal  = currentArea?.built_percent   != null ? parseFloat(currentArea.built_percent)  : null
  const ndviVal   = currentArea?.ndvi_mean       != null ? parseFloat(currentArea.ndvi_mean)       : null
  const nightVal  = currentArea?.nighttime_mean  != null ? parseFloat(currentArea.nighttime_mean)  : null
  const confVal   = currentArea?.confidence      != null ? parseFloat(currentArea.confidence)      : null
  const growthCls = (currentArea?.growth_class ?? selected?.growth_class)?.toLowerCase()

  const nightLabel = nightVal == null ? '' : nightVal > 20 ? 'high urban activity' : nightVal > 8 ? 'moderate activity' : 'low activity'

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '14px 28px', background: '#fff',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0,
      }}>
        <div>
          <div className="research-tag" style={{ marginBottom: 2 }}>Area Atlas</div>
          <h1 className="serif" style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>
            Gandhinagar Area Explorer
          </h1>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
            {isPred ? `Predicted · ${year}` : `Historical · ${year}`} · {filtered.length} areas
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Compare toggle */}
        <button
          onClick={() => setCompareMode(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${compareMode ? 'var(--orange)' : 'var(--border)'}`,
            background: compareMode ? 'var(--orange-soft)' : 'transparent',
            color: compareMode ? 'var(--orange)' : 'var(--ink-muted)',
            fontSize: 11, fontFamily: 'IBM Plex Mono', transition: 'all 0.15s',
          }}
        >
          <Layers size={12} />
          {compareMode ? 'Comparing' : 'Compare'}
          {compareMode && compareAreas.length > 0 && (
            <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 10 }}>
              {compareAreas.length}
            </span>
          )}
        </button>

        {compareAreas.length > 0 && (
          <Link to="/compare" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', background: 'var(--paper)',
              border: '1px solid var(--border-med)', borderRadius: 8, cursor: 'pointer',
            }}>
              <GitCompare size={13} style={{ color: 'var(--orange)' }} />
              <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)' }}>
                {compareAreas.length} area{compareAreas.length > 1 ? 's' : ''} selected
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--orange)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontFamily: 'IBM Plex Mono' }}>
                Compare →
              </span>
            </div>
          </Link>
        )}

        {/* Year selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase' }}>Year</span>
          <select
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setSelected(null) }}
            style={{ padding: '7px 11px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontFamily: 'IBM Plex Sans', color: 'var(--ink)', cursor: 'pointer', outline: 'none' }}
          >
            <optgroup label="Historical Data">
              {YEARS.filter(y => y <= 2024).map(y => <option key={y} value={y}>{y}</option>)}
            </optgroup>
            <optgroup label="Predictions">
              {YEARS.filter(y => y > 2024).map(y => <option key={y} value={y}>{y}</option>)}
            </optgroup>
          </select>
          {isPred && (
            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--orange-soft)', color: 'var(--orange)', fontSize: 11, fontWeight: 600 }}>
              Predicted
            </span>
          )}
        </div>
      </div>

      {/* ── Three-panel body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Area list ── */}
        <div style={{ width: 270, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Search + filters */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative', marginBottom: 9 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search area…"
                style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, outline: 'none', background: 'var(--cream)', fontFamily: 'IBM Plex Sans' }}
                onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}>
                  <X size={11} />
                </button>
              )}
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['all','high','medium','low'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  flex: 1, padding: '5px 4px', borderRadius: 5, fontSize: 10,
                  fontFamily: 'IBM Plex Mono', fontWeight: 600, letterSpacing: '0.04em',
                  border: '1px solid ' + (filter === f ? 'var(--ink)' : 'var(--border)'),
                  background: filter === f ? 'var(--ink)' : 'transparent',
                  color: filter === f ? '#fff' : 'var(--ink-muted)',
                  cursor: 'pointer', textTransform: 'uppercase',
                }}>
                  {f === 'all' ? 'All' : f === 'high' ? `H·${highCount}` : f === 'medium' ? `M·${medCount}` : `L·${lowCount}`}
                </button>
              ))}
            </div>
          </div>

          {/* Area rows */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {loading
              ? [1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ margin: '5px 10px', height: 50, borderRadius: 8, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
                ))
              : filtered.map(area => {
                  const t      = area.growth_class?.toLowerCase()
                  const col    = CLASS_COLORS[t] || '#888'
                  const isSel  = selected?.area_name === area.area_name
                  const inCmp  = compareAreas.some(c => c.area_name === area.area_name)
                  const hasGeo = !!AREA_BOUNDARIES[area.area_name]

                  return (
                    <div
                      key={area.area_name}
                      onClick={() => handleSelectArea(area)}
                      style={{
                        margin: '2px 8px', padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                        background: isSel ? (CLASS_BG[t] ?? 'var(--paper)') : 'transparent',
                        border: '1px solid ' + (isSel ? col + '55' : 'transparent'),
                        display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--cream)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: `0 0 0 2px ${col}30` }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {area.area_name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 1, fontFamily: 'IBM Plex Mono', display: 'flex', gap: 5, alignItems: 'center' }}>
                          {area.built_percent != null ? `${parseFloat(area.built_percent).toFixed(0)}% built` : ''}
                          {area.confidence    != null ? ` · ${parseFloat(area.confidence).toFixed(0)}% conf` : ''}
                          {hasGeo && <span title="GeoJSON available" style={{ color: CLASS_COLORS.high, fontSize: 9, opacity: 0.6 }}>⬡</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 700,
                          padding: '2px 5px', borderRadius: 4,
                          background: CLASS_BG[t] ?? '#f0f0f0',
                          color: col,
                          border: `1px solid ${col}40`,
                        }}>
                          {t?.charAt(0)?.toUpperCase()}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); toggleCompareArea(area) }}
                          title={inCmp ? 'Remove from compare' : 'Add to compare'}
                          style={{
                            width: 20, height: 20, borderRadius: 4,
                            border: '1px solid ' + (inCmp ? 'var(--orange)' : 'var(--border)'),
                            background: inCmp ? 'var(--orange-soft)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: inCmp ? 'var(--orange)' : 'var(--ink-faint)', transition: 'all 0.12s', flexShrink: 0,
                          }}
                        >
                          <GitCompare size={9} />
                        </button>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* ── CENTER: Map ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,247,242,0.85)' }}>
              <div className="serif" style={{ fontSize: 18, color: 'var(--ink-muted)' }}>Loading {year}…</div>
            </div>
          )}
          {loadingBoundary && (
            <div className="boundary-loading" style={{ position: 'absolute', top: 12, right: 12, zIndex: 500 }}>
              <div className="boundary-loading__dot" />
              <span>Loading boundary…</span>
            </div>
          )}
          {noBoundaryArea && (
            <div key={noBoundaryArea} className="no-boundary-notice">
              No GeoJSON for {noBoundaryArea} — showing marker
            </div>
          )}
          {compareMode && compareBoundaries.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 20, left: 12, zIndex: 500,
              background: 'rgba(26,22,20,0.88)', backdropFilter: 'blur(8px)',
              borderRadius: 10, padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Comparing
              </div>
              {compareBoundaries.map(({ areaName, compareIndex }) => (
                <div key={areaName} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COMPARE_COLORS[compareIndex % COMPARE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#f5f3f0', fontFamily: 'IBM Plex Sans' }}>{areaName}</span>
                </div>
              ))}
            </div>
          )}
          <MapContainer center={[23.2156, 72.6369]} zoom={12} zoomControl style={{ width: '100%', height: '100%' }}>
            <MapContent
              selected={selected}
              compareMode={compareMode}
              activeBoundary={activeBoundary}
              activeBounds={activeBounds}
              compareBoundaries={compareBoundaries}
            />
          </MapContainer>
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div style={{ width: 288, flexShrink: 0, background: '#fff', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
          {!selected ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.18 }}>📍</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
                Select an area from the list to view satellite metrics and growth forecast.
              </div>
            </div>
          ) : (
            <div style={{ padding: '18px 16px' }}>

              {/* ── Area name header ── */}
              <div style={{ marginBottom: 14, paddingBottom: 13, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-faint)', marginBottom: 5 }}>
                  Selected Area
                </div>
                <h2 className="serif" style={{ fontSize: 21, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1, margin: 0 }}>
                  {selected.area_name}
                </h2>
              </div>

              {/* ── Growth class pill ── */}
              <ClassPill growthClass={growthCls} confidence={isPred ? confVal : null} year={year} />

              {/* ── Satellite KPIs (historical only) ── */}
              {!isPred && builtVal != null && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <KpiChip label="Built-up" value={builtVal} unit="%" color={M.built} />
                  <KpiChip label="Green"    value={ndviVal}  unit="%" color={M.green} />
                  <KpiChip label="Night"    value={nightVal} unit=""  color={M.night} />
                </div>
              )}

              {/* ── Detailed metric rows (historical only) ── */}
              {!isPred && (
                <div style={{
                  padding: '14px 14px 10px',
                  borderRadius: 10,
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  marginBottom: 14,
                }}>
                  <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: 12 }}>
                    Satellite Metrics · {year}
                  </div>
                  <MetricRow
                    label="Built-up Area"
                    value={builtVal}
                    unit="%"
                    color={M.built}
                    note={builtVal != null ? `${builtVal.toFixed(0)}% of land covered by buildings & roads` : 'No data'}
                    barMax={100}
                  />
                  <MetricRow
                    label="Green Space"
                    value={ndviVal}
                    unit="%"
                    color={M.green}
                    note={ndviVal != null ? `NDVI ${ndviVal.toFixed(0)}% — ${ndviVal > 40 ? 'healthy green cover' : ndviVal > 20 ? 'moderate vegetation' : 'sparse vegetation'}` : 'No data'}
                    barMax={100}
                  />
                  <MetricRow
                    label="Night Activity"
                    value={nightVal}
                    unit=""
                    color={M.night}
                    note={nightVal != null ? `${nightVal.toFixed(1)} nW/cm²/sr — ${nightLabel}` : 'No data'}
                    barMax={50}
                  />
                </div>
              )}

              {/* ── Predicted year — confidence note ── */}
              {isPred && confVal != null && (
                <div style={{
                  padding: '10px 13px', borderRadius: 8, marginBottom: 14,
                  background: '#f5f9ff', border: '1px solid #2457B320',
                  fontSize: 11, color: 'var(--ink)', lineHeight: 1.65,
                }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: M.night }}>
                    {confVal.toFixed(0)}%
                  </span>{' '}
                  XGBoost confidence for {selected.area_name} in {year}.<br />
                  <span style={{ color: 'var(--ink-muted)', fontSize: 10 }}>Area-averaged across all grid cells.</span>
                </div>
              )}

              {/* ── Area summary / growth outlook ── */}
              <div style={{
                borderRadius: 10,
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '11px 14px 10px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)' }}>
                    {isPred ? 'Growth Outlook' : 'Area Summary'} · {year}
                  </div>
                </div>

                <div style={{ padding: '12px 14px' }}>
                  {overviewLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[80,100,70].map((w,i) => (
                        <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
                      ))}
                    </div>
                  ) : overview?.points?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {overview.points.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 7,
                          fontSize: 12, lineHeight: 1.65, color: 'var(--ink)',
                          paddingBottom: i < overview.points.length - 1 ? 7 : 0,
                          borderBottom: i < overview.points.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <span style={{ color: isPred ? M.built : CLASS_COLORS[growthCls] ?? 'var(--ink-muted)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                          <span dangerouslySetInnerHTML={{
                            __html: p.replace(
                              /(\+?\d+(\.\d+)?%?)/g,
                              `<span style="color:${M.built};font-weight:700">$1</span>`
                            )
                          }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                      No summary available.
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  {isPred ? 'From model predictions · v4 dataset' : 'From satellite observations · v4 dataset'}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}