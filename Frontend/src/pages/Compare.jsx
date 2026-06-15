import {
  ResponsiveContainer, LineChart, Line,
  BarChart, Bar, CartesianGrid,
  Tooltip, XAxis, YAxis, Legend, Cell,
  ReferenceLine,
} from 'recharts'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, GitCompare, Trash2 } from 'lucide-react'
import { useCompare } from '../hooks/useCompare'
import { fetchHistory } from '../services/historyApi'
import { fetchAiComparison } from "../services/compareApi"

/* ── Constants ─────────────────────────────────────── */
const COLORS      = ['#C0392B', '#1A4B8C', '#1A6B45', '#D4570C']
const CLASS_COLOR = { high: '#C0392B', medium: '#D4570C', low: '#1A6B45' }

const TT = {
  contentStyle: {
    background: '#fff', border: '1px solid rgba(26,22,20,0.10)',
    borderRadius: 8, fontFamily: 'IBM Plex Sans', fontSize: 12,
    color: '#1A1614', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  cursor: { stroke: 'rgba(26,22,20,0.08)' },
}
const axisStyle = {
  stroke: 'rgba(26,22,20,0.12)',
  tick: { fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#8A8178' },
}

function dupKey(area) {
  return `${area.area_name} (${area.grid_id})`
}

/* ── Page ──────────────────────────────────────────── */
export default function ComparePage() {
  const { compareAreas, toggleCompareArea } = useCompare()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{
        padding: '18px 32px', background: '#fff',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 20,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link to="/atlas" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--paper)',
            cursor: 'pointer', fontSize: 12, color: 'var(--ink-soft)',
            fontFamily: 'IBM Plex Sans',
          }}>
            <ArrowLeft size={13} /> Atlas
          </button>
        </Link>

        <div>
          <div className="research-tag">Area Comparison Dashboard</div>
          <h1 className="serif" style={{ fontSize: 20, fontWeight: 900, marginTop: 3, letterSpacing: '-0.01em' }}>
           Compare Different Areas of Gandhinagar
          </h1>
        </div>

        <div style={{ flex: 1 }} />

       
      </div>

      <div style={{ padding: '28px 32px' }}>

        {compareAreas.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <GitCompare size={36} style={{ color: 'var(--ink-faint)', margin: '0 auto 16px' }} />
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 800 }}>No Areas Selected</h2>
            <p style={{ color: 'var(--ink-muted)', marginTop: 8, fontSize: 13 }}>
              Go to the Atlas, click an area, then press "Add to Compare"
            </p>
            <Link to="/atlas">
              <button style={{
                marginTop: 20, padding: '10px 24px', borderRadius: 8,
                background: 'var(--ink)', color: 'var(--cream)',
                border: 'none', cursor: 'pointer', fontSize: 13,
                fontFamily: 'IBM Plex Sans', fontWeight: 500,
              }}>Open Atlas</button>
            </Link>
          </div>
        ) : (
           <>
            {/* Selected areas chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              {compareAreas.map((a, i) => (
                <div key={a.grid_id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', background: '#fff',
                  border: `1px solid ${COLORS[i]}44`,
                  borderRadius: 20, fontSize: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{a.area_name}</span>
                  
                  <button onClick={() => toggleCompareArea(a)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-faint)', padding: 0, display: 'flex', alignItems: 'center',
                  }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
    
            </div>

            <HistoricalCharts
  compareAreas={compareAreas}
/>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Historical charts ─────────────────────────────── */
function HistoricalCharts({ compareAreas}) {
  const [summary, setSummary] = useState("")
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  async function generateSummary() {

    if (compareAreas.length < 2) return
    if (!rows.length) return

    try {
      setLoadingSummary(true)

      const areas = rows.map((areaData, index) => {

        const latest =
          areaData.history?.[
            areaData.history.length - 1
          ]

        if (!latest) return null

        return {
          name: compareAreas[index]?.area_name,
          built: Number((latest.built_percent * 100).toFixed(1)),
          ndvi: Number((latest.ndvi_mean * 100).toFixed(1)),
          night: Number((latest.nighttime_norm * 100).toFixed(1)),
        }
      }).filter(Boolean)

      const result = await fetchAiComparison({
        areas
      })

      setSummary(result.summary || '')

    } catch (err) {
      console.error(err)
      setSummary('Unable to generate AI comparison.')
    } finally {
      setLoadingSummary(false)
    }
  }

  generateSummary()
}, [rows, compareAreas])

  function Loader({ text }) {
  return (
    <div className="card" style={{ padding: 60, textAlign: 'center' }}>
      <div
        className="serif"
        style={{
          fontSize: 18,
          color: 'var(--ink-muted)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const results = await Promise.all(compareAreas.map(a => fetchHistory(a.grid_id)))
        setRows(results)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [compareAreas])

  if (loading) return <Loader text="Loading satellite data…" />

  function pivot(field) {
    const map = {}
    rows.forEach(areaData => {
      const area = compareAreas.find(a => a.grid_id === areaData.grid_id)
      if (!area) return
      const key = dupKey(area)
      areaData.history?.forEach(item => {
        if (!map[item.year]) map[item.year] = { year: item.year }
        map[item.year][key] = item[field]
      })
    })
    return Object.values(map).sort((a, b) => a.year - b.year)
  }

  const ndviData  = pivot('ndvi_mean')
  const builtData = pivot('built_percent')
  const nightData = pivot('nighttime_mean')
  const keys      = compareAreas.map(dupKey)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      <ChartCard title="NDVI Vegetation Index" sub=" How Green Is Each Area? Real satellite vegetation (0–1, higher = greener) ">
        <LineChart data={ndviData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="year" {...axisStyle}  label={{
    value: "Year",
    position: "insideBottom",
    offset: -5
  }} />
          <YAxis domain={['auto', 'auto']} {...axisStyle} tickFormatter={v => v.toFixed(2)} label={{
    value: "Green Space",
    angle: -90,
    position: "insideLeft"
  }} />
          <Tooltip {...TT} formatter={v => v?.toFixed(3)} />
          <Legend wrapperStyle={{ color: 'var(--ink-muted)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
          {keys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} name={compareAreas[i].area_name}
              stroke={COLORS[i]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[i] }} />
          ))}
        </LineChart>
      </ChartCard>

      <ChartCard title="Built-up Area %" sub=" How Much Construction Has Happened? Real satellite built-up coverage">
        <LineChart data={builtData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="year" {...axisStyle}   label={{
    value: "Year",
    position: "insideBottom",
    offset: -5
  }}/>
          <YAxis domain={['auto', 'auto']} {...axisStyle} tickFormatter={v => `${(v*100).toFixed(0)}%`}    label={{
    value: "Construction",
    angle: -90,
    position: "insideLeft"
  }}/>
          <Tooltip {...TT} formatter={v => `${(v*100).toFixed(1)}%`} />
          <Legend wrapperStyle={{ color: 'var(--ink-muted)', fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
          {keys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} name={compareAreas[i].area_name}
              stroke={COLORS[i]} strokeWidth={2.5} dot={{ r: 3, fill: COLORS[i] }} />
          ))}
        </LineChart>
      </ChartCard>

<ChartCard
  title="Night Activity Index"
  sub="Relative night-time activity score (0–100). Higher values indicate brighter and more active areas."
>
  <LineChart data={nightData}>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="var(--border)"
    />

    <XAxis
      dataKey="year"
      {...axisStyle}
      label={{
        value: "Year",
        position: "insideBottom",
        offset: -5,
      }}
    />

    <YAxis
      domain={['auto', 'auto']}
      {...axisStyle}
      tickFormatter={(v) => `${v}`}
      label={{
        value: "Night Index",
        angle: -90,
        position: "insideLeft",
      }}
    />

    <Tooltip
      {...TT}
      formatter={(v) => Number(v).toFixed(1)}
    />

    <Legend
      wrapperStyle={{
        color: "var(--ink-muted)",
        fontSize: 11,
        fontFamily: "IBM Plex Mono",
      }}
    />

    {keys.map((key, i) => (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        name={compareAreas[i].area_name}
        stroke={COLORS[i]}
        strokeWidth={2.5}
        dot={{ r: 3, fill: COLORS[i] }}
      />
    ))}
  </LineChart>
</ChartCard>
      <div className="card" style={{ padding: 24 }}>
  <h2
    className="serif"
    style={{
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 4,
    }}
  >
    🤖 AI Comparison Summary
  </h2>

  <p
    style={{
      fontSize: 11,
      color: 'var(--ink-muted)',
      marginBottom: 16,
    }}
  >
    Automatically generated insights based on historical satellite observations
  </p>

  {loadingSummary ? (
    <div
      style={{
        fontSize: 13,
        color: 'var(--ink-muted)',
      }}
    >
      Generating AI insights...
    </div>
  ) : (
    <>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.8,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {summary}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
        }}
      >
        AI-generated summary. May contain minor inaccuracies.
      </div>
    </>
  )}
</div>

    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 className="serif" style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <p style={{ color: 'var(--ink-muted)', fontSize: 11, marginBottom: 12 }}>{sub}</p>
      <ResponsiveContainer width="100%" height={250}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}