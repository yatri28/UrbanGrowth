import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'

// ── Shared tooltip style ───────────────────────────────────────────────────
const TT = {
  contentStyle: {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontFamily: 'IBM Plex Sans',
    fontSize: 12,
    color: 'var(--ink)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  cursor: { fill: 'rgba(26,22,20,0.03)' },
}

// ── Area data baked from CSVs ───────────────────────────────────────────────
const CORRIDOR_AREAS = [
  {
    name: 'Sector 30',
    built16: 10.9, built24: 15.5, growth: 4.6,
    predClass: 'high', conf: 0.901,
    relation: 'Directly fronts the Sabarmati riverbank',
    note: 'Emerging residential edge — low baseline, high growth signal',
  },
  {
    name: 'Kudasan',
    built16: 38.9, built24: 52.0, growth: 13.1,
    predClass: 'high', conf: 0.948,
    relation: 'Residential township immediately east of GIFT City',
    note: 'Development hotspot — fastest absolute built-up growth in the zone',
  },
  {
    name: 'Randesan',
    built16: 19.6, built24: 30.4, growth: 10.8,
    predClass: 'high', conf: 0.848,
    relation: 'Connecting node between Infocity and Kudasan',
    note: 'Infill urbanisation accelerating along the corridor spine',
  },
  {
    name: 'Infocity',
    built16: 38.5, built24: 52.6, growth: 14.2,
    predClass: 'medium', conf: 0.845,
    relation: 'IT and commercial hub anchoring the northern corridor',
    note: 'Highest absolute built-up expansion — nearing saturation of greenfield land',
  },
  {
    name: 'GIFT City',
    built16: 22.3, built24: 31.6, growth: 9.3,
    predClass: 'medium', conf: 0.924,
    relation: 'India\'s first IFSC — planned smart city on the Sabarmati bend',
    note: 'Planned phased growth — moderate classification reflects master-planned density caps',
  },
  {
    name: 'Sector 28',
    built16: 8.3, built24: 11.3, growth: 3.0,
    predClass: 'high', conf: 0.863,
    relation: 'Southernmost edge of the influence zone, adjacent to riverfront promenade',
    note: 'Lowest baseline in the zone — high classification signals early-stage acceleration',
  },
]

const COL_MAP = {
  high:   { color: 'var(--red)',    soft: 'var(--red-soft)',    label: 'High Growth' },
  medium: { color: 'var(--orange)', soft: 'var(--orange-soft)', label: 'Medium Growth' },
  low:    { color: 'var(--green)',  soft: 'var(--green-soft)',  label: 'Low Growth' },
}

const INDICATORS = ['Built-up Cover', 'NDVI', 'Nighttime Lights', 'Road Network Metrics']

// ── Area positions for the schematic map (proportional, not geographic) ─────
// Sabarmati runs roughly left-to-right. Areas arranged north→south, west→east.
const MAP_AREAS = [
  { name: 'Sector 28',  x: 18,  y: 72, predClass: 'high',   conf: 0.863 },
  { name: 'Sector 30',  x: 30,  y: 52, predClass: 'high',   conf: 0.901 },
  { name: 'GIFT City',  x: 48,  y: 35, predClass: 'medium', conf: 0.924 },
  { name: 'Kudasan',    x: 63,  y: 28, predClass: 'high',   conf: 0.948 },
  { name: 'Randesan',   x: 72,  y: 48, predClass: 'high',   conf: 0.848 },
  { name: 'Infocity',   x: 82,  y: 30, predClass: 'medium', conf: 0.845 },
]

// ── Timeline events ─────────────────────────────────────────────────────────
const TIMELINE = [
  {
    year: '2012',
    label: 'Project Announcement',
    desc: 'Gujarat government announces the Gandhinagar Riverfront Development Project along the Sabarmati, modelled in part on the Ahmedabad riverfront experience.',
    type: 'project',
  },
  {
    year: '2016',
    label: 'UrbanGrowth Baseline',
    desc: 'UrbanGrowth begins recording satellite observations across the influence zone. Baseline built-up cover ranges from 8.3% (Sector 28) to 38.9% (Kudasan).',
    type: 'data',
  },
  {
    year: '2017–2020',
    label: 'GIFT City Phase I',
    desc: 'GIFT City\'s first operational towers come online. Kudasan and Randesan begin recording accelerated residential construction as worker housing demand grows.',
    type: 'project',
  },
  {
    year: '2021–2023',
    label: 'Corridor-Wide Acceleration',
    desc: 'Satellite data shows all six corridor areas recording their steepest year-on-year built-up growth. Infocity crosses 50% built-up cover for the first time.',
    type: 'data',
  },
  {
    year: '2024',
    label: 'UrbanGrowth End of Historical Window',
    desc: 'Final historical observation year. Corridor average reaches +9.2 pp above 2016 baseline. No area in the zone shows stagnation or decline.',
    type: 'data',
  },
  {
    year: '2025–2040',
    label: 'UrbanGrowth Projection Period',
    desc: 'XGBoost classifier assigns High or Medium Growth to all six areas. Four of six carry High Growth designations with average confidence of 88.8%.',
    type: 'forecast',
  },
]

// ── Reusable components ──────────────────────────────────────────────────────

function KPI({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', marginBottom: 8 }}>
        {label}
      </div>
      <div className="serif" style={{ fontSize: 32, fontWeight: 900, color: color || 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 6 }}>{sub}</div>}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: color || 'var(--ink)' }} />
    </div>
  )
}

