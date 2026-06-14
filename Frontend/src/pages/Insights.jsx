import { useState, useEffect } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, BarChart, Bar } from 'recharts'
import { cityApi, api } from '../services/api'

const TT = { contentStyle: { background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'IBM Plex Sans', fontSize: 12, color: 'var(--ink)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }, cursor: { stroke: 'var(--ink-faint)' } }
const colMap = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--green)' }

const HISTORICAL_YEARS = [
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
]
const YEARS = [
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
]


function Skeleton({ height = 360 }) {
  return <div style={{ height, borderRadius: 12, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 7, fontSize: 12, fontWeight: 500,
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? '#fff' : 'var(--ink-muted)',
      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
      cursor: 'pointer', fontFamily: 'IBM Plex Sans', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

// Build radar data from scatter points
function buildRadarData(scatter) {
  if (!scatter?.length) return []
  const classes = ['high', 'medium', 'low']
  const metrics = [
    { key: 'built_percent',  label: 'Built-up',    max: 100 },
    { key: 'nighttime_mean', label: 'Night Light',  max: 100 },
    { key: 'ndvi_mean',      label: 'Vegetation',   max: 100, invert: true },
  ]
  return metrics.map(m => {
    const row = { metric: m.label }
    classes.forEach(cls => {
      const subset = scatter.filter(d => d.growth_class === cls)
      if (!subset.length) { row[cls] = 0; return }
      const avg = subset.reduce((s, d) => s + (d[m.key] ?? 0), 0) / subset.length
      row[cls] = m.invert ? Math.round(100 - avg) : Math.round(avg)
    })
    return row
  })
}

export default function Insights() {
  const [tab,          setTab]          = useState('scatter')
  const [scatter,      setScatter]      = useState(null)
  const [correlations, setCorrelations] = useState(null)
  const [yoy,          setYoy]          = useState(null)
  const [scatterYear, setScatterYear] =   useState(2024)

useEffect(() => {
  api.scatter(scatterYear).then(d => {
    if (d) setScatter(d.areas)
  })
}, [scatterYear])

  useEffect(() => {
    cityApi.correlations().then(d   => d && setCorrelations(d.correlations))
    cityApi.yoyChanges().then(d     => d && setYoy(d.changes))
  }, [])

  const radarData = buildRadarData(scatter)

  // Feature importance is a model artifact — keep as static since it's fixed at training time
  const FEATURE_IMPORTANCE = [
    { feature: 'Built %',    importance: 0.38 },
    { feature: 'Built Δ',   importance: 0.26 },
    { feature: 'Night Light', importance: 0.18 },
    { feature: 'NDVI',       importance: 0.12 },
    { feature: 'Night Δ',   importance: 0.06 },
  ]

  return (
    <div style={{ padding: '40px 40px 60px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 36 }}>
        <div className="research-tag" style={{ marginBottom: 10 }}>Research Analytics · Satellite-Derived Metrics</div>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          What the Data Tells Us
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 560, lineHeight: 1.7 }}>
          This section explores the patterns behind Gandhinagar's growth using satellite observations, construction trends, green cover, and night-time activity.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        <Tab label="Scatter Analysis" active={tab === 'scatter'} onClick={() => setTab('scatter')} />
        <Tab label="Class Profiles"   active={tab === 'radar'}   onClick={() => setTab('radar')} />
      </div>
         
      {/* ── SCATTER ── */}
{tab === 'scatter' && (
  <div className="card" style={{ padding: 24, marginBottom: 24 }}>

    {/* Header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <div>
        <h2
          className="serif"
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Buildings vs Green Spaces
        </h2>

        <p
          style={{
            fontSize: 12,
            color: 'var(--ink-muted)',
            lineHeight: 1.6,
          }}
        >
          Each dot represents one area of Gandhinagar. This chart shows the relationship between construction and greenery.
        </p>
      </div>

      <div>
        <select
          value={scatterYear}
          onChange={(e) => setScatterYear(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#fff',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {HISTORICAL_YEARS.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div
      style={{
        fontSize: 11,
        color: 'var(--ink-muted)',
        marginBottom: 18,
      }}
    >
      Historical satellite observations only (2016–2024).
    </div>

    {/* Graph + Explanation */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 320px',
        gap: 24,
        alignItems: 'start',
      }}
    >

      {/* Scatter */}
      <div>
        {!scatter ? (
          <Skeleton />
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--canvas)"
              />

              <XAxis
                dataKey="built_percent"
                type="number"
                domain={[0, 80]}
                tick={{
                  fontSize: 10,
                  fontFamily: 'IBM Plex Mono',
                  fill: 'var(--ink-muted)',
                }}
                label={{
                  value: 'Buildings & Roads (%)',
                  position: 'insideBottom',
                  offset: -5,
                  fontSize: 11,
                  fill: 'var(--ink-muted)',
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                dataKey="ndvi_mean"
                type="number"
                domain={[0, 65]}
                tick={{
                  fontSize: 10,
                  fontFamily: 'IBM Plex Mono',
                  fill: 'var(--ink-muted)',
                }}
                label={{
                  value: 'Trees & Green Spaces (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 11,
                  fill: 'var(--ink-muted)',
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                {...TT}
                cursor={{
                  stroke: 'var(--ink-faint)',
                  strokeDasharray: '3 3',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null

                  const d = payload[0].payload

                  return (
                    <div
                      style={{
                        background: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          fontSize: 12,
                        }}
                      >
                        {d.area_name}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Buildings: {d.built_percent?.toFixed(1)}%
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Green Space: {d.ndvi_mean?.toFixed(1)}%
                      </div>
                    </div>
                  )
                }}
              />

              <Scatter data={scatter}>
                {scatter.map((d, i) => (
                  <Cell
                    key={i}
                    fill={colMap[d.growth_class] || '#888'}
                    fillOpacity={0.75}
                  />
                ))}
              </Scatter>

            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Explanation Card */}
      <div
        style={{
          padding: 18,
          borderRadius: 12,
          background: 'var(--paper)',
          border: '1px solid var(--border)',
        }}
      >
        <h3
          className="serif"
          style={{
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          How to Read This Chart
        </h3>

        <div
          style={{
            fontSize: 12,
            color: 'var(--ink)',
            lineHeight: 1.8,
          }}
        >
          <p>
            Each dot represents one area of Gandhinagar.
          </p>

          <p>
            ➡ Moving right means more buildings and roads.
          </p>

          <p>
            ⬆ Moving up means more trees and green spaces.
          </p>

          <hr style={{ margin: '12px 0' }} />

          <p>
            <strong>Example 1:</strong>
          </p>

          <p>
            🌳 Top-left areas usually have more greenery and less construction.
          </p>

          <p>
            <strong>Example 2:</strong>
          </p>

          <p>
            🏙 Bottom-right areas are usually more developed and have less green space.
          </p>

          <hr style={{ margin: '12px 0' }} />

          <p>
            Comparing different years helps show how construction and greenery changed across the city over time.
          </p>
        </div>
         <div style={{ marginTop: 12 }}>
  <strong>What do the colors mean?</strong>

  <div style={{ marginTop: 8 }}>
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'var(--red)',
        marginRight: 8,
      }}
    />
    Fast Growing Areas
  </div>

  <div style={{ marginTop: 6 }}>
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'var(--orange)',
        marginRight: 8,
      }}
    />
    Moderately Growing Areas
  </div>

  <div style={{ marginTop: 6 }}>
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'var(--green)',
        marginRight: 8,
      }}
    />
    Slowly Growing Areas
  </div>
</div>
      </div>
            
    </div>

  </div>
  
)}


      {/* ── RADAR ── */}
      {tab === 'radar' && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>

  {/* Header */}
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    }}
  >
    <div>
      <h2
        className="serif"
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        What Different Growth Categories Look Like
      </h2>

      <p
        style={{
          fontSize: 12,
          color: 'var(--ink-muted)',
          lineHeight: 1.6,
        }}
      >
        This chart compares the typical characteristics of fast-growing, moderately growing, and slowly growing areas.
      </p>
    </div>

    <div>
      <select
        value={scatterYear}
        onChange={(e) => setScatterYear(Number(e.target.value))}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: '#fff',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {HISTORICAL_YEARS.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  </div>

  <div
    style={{
      fontSize: 11,
      color: 'var(--ink-muted)',
      marginBottom: 18,
    }}
  >
    Historical satellite observations only (2016–2024).
  </div>

  {/* Chart + Explanation */}
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '2fr 340px',
      gap: 24,
      alignItems: 'start',
    }}
  >

    {/* Radar Chart */}
    <div>
      {!scatter ? (
        <Skeleton />
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--canvas)" />

            <PolarAngleAxis
              dataKey="metric"
              tick={{
                fontSize: 12,
                fontFamily: 'IBM Plex Sans',
                fill: 'var(--ink)',
              }}
            />

            <Radar
              dataKey="high"
              stroke="var(--red)"
              fill="var(--red)"
              fillOpacity={0.12}
              strokeWidth={2}
            />

            <Radar
              dataKey="medium"
              stroke="var(--orange)"
              fill="var(--orange)"
              fillOpacity={0.10}
              strokeWidth={2}
            />

            <Radar
              dataKey="low"
              stroke="var(--green)"
              fill="var(--green)"
              fillOpacity={0.10}
              strokeWidth={2}
            />

            <Tooltip {...TT} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>

    {/* Right Card */}
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        background: 'var(--paper)',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        className="serif"
        style={{
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        How to Read This Chart
      </h3>

      <div
        style={{
          fontSize: 12,
          color: 'var(--ink)',
          lineHeight: 1.8,
        }}
      >
        <p>
          Each colored shape represents the average characteristics of a group of areas.
        </p>

        <p>
          📏 The farther a point is from the centre, the stronger that characteristic is.
        </p>

        <p>
          🏗️ <strong>Buildings</strong> show how much of the area is covered by buildings and roads.
        </p>

        <p>
          🌳 <strong>Green Space</strong> shows the amount of vegetation, trees, and parks.
        </p>

        <p>
          💡 <strong>Night Activity</strong> reflects how active and brightly lit the area is at night.
        </p>

        <hr style={{ margin: '12px 0' }} />

        <p>
          <strong>Example:</strong>
        </p>

        <p>
          If the red shape extends further toward Buildings and Night Activity, it means fast-growing areas tend to be more developed and active.
        </p>

        <hr style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 8 }}>
          <strong>What do the colors mean?</strong>
        </div>

        <div style={{ marginTop: 8 }}>
          🔴 Fast Growing Areas
        </div>

        <div style={{ marginTop: 6 }}>
          🟠 Moderately Growing Areas
        </div>

        <div style={{ marginTop: 6 }}>
          🟢 Slowly Growing Areas
        </div>
      </div>
    </div>

  </div>

</div>
      )}
    </div>
  )
}