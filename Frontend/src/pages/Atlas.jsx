import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../services/api'
import { useCompare } from '../hooks/useCompare'
import { useGeoJSON, AREA_BOUNDARIES, COMPARE_COLORS } from '../hooks/useGeoJSON'
import AreaBoundary from '../components/map/AreaBoundary'
import FitBounds from '../components/map/FitBounds'
import { Search, X, GitCompare, Layers, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const YEARS      = [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2035,2040]
const colors     = { high: '#C0392B', medium: '#D4570C', low: '#1A6B45' }
const classLabel = { high: 'High Growth', medium: 'Moderate Growth', low: 'Stable' }
const classBg    = { high: '#fdf1f0', medium: '#fdf4ee', low: '#f0f7f3' }

/* ── fly to center point (fallback when no GeoJSON bounds available) ── */
function FlyTo({ area }) {
  const map = useMap()
  useEffect(() => {
    if (area?.center_lat) map.flyTo([area.center_lat, area.center_lon], 15, { duration: 1.2 })
  }, [area?.grid_id])
  return null
}

/* ── metric row in right panel ── */
function MetricRow({ emoji, label, value, unit = '%', color, plain }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
          {emoji} {label}
        </span>
        <span style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'IBM Plex Mono' }}>
          {value != null ? `${typeof value === 'number' ? value.toFixed(1) : value}${unit}` : '—'}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--canvas)', borderRadius: 99 }}>
        <div style={{
          height: '100%',
          width: `${Math.min(Math.abs(parseFloat(value) || 0), 100)}%`,
          background: color, borderRadius: 99, transition: 'width 0.5s ease'
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{plain}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   INNER MAP — all Leaflet hooks live here
══════════════════════════════════════════════════════ */
function MapContent({
  filteredAreas,
  selected,
  setSelected,
  compareAreas,
  compareMode,
  activeBoundary,
  activeBounds,
  compareBoundaries,
  loadingBoundary,
  noBoundaryArea,
}) {
  const selClass = selected?.growth_class?.toLowerCase()
  const selColor = colors[selClass] ?? '#888'

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {/* Fit to GeoJSON bounds (if available), else fly to centroid */}
      {activeBounds
        ? <FitBounds bounds={activeBounds} />
        : <FlyTo area={selected} />
      }

      {/* SINGLE SELECTED boundary */}
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

      {/* COMPARE MODE — multiple boundaries */}
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

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function Atlas() {
  const [year, setYear]         = useState(2024)
  const [areas, setAreas]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [overview, setOverview] = useState(null)
  const [compareMode, setCompareMode] = useState(false)

  // Boundary state
  const [activeBoundary, setActiveBoundary]   = useState(null)
  const [activeBounds, setActiveBounds]       = useState(null)
  const [compareBoundaries, setCompareBoundaries] = useState([])
  const [noBoundaryArea, setNoBoundaryArea]   = useState(null)
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

  // ── Load boundary on area select ──
  useEffect(() => {
    if (!selected || compareMode) {
      setActiveBoundary(null)
      setActiveBounds(null)
      return
    }

    setActiveBoundary(null)
    setActiveBounds(null)

    getBoundary(selected.area_name).then(result => {
      if (result) {
        setActiveBoundary(result)
        setActiveBounds(result.bounds)
      } else {
        // No boundary found — show brief notice, then fallback to centroid fly
        clearTimeout(noBoundaryTimer.current)
        setNoBoundaryArea(selected.area_name)
        noBoundaryTimer.current = setTimeout(() => setNoBoundaryArea(null), 3500)
      }
    })
  }, [selected?.area_name, compareMode])

  // ── Load compare boundaries ──
  useEffect(() => {
    if (!compareMode || !compareAreas.length) {
      setCompareBoundaries([])
      setActiveBounds(null)
      return
    }

    getMultipleBoundaries(compareAreas.map(a => a.area_name)).then(results => {
      const withIndex = results.map((r, i) => ({
        ...r,
        growthClass: compareAreas.find(a => a.area_name === r.areaName)?.growth_class?.toLowerCase(),
        compareIndex: i,
      }))
      setCompareBoundaries(withIndex)

      // Combined bounds
      if (withIndex.length > 0) {
        const allBounds = withIndex.map(r => r.boundary.bounds).filter(Boolean)
        if (allBounds.length) {
          const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0])
          setActiveBounds(combined)
        }
      }
    })
  }, [compareMode, compareAreas.map(a => a.area_name).join(',')])

  // ── Overview load ──
  useEffect(() => {
    if (!selected?.area_name) { setOverview(null); return }
    fetch(`http://127.0.0.1:8000/area-overview?area_name=${encodeURIComponent(selected.area_name)}&year=${year}`)
      .then(r => r.json())
      .then(data => {
        console.log('Overview:', data)
        setOverview(data)
      })
      .catch(err => {
        console.error('Overview error:', err)
        setOverview(null)
      })
  }, [year, selected?.area_name])

  const handleSelectArea = useCallback((area) => {
    setSelected(area)
  }, [])

  // ── Derived ──
  const filtered = areas.filter(a => {
    const matchClass  = filter === 'all' || a.growth_class?.toLowerCase() === filter
    const matchSearch = !search || a.area_name?.toLowerCase().includes(search.toLowerCase())
    return matchClass && matchSearch
  })

  const deduped = (() => {
    const m = {}
    filtered.forEach(a => {
      const k = a.area_name?.trim().toLowerCase()
      if (!k) return
      if (!m[k]) m[k] = { ...a, grid_ids: [a.grid_id] }
      else m[k].grid_ids.push(a.grid_id)
    })
    return Object.values(m)
  })()

  const isPred    = year > 2024
  const highCount = deduped.filter(a => a.growth_class?.toLowerCase() === 'high').length
  const medCount  = deduped.filter(a => a.growth_class?.toLowerCase() === 'medium').length
  const lowCount  = deduped.filter(a => a.growth_class?.toLowerCase() === 'low').length

  const selClass = selected?.growth_class?.toLowerCase()
  const selColor = colors[selClass] ?? '#888'
  const selBg    = classBg[selClass] ?? 'var(--paper)'

  const currentAreaData = selected
    ? deduped.find(a => a.area_name?.trim().toLowerCase() === selected.area_name?.trim().toLowerCase())
    : null

  const builtVal  = currentAreaData?.built_percent   != null ? currentAreaData.built_percent * 100  : null
  const ndviVal   = currentAreaData?.ndvi_mean       != null ? currentAreaData.ndvi_mean * 100       : null
  const nightVal  = currentAreaData?.nighttime_mean  != null ? currentAreaData.nighttime_mean        : null
  const confVal   = selected?.confidence             != null ? selected.confidence * 100             : null

  const hasBoundary = selected ? !!AREA_BOUNDARIES[selected.area_name] : false

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
            Viewing {isPred ? 'predicted' : 'historical'} data for {year}
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Compare mode toggle */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase' }}>Year</span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
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

        {/* LEFT: Area list */}
        <div style={{ width: 270, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {loading
              ? [1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ margin: '5px 10px', height: 50, borderRadius: 8, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
                ))
              : deduped.map(area => {
                  const t     = area.growth_class?.toLowerCase()
                  const col   = colors[t] || '#888'
                  const isSel = selected?.area_name === area.area_name
                  const inCmp = compareAreas.some(c => c.grid_id === area.grid_id)
                  const hasGeo = !!AREA_BOUNDARIES[area.area_name]

                  return (
                    <div
                      key={area.grid_id}
                      onClick={() => handleSelectArea(area)}
                      style={{
                        margin: '2px 8px', padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                        background: isSel ? (classBg[t] ?? 'var(--paper)') : 'transparent',
                        border: '1px solid ' + (isSel ? col + '55' : 'transparent'),
                        display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--cream)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: `0 0 0 2px ${col}33` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {area.area_name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 1, fontFamily: 'IBM Plex Mono', display: 'flex', gap: 5, alignItems: 'center' }}>
                          {area.built_percent != null ? `${(area.built_percent * 100).toFixed(0)}% built` : ''}
                          {area.confidence    != null ? ` · ${(area.confidence * 100).toFixed(0)}% conf` : ''}
                          {hasGeo && (
                            <span title="GeoJSON boundary available" style={{ color: 'var(--green)', fontSize: 9, opacity: 0.7 }}>⬡</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className={`badge badge-${t}`} style={{ fontSize: 9 }}>{t?.charAt(0)?.toUpperCase()}</span>
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

        {/* CENTER: Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,247,242,0.85)' }}>
              <div className="serif" style={{ fontSize: 18, color: 'var(--ink-muted)' }}>Loading {year}…</div>
            </div>
          )}

          {/* Boundary loading indicator */}
          {loadingBoundary && (
            <div className="boundary-loading" style={{ position: 'absolute', top: 12, right: 12, zIndex: 500 }}>
              <div className="boundary-loading__dot" />
              <span>Loading boundary…</span>
            </div>
          )}

          {/* No boundary fallback notice */}
          {noBoundaryArea && (
            <div key={noBoundaryArea} className="no-boundary-notice">
              No GeoJSON for {noBoundaryArea} — showing marker
            </div>
          )}

          {/* Compare mode legend */}
          {compareMode && compareBoundaries.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 20, left: 12, zIndex: 500,
              background: 'rgba(26,22,20,0.85)', backdropFilter: 'blur(8px)',
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

          <MapContainer
            center={[23.2156, 72.6369]}
            zoom={12}
            zoomControl={true}
            style={{ width: '100%', height: '100%' }}
          >
            <MapContent
              filteredAreas={deduped}
              selected={selected}
              setSelected={handleSelectArea}
              compareAreas={compareAreas}
              compareMode={compareMode}
              activeBoundary={activeBoundary}
              activeBounds={activeBounds}
              compareBoundaries={compareBoundaries}
              loadingBoundary={loadingBoundary}
              noBoundaryArea={noBoundaryArea}
            />
          </MapContainer>
        </div>

        {/* RIGHT: Insights panel */}
        <div style={{ width: 270, flexShrink: 0, background: '#fff', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
          {!selected ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>📍</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                Select an area from the list on the left to see details here.
              </div>
            </div>
          ) : (
            <div style={{ padding: '22px 18px' }}>

              {/* Header */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
                  Selected Area
                </div>
                <h2 className="serif" style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1 }}>
                  {selected.area_name}
                </h2>
              </div>

              {/* Area Overview */}
              <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 20, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 12 }}>
                  About This Area
                </div>
                {!overview ? (
                  <div style={{ color: 'var(--ink-muted)', fontSize: 12 }}>Loading...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {overview.points?.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '8px 10px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.55)',
                          borderLeft: '3px solid var(--orange)',
                          fontSize: 12, lineHeight: 1.7, color: 'var(--ink)',
                        }}
                      >
                        <span style={{ color: 'var(--orange)', fontWeight: 700, marginTop: 1 }}>•</span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: p.replace(
                              /(\+?\d+(\.\d+)?%?|\(\d+(\.\d+)?\))/g,
                              '<span style="color: var(--orange); font-weight: 700;">$1</span>'
                            )
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  AI-generated area summary.
                </div>
              </div>

              {/* Key Facts — only for historical years */}
              {year <= 2024 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 14 }}>
                    Key Facts About This Area
                  </div>
                  <MetricRow emoji="🏗️" label="Development Level" value={builtVal} color="var(--red)"
                    plain={builtVal != null ? `${builtVal.toFixed(0)}% of the area is covered by buildings and roads.` : 'No data available.'} />
                  <MetricRow emoji="🌳" label="Green Space" value={ndviVal} color="var(--green)"
                    plain={ndviVal != null ? `${ndviVal.toFixed(0)}% of the area contains vegetation and greenery.` : 'No data available.'} />
                  <MetricRow emoji="🌃" label="Night Activity" value={nightVal} unit="" color="var(--blue)"
                    plain={nightVal != null ? `Night Activity Index: ${nightVal.toFixed(0)}` : 'No data available.'} />
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  )
}