function SectionHeader({ tag, title, desc }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {tag && <div className="research-tag" style={{ marginBottom: 8 }}>{tag}</div>}
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{title}</h2>
      {desc && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, maxWidth: 640 }}>{desc}</p>}
    </div>
  )
}

function ClassBadge({ cls }) {
  const c = COL_MAP[cls] || COL_MAP.low
  return (
    <span className={`badge badge-${cls}`} style={{ fontSize: 9 }}>
      {c.label}
    </span>
  )
}

// ── Disclaimer banner ────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 18px',
      background: 'var(--blue-soft)',
      border: '1px solid rgba(26,75,140,0.18)',
      borderRadius: 10,
      marginBottom: 48,
    }}>
      <div style={{
        flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
        background: 'var(--blue)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, marginTop: 1,
      }}>i</div>
      <div style={{ fontSize: 12, color: 'var(--blue)', lineHeight: 1.7 }}>
        <strong>Scope Notice:</strong> UrbanGrowth analyses surrounding urban growth patterns using satellite-derived indicators — built-up cover, NDVI, nighttime lights, and road network metrics.
        This case study does not measure or track actual riverfront construction progress, promenade completion, or civil engineering works.
        All observations and classifications reflect the broader urban environment within and around the Riverfront Influence Zone.
      </div>
    </div>
  )
}

// ── Schematic influence zone map (SVG, no external dependency) ───────────────
function InfluenceZoneMap() {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
          Riverfront Influence Zone
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          Schematic layout showing the six study areas relative to the Sabarmati River and the proposed riverfront corridor.
          Areas are selected for their direct spatial relationship to the corridor — either fronting the river, flanking GIFT City, or forming the development spine.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: 'auto', maxHeight: 380, display: 'block' }}>
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="var(--cream)" rx="8" />

          {/* Sabarmati River — curved path running diagonally */}
          <path
            d="M 0,90 C 15,85 25,75 35,68 C 45,61 55,55 65,48 C 75,41 85,36 100,32"
            fill="none" stroke="rgba(26,75,140,0.25)" strokeWidth="6" strokeLinecap="round"
          />
          <path
            d="M 0,90 C 15,85 25,75 35,68 C 45,61 55,55 65,48 C 75,41 85,36 100,32"
            fill="none" stroke="rgba(26,75,140,0.12)" strokeWidth="10" strokeLinecap="round"
          />
          {/* River label */}
          <text x="8" y="82" fontSize="3.2" fill="var(--blue)" fontFamily="IBM Plex Mono" opacity="0.7">
            Sabarmati River
          </text>

          {/* Proposed riverfront corridor strip */}
          <path
            d="M 0,86 C 15,81 25,71 35,64 C 45,57 55,51 65,44 C 75,37 85,32 100,28"
            fill="none" stroke="var(--orange)" strokeWidth="1.2" strokeDasharray="2,1.5" opacity="0.6"
          />
          <text x="38" y="56" fontSize="2.8" fill="var(--orange)" fontFamily="IBM Plex Mono" opacity="0.8"
            transform="rotate(-18, 38, 56)">
            Proposed Riverfront Corridor
          </text>

          {/* Connection lines between areas (influence network) */}
          {[
            [MAP_AREAS[0], MAP_AREAS[1]],
            [MAP_AREAS[1], MAP_AREAS[2]],
            [MAP_AREAS[2], MAP_AREAS[3]],
            [MAP_AREAS[3], MAP_AREAS[4]],
            [MAP_AREAS[4], MAP_AREAS[5]],
          ].map(([a, b], i) => (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--border-med)" strokeWidth="0.6" strokeDasharray="1.5,1"
            />
          ))}

          {/* Area dots */}
          {MAP_AREAS.map((area) => {
            const c = COL_MAP[area.predClass]
            const isHov = hovered === area.name
            return (
              <g key={area.name}
                onMouseEnter={() => setHovered(area.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Halo */}
                <circle cx={area.x} cy={area.y} r={isHov ? 7 : 5.5}
                  fill={c.color} opacity={isHov ? 0.15 : 0.08}
                  style={{ transition: 'all 0.2s' }}
                />
                {/* Dot */}
                <circle cx={area.x} cy={area.y} r={isHov ? 4 : 3}
                  fill={c.color} opacity={isHov ? 1 : 0.85}
                  style={{ transition: 'all 0.2s' }}
                />
                {/* Label */}
                <text
                  x={area.x} y={area.y - 6}
                  fontSize={isHov ? 3.8 : 3.2}
                  fill="var(--ink)"
                  fontFamily="IBM Plex Sans"
                  fontWeight={isHov ? '700' : '500'}
                  textAnchor="middle"
                  style={{ transition: 'all 0.2s' }}
                >
                  {area.name}
                </text>
                {/* Confidence on hover */}
                {isHov && (
                  <text x={area.x} y={area.y + 9} fontSize="2.8"
                    fill={c.color} fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="600">
                    {(area.conf * 100).toFixed(0)}% conf.
                  </text>
                )}
              </g>
            )
          })}

          {/* Compass rose */}
          <g transform="translate(93,8)">
            <text x="0" y="3" fontSize="3" fill="var(--ink-muted)" fontFamily="IBM Plex Mono" textAnchor="middle">N</text>
            <line x1="0" y1="4" x2="0" y2="8" stroke="var(--ink-faint)" strokeWidth="0.5" />
          </g>
        </svg>

        {/* Hover tooltip */}
        {hovered && (() => {
          const area = MAP_AREAS.find(a => a.name === hovered)
          const full = CORRIDOR_AREAS.find(a => a.name === hovered)
          const c = COL_MAP[area.predClass]
          return (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              minWidth: 200, maxWidth: 240,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{hovered}</div>
              <div style={{ marginBottom: 8 }}><ClassBadge cls={area.predClass} /></div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                {full?.relation}
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--ink-muted)' }}>Built-up growth</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, color: c.color }}>
                  +{full?.growth.toFixed(1)} pp
                </span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap', fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 3, background: 'rgba(26,75,140,0.35)', borderRadius: 2 }} />
          <span style={{ color: 'var(--ink-muted)' }}>Sabarmati River</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 0, border: '1px dashed var(--orange)', opacity: 0.7 }} />
          <span style={{ color: 'var(--ink-muted)' }}>Proposed Corridor</span>
        </div>
        {Object.entries(COL_MAP).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
            <span style={{ color: 'var(--ink-muted)' }}>{v.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'IBM Plex Mono' }}>
        Schematic layout — not to scale. Hover over any area for details.
      </div>
    </div>
  )
}

// ── Visual timeline ──────────────────────────────────────────────────────────
function ProjectTimeline() {
  const typeStyle = {
    project:  { color: 'var(--orange)', dot: 'var(--orange)', label: 'Project Event' },
    data:     { color: 'var(--blue)',   dot: 'var(--blue)',   label: 'UrbanGrowth Data' },
    forecast: { color: 'var(--red)',    dot: 'var(--red)',    label: 'Forecast Period' },
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(typeStyle).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot }} />
              <span style={{ color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Spine line */}
        <div style={{
          position: 'absolute', left: 54, top: 8, bottom: 8,
          width: 2, background: 'var(--canvas)', borderRadius: 2,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {TIMELINE.map((event, i) => {
            const ts = typeStyle[event.type]
            const isLast = i === TIMELINE.length - 1
            return (
              <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                {/* Year label */}
                <div style={{
                  width: 48, flexShrink: 0,
                  fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 600,
                  color: ts.color, paddingTop: 12, textAlign: 'right', lineHeight: 1.2,
                }}>
                  {event.year}
                </div>

                {/* Dot */}
                <div style={{ width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: ts.dot, border: '2px solid #fff',
                    boxShadow: `0 0 0 2px ${ts.dot}40`,
                    zIndex: 1, flexShrink: 0,
                  }} />
                </div>

                {/* Content */}
                <div style={{
                  flex: 1, paddingLeft: 16, paddingBottom: isLast ? 0 : 24, paddingTop: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                    {event.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                    {event.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Insight card (stronger visual than Finding pill) ─────────────────────────
function InsightCard({ icon, title, metric, body, color }) {
  return (
    <div style={{
      padding: '20px 22px',
      borderRadius: 12,
      background: '#fff',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 18 }}>{icon}</div>
        {metric && (
          <div className="serif" style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>
            {metric}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7 }}>{body}</div>
    </div>
  )
}

// ── Sortable table ───────────────────────────────────────────────────────────
const SORT_KEYS = {
  name:      (a, b) => a.name.localeCompare(b.name),
  built16:   (a, b) => b.built16 - a.built16,
  built24:   (a, b) => b.built24 - a.built24,
  growth:    (a, b) => b.growth - a.growth,
  predClass: (a, b) => a.predClass.localeCompare(b.predClass),
  conf:      (a, b) => b.conf - a.conf,
}

function AreaTable({ areas }) {
  const [sortKey, setSortKey] = useState('growth')
  const [dir, setDir] = useState(1)

  function handleSort(key) {
    if (key === sortKey) setDir(d => d * -1)
    else { setSortKey(key); setDir(1) }
  }

  const sorted = [...areas].sort((a, b) => (SORT_KEYS[sortKey]?.(a, b) ?? 0) * dir)

  const Th = ({ label, k }) => (
    <th onClick={() => handleSort(k)} style={{
      padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)',
      fontFamily: 'IBM Plex Mono', cursor: 'pointer', whiteSpace: 'nowrap',
      background: 'var(--paper)', userSelect: 'none',
      borderBottom: '1px solid var(--border)',
    }}>
      {label} {sortKey === k ? (dir === 1 ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th label="Area"            k="name" />
            <Th label="Spatial Role"    k="name" />
            <Th label="Built-up 2016"   k="built16" />
            <Th label="Built-up 2024"   k="built24" />
            <Th label="Growth Change"   k="growth" />
            <Th label="Growth Class"    k="predClass" />
            <Th label="Confidence"      k="conf" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((area, i) => (
            <tr key={area.name} style={{ background: i % 2 === 0 ? '#fff' : 'var(--cream)' }}>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--ink)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                {area.name}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--ink-muted)', borderBottom: '1px solid var(--border)', lineHeight: 1.5, maxWidth: 200 }}>
                {area.relation}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)', borderBottom: '1px solid var(--border)' }}>
                {area.built16.toFixed(1)}%
              </td>
              <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)', borderBottom: '1px solid var(--border)' }}>
                {area.built24.toFixed(1)}%
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="bar-track" style={{ width: 60 }}>
                    <div className="bar-fill" style={{
                      width: `${Math.min(100, (area.growth / 15) * 100)}%`,
                      background: COL_MAP[area.predClass]?.color || 'var(--ink)',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)' }}>
                    +{area.growth.toFixed(1)} pp
                  </span>
                </div>
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <ClassBadge cls={area.predClass} />
              </td>
              <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="bar-track" style={{ width: 50 }}>
                    <div className="bar-fill" style={{
                      width: `${area.conf * 100}%`,
                      background: 'var(--blue)',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)' }}>
                    {(area.conf * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Classification card ──────────────────────────────────────────────────────
function ClassCard({ area }) {
  const c = COL_MAP[area.predClass] || COL_MAP.low
  return (
    <div className="card" style={{
      padding: '20px 22px',
      borderTop: `3px solid ${c.color}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{area.name}</div>
      <ClassBadge cls={area.predClass} />
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
        {area.relation}
      </div>
      <div>
        <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 4 }}>
          Model Confidence
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="bar-track" style={{ flex: 1 }}>
            <div className="bar-fill" style={{ width: `${area.conf * 100}%`, background: c.color }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: 'var(--ink-soft)', minWidth: 34, textAlign: 'right' }}>
            {(area.conf * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
        {area.note}
      </div>
    </div>
  )
}

// ── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ ...TT.contentStyle, padding: '10px 14px' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: 11, color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontFamily: 'IBM Plex Mono' }}>
            {p.value.toFixed(1)}{p.dataKey === 'growth' ? ' pp' : '%'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Riverfront() {
  const avgGrowth     = (CORRIDOR_AREAS.reduce((s, a) => s + a.growth, 0) / CORRIDOR_AREAS.length).toFixed(1)
  const avgConf       = (CORRIDOR_AREAS.reduce((s, a) => s + a.conf, 0)  / CORRIDOR_AREAS.length * 100).toFixed(1)
  const highCount     = CORRIDOR_AREAS.filter(a => a.predClass === 'high').length
  const dominantClass = highCount >= CORRIDOR_AREAS.length / 2 ? 'High' : 'Medium'

  const chartData = [...CORRIDOR_AREAS]
    .sort((a, b) => b.growth - a.growth)
    .map(a => ({
      name: a.name,
      '2016': +a.built16.toFixed(1),
      '2024': +a.built24.toFixed(1),
      growth: +a.growth.toFixed(1),
      cls: a.predClass,
    }))

  const byGrowth = [...CORRIDOR_AREAS].sort((a, b) => b.growth - a.growth)
  const byConf   = [...CORRIDOR_AREAS].sort((a, b) => b.conf - a.conf)
  const highAreas = CORRIDOR_AREAS.filter(a => a.predClass === 'high')
  const emerging  = [...CORRIDOR_AREAS].sort((a, b) => a.built24 - b.built24)

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200 }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div className="research-tag" style={{ marginBottom: 10 }}>
          Case Study · Gandhinagar Riverfront · Urban Growth Analysis
        </div>
        <h1 className="serif" style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)' }}>
          Riverfront Corridor<br />Analysis
        </h1>
        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 600, lineHeight: 1.8 }}>
          Demonstrating how UrbanGrowth's satellite-derived metrics and XGBoost growth classifications
          can be applied to understand urban transformation in and around the Gandhinagar Riverfront Development corridor — one of Gujarat's most significant urban infrastructure investments.
        </p>
        {/* Meta strip */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Study Period',       value: '2016–2024' },
            { label: 'Projection Horizon', value: '2025–2040' },
            ...INDICATORS.map(ind => ({ label: 'Indicator', value: ind })),
          ].map((item, i) => (
            <div key={i} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--border)', fontSize: 11 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: 2 }}>
                {item.label}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DISCLAIMER ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <Disclaimer />
      </div>

      {/* ── SECTION 1: What is the project? ──────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Project Background · Public Record"
          title="What is the Gandhinagar Riverfront Project?"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
          <div className="card-paper" style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.9, marginBottom: 14 }}>
              The Gandhinagar Riverfront Development Project is a large-scale urban infrastructure initiative
              undertaken by the Gujarat government to transform the eastern bank of the Sabarmati River
              along Gandhinagar's southern and central sectors. Inspired in part by the Sabarmati Riverfront
              Development in Ahmedabad, the project aims to reclaim and beautify the riverbank, construct
              a continuous promenade, improve flood management infrastructure, and catalyse surrounding
              economic development.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.9, marginBottom: 14 }}>
              The corridor intersects directly with GIFT City — India's first operational International
              Financial Services Centre (IFSC) — which occupies a strategic bend in the Sabarmati between
              Gandhinagar and Ahmedabad. GIFT City's phased development, which began in the mid-2010s, has
              had a measurable ripple effect on surrounding residential and commercial areas including
              Kudasan, Randesan, and Infocity.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.9 }}>
              Sectors 28 and 30 occupy the riverfront edge itself and represent the most directly
              affected residential sectors — areas where urban land transformation is expected to
              respond most visibly to riverfront investment over time.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Corridor Type',    value: 'Riverbank Urban Renewal' },
              { label: 'Primary River',    value: 'Sabarmati' },
              { label: 'Key Anchor',       value: 'GIFT City (IFSC)' },
              { label: 'Residential Edge', value: 'Sectors 28 & 30' },
              { label: 'Commercial Spine', value: 'Infocity · Kudasan' },
              { label: 'Study Areas',      value: '6 grid zones' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '12px 16px', borderRadius: 8,
                background: '#fff', border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', letterSpacing: '0.04em' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Influence Zone Map ────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Spatial Context · Why These Six Areas?"
          title="The Riverfront Influence Zone"
          desc="These six areas were selected because they form the immediate spatial hinterland of the Gandhinagar Riverfront corridor — either directly fronting the Sabarmati, anchoring key economic nodes, or forming the development spine connecting them. Hover over each area for its relationship to the corridor."
        />
        <InfluenceZoneMap />
      </div>

      {/* ── SECTION 3: Project Timeline ──────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Context Timeline · Project & Data Events"
          title="From Project Announcement to Growth Classification"
          desc="A chronological view of key project milestones alongside UrbanGrowth's observation and classification windows — showing how the data relates to the real-world development arc."
        />
        <ProjectTimeline />
      </div>

      {/* ── SECTION 4: Corridor-wide signal summary ──────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Zone Summary · Satellite-Derived Metrics"
          title="Urban Intensity Across the Influence Zone"
          desc="Aggregated metrics for the six areas forming the Riverfront Influence Zone, derived from historical satellite observations (2016–2024) and XGBoost growth projections (2025–2040)."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPI label="Areas in Zone"        value={CORRIDOR_AREAS.length}  sub="Comprising the Riverfront Zone"        color="var(--blue)" />
          <KPI label="Avg. Built-up Growth" value={`+${avgGrowth} pp`}     sub="Satellite-observed 2016–2024"          color="var(--orange)" />
          <KPI label="Dominant Class"       value={dominantClass}           sub={`${highCount} of 6 areas — High Growth`} color="var(--red)" />
          <KPI label="Avg. Confidence"      value={`${avgConf}%`}           sub="XGBoost classification confidence"     color="var(--green)" />
        </div>
      </div>

      {/* ── SECTION 5: Historical growth chart ───────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Historical Transformation · 2016–2024 Satellite Observations"
          title="How Urban Intensity Has Changed Along the Corridor"
          desc="Built-up cover in 2016 versus 2024 for each area. The fastest growth is concentrated in Infocity and Kudasan — the established economic anchors of the corridor. Sector 28 and Sector 30 show the lowest values but carry High Growth classifications, suggesting acceleration is only beginning."
        />
        <div className="card" style={{ padding: 28 }}>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 10 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--canvas)" vertical={false} />
              <XAxis dataKey="name"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                axisLine={false} tickLine={false} angle={-12} textAnchor="end" interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                axisLine={false} tickLine={false} tickFormatter={v => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="square" iconSize={8}
                wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono', paddingTop: 16 }}
              />
              <Bar dataKey="2016" name="Built-up 2016" radius={[4,4,0,0]}>
                {chartData.map((d, i) => <Cell key={i} fill="var(--canvas)" />)}
              </Bar>
              <Bar dataKey="2024" name="Built-up 2024" radius={[4,4,0,0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={COL_MAP[d.cls]?.color || 'var(--ink)'} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="growth" name="Growth Change (pp)" fill="var(--blue)" fillOpacity={0.25} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--paper)', borderRadius: 8, fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ink)' }}>Reading this chart:</strong> Built-up values are the percentage of each 500m grid cell covered by buildings and roads.
            Growth Change (pp) is the absolute increase. Bar colors reflect the dominant 2025–2040 growth class for each area.
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Area detail table ─────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Area Detail · Spatial Role + Metrics"
          title="Each Area's Role in the Corridor"
          desc="Sorted by growth by default. The Spatial Role column explains why each area was included in the influence zone. Click any column header to sort."
        />
        <AreaTable areas={CORRIDOR_AREAS} />
      </div>

      {/* ── SECTION 7: Growth classification cards ───────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Growth Classification · 2025–2040 XGBoost Projections"
          title="How UrbanGrowth Classifies Each Corridor Area"
          desc="Each card shows the dominant predicted growth class for 2025–2040, model confidence, and contextual notes explaining what the classification means within the riverfront corridor."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {CORRIDOR_AREAS.map(area => <ClassCard key={area.name} area={area} />)}
        </div>
      </div>

      {/* ── SECTION 8: Evidence-based insights ──────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          tag="Corridor Intelligence · Data-Derived Insights"
          title="What the Satellite Record Tells Us"
          desc="Four evidence-based observations from the historical data and XGBoost model outputs."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <InsightCard
            icon="🏗️"
            title="Development Hotspot"
            metric={`+${byGrowth[0].growth.toFixed(1)} pp`}
            color="var(--red)"
            body={`${byGrowth[0].name} recorded the highest built-up expansion in the zone — a +${byGrowth[0].growth.toFixed(1)} pp increase between 2016 and 2024. This is consistent with its role as the corridor's primary IT and commercial hub, where construction pressure has been sustained across the full observation window.`}
          />
          <InsightCard
            icon="📡"
            title="Highest Model Confidence"
            metric={`${(byConf[0].conf * 100).toFixed(0)}%`}
            color="var(--blue)"
            body={`${byConf[0].name} returned the strongest XGBoost classification confidence at ${(byConf[0].conf * 100).toFixed(1)}% — the clearest growth signal in the zone. ${byConf[1].name} follows at ${(byConf[1].conf * 100).toFixed(1)}%. Both areas exhibit strong, consistent multi-indicator patterns that the model reads as unambiguous.`}
          />
          <InsightCard
            icon="🌱"
            title="Emerging Riverfront Edge"
            metric={`${emerging[0].built24.toFixed(0)}%`}
            color="var(--green)"
            body={`${emerging[0].name} has the lowest current built-up cover in the zone at ${emerging[0].built24.toFixed(1)}%, yet carries a High Growth classification for 2025–2040. This combination — low baseline, strong forward signal — is characteristic of areas at the early stage of urbanisation acceleration, often driven by infrastructure catalysts nearby.`}
          />
          <InsightCard
            icon="🏙️"
            title="Planned City, Measured Growth"
            metric="GIFT City"
            color="var(--orange)"
            body={`Despite being the corridor's highest-profile development, GIFT City carries a Medium Growth classification — not because growth is slow, but because its master-planned layout and phased construction schedule produce more measured, capped density signals than organic urbanisation. Built-up cover grew +${CORRIDOR_AREAS.find(a=>a.name==='GIFT City').growth.toFixed(1)} pp between 2016 and 2024, consistent with planned phase delivery.`}
          />
        </div>
      </div>

      {/* ── SECTION 9: Conclusion ────────────────────────────────────────── */}
      <div>
        <SectionHeader
          tag="Corridor Outlook · Evidence-Based Summary"
          title="Riverfront Corridor Outlook"
        />
        <div className="card-paper" style={{ padding: '28px 32px', borderLeft: '4px solid var(--ink)', borderRadius: '0 12px 12px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <h3 className="serif" style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: 'var(--ink)' }}>
                What the Satellite Record Shows
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
                Between 2016 and 2024, all six corridor areas recorded positive built-up growth.
                The zone collectively averaged +{avgGrowth} pp expansion, with the strongest signals
                concentrated in Infocity and Kudasan — the established economic anchors. Sectors 28 and 30,
                which front the river directly, remain at low built-up baselines but are showing
                measurable early-stage acceleration.
              </p>
            </div>
            <div>
              <h3 className="serif" style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: 'var(--ink)' }}>
                What the Model Classifies
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
                UrbanGrowth's XGBoost model assigns High or Medium Growth to all six influence zone areas
                for 2025–2040. Four of six carry High Growth designations with average confidence exceeding
                88%. This suggests continued development pressure across the corridor — though the pace
                and character of growth will vary between planned nodes like GIFT City and organic growth
                areas like Kudasan and Randesan.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
              Data Sources & Scope
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
              Historical data: satellite-derived built-up cover, NDVI, and nighttime light observations for 2016–2024 ·
              Predictions: XGBoost classification model (90.67% accuracy) trained on multi-year Gandhinagar grid data ·
              All values represent spatial averages across 500m grid cells ·
              This analysis measures surrounding urban growth patterns only and does not track riverfront construction works.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
