import { useEffect, useState } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { cityApi } from '../services/api'

const TT = { contentStyle: { background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'IBM Plex Sans', fontSize: 12, color: 'var(--ink)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }, cursor: { stroke: 'var(--ink-faint)' } }

function KPI({ label, value, unit, sub, color }) {
  return (
    <div className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div className="serif" style={{ fontSize: 36, fontWeight: 900, color: color || 'var(--ink)', lineHeight: 1 }}>{value ?? '—'}</div>
        {unit && <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontWeight: 500 }}>{unit}</div>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 6 }}>{sub}</div>}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: color || 'var(--ink)' }} />
    </div>
  )
}

function Section({ title, tag, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 className="serif" style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h2>
        {tag && <span className="research-tag">{tag}</span>}
      </div>
      {children}
    </div>
  )
}

function Skeleton({ height = 240 }) {
  return <div style={{ height, borderRadius: 12, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
}

export default function Overview() {
  const [history,    setHistory]    = useState(null)
  const [preds,      setPreds]      = useState(null)
  const [topGrowing, setTopGrowing] = useState(null)
  const [mostBuilt,  setMostBuilt]  = useState(null)

  useEffect(() => {
    cityApi.history().then(d     => d && setHistory(d.history))
    cityApi.predictions().then(d => d && setPreds(d.predictions))
    cityApi.topGrowing().then(d  => d && setTopGrowing(d.areas))
    cityApi.mostBuilt().then(d   => d && setMostBuilt(d.areas))
  }, [])

  // Derived KPI values
  const latest   = history?.[history.length - 1]
  const earliest = history?.[0]
  const lastPred = preds?.[preds.length - 1]

const builtStart = earliest?.built ?? null
const builtEnd = latest?.built ?? null
const nightGrowth = latest && earliest ? (latest.night - earliest.night).toFixed(1) : null

  // Merge history + preds for stacked area chart
  const combined = [
    ...(history  ?? []).map(d => ({ ...d, type: 'hist' })),
    ...(preds    ?? []).map(d => ({ year: d.year, high: d.high, medium: d.medium, low: d.low, type: 'pred' })),
  ]

  return (
    <div style={{ padding: '40px 40px 60px', maxWidth: 1200 }}>

      <div style={{ marginBottom: 36 }}>
        <div className="research-tag" style={{ marginBottom: 10 }}>City Overview · 2016–2040</div>
        <h1 className="serif" style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)' }}>
          Gandhinagar Urban Growth<br />Intelligence Dashboard
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 520, lineHeight: 1.7 }}>
          Gandhinagar: Past, Present & Future. <br></br>
          Discover how the city has evolved since 2016 and see what the future may look like through data-driven predictions.
        </p>
      </div>

      {/* KPIs */}
      {/* Growth Summary */}
      <Section title="How Gandhinagar Has Changed">

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 20,
            marginBottom: 10,
          }}
        >

          {/* Construction Growth Card */}
          <div
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                fontFamily: "IBM Plex Mono",
              }}
            >
BUILT-UP LAND COVERAGE            </span>

            <span
             title={
  earliest && latest
    ? [
        `2016: ${earliest.built.toFixed(1)}%`,
        `2024: ${latest.built.toFixed(1)}%`,
        `Change: ${(latest.built - earliest.built).toFixed(1)} percentage points`,
        `Relative Growth: ${(
          ((latest.built - earliest.built) / earliest.built) * 100
        ).toFixed(1)}%`
      ].join("\n")
    : ""
}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                cursor: "help",
                color: "var(--ink-muted)",
                fontWeight: 600,
              }}
            >
              i
            </span>
          </div>

          

            <div
  className="serif"
  style={{
    fontSize: 42,
    fontWeight: 900,
    color: "var(--ink)",
    lineHeight: 1,
  }}
>
  {builtStart?.toFixed(1)}% → {builtEnd?.toFixed(1)}%
</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--ink-muted)",
              }}
            >
Built-up land coverage increased from
{builtStart?.toFixed(1)}% in 2016 to
{builtEnd?.toFixed(1)}% in 2024.
            </div>
          </div>

          {/* Growth Comparison */}
          <div className="card" style={{ padding: "24px" }}>

            <h3
              className="serif"
              style={{
                marginBottom: 18,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Growth Areas: Then vs Future
            </h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 15,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: 12,
                    }}
                  >
                    Category
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      paddingBottom: 12,
                    }}
                  >
                    2016
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      paddingBottom: 12,
                    }}
                  >
                    2040 (Model Prediction)
                  </th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td style={{ padding: "14px 0" }}>
                    🔴 High Growth Areas
                  </td>

                                    <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--red)",
                    }}
                  >
                    {earliest?.high ?? "—"}
                  </td>

                  <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--red)",
                    }}
                  >
                    {lastPred?.high ?? "—"}
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "14px 0" }}>
                    🟠 Moderate Growth Areas
                  </td>

                                    <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--orange)",
                    }}
                  >
                    {earliest?.medium ?? "—"}
                  </td>

                  <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--orange)",
                    }}
                  >
                    {lastPred?.medium ?? "—"}
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "14px 0" }}>
                    🟢 Low Growth Areas
                  </td>

                                    <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {earliest?.low ?? "—"}
                  </td>

                  <td
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {lastPred?.low ?? "—"}
                  </td>
                </tr>

              </tbody>
            </table>

            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "var(--ink-muted)",
                lineHeight: 1.6,
              }}
            >
              Number of areas classified into High, Moderate and Low Growth categories in 2016 and projected for 2040.
            </div>

          </div>

        </div>

      </Section>

{/* City Growth Over Time */}
<Section
  title="How the City Evolved Year by Year"
  tag="Changes from 2016 to 2024"
>
  <div className="card" style={{ padding: '24px 24px 16px' }}>

    <p
      style={{
        fontSize: 13,
        color: 'var(--ink-muted)',
        marginBottom: 20,
        lineHeight: 1.7
      }}
    >
      More buildings, changing green spaces, and brighter lights at night can
      tell us how a city is growing. This chart shows how these changes have
      occurred across Gandhinagar since 2016.
    </p>

    {!history ? (
      <Skeleton />
    ) : (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={history}
          margin={{
            top: 10,
            right: 20,
            left: 20,
            bottom: 30
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--canvas)"
          />

          <XAxis
            dataKey="year"
            tick={{
              fontSize: 11,
              fontFamily: 'IBM Plex Mono',
              fill: 'var(--ink-muted)'
            }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'Year',
              position: 'insideBottom',
              offset: -15
            }}
          />

          <YAxis
            tick={{
              fontSize: 10,
              fontFamily: 'IBM Plex Mono',
              fill: 'var(--ink-muted)'
            }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            label={{
              value: 'Average Indicator Value',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle'
              }
            }}
          />

          <Tooltip
            {...TT}
            formatter={(value, name) => {

              if (name === 'Street & Building Lights') {
                return [
                  Number(value).toFixed(1),
                  'Night Activity Index'
                ]
              }

              return [
                `${Number(value).toFixed(1)}%`,
                name
              ]
            }}
          />

          <Line
            type="monotone"
            dataKey="built"
            name="Buildings & Roads"
            stroke="var(--red)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />

          <Line
            type="monotone"
            dataKey="ndvi"
            name="Parks & Trees"
            stroke="var(--green)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            strokeDasharray="5 3"
          />

          <Line
            type="monotone"
            dataKey="night"
            name="Street & Building Lights"
            stroke="var(--blue)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            opacity={0.8}
          />

        </LineChart>
      </ResponsiveContainer>
    )}

    <div
      style={{
        marginTop: 14,
        padding: '12px 16px',
        background: 'var(--paper)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--ink-muted)',
        lineHeight: 1.7,
        borderLeft: '3px solid var(--blue)'
      }}
    >
      <strong style={{ color: 'var(--ink)' }}>
        What do these lines mean?
      </strong>
      <br />
      🔴 Buildings & Roads = Areas covered by construction and development
      <br />
      🟢 Green Spaces = Green areas and vegetation
      <br />
      🔵 Street & Building Lights = Light visible at night, showing human activity and development
    </div>

  </div>
</Section>

      {/* Two-column Area Rankings */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 32,
  }}
>

  {/* LEFT CARD */}
  <div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <h2
        className="serif"
        style={{
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        Areas That Have Changed the Most
      </h2>

      <span className="research-tag">
        2016 → 2024
      </span>
    </div>

    <div
      className="card"
      style={{ overflow: 'hidden' }}
    >
      {!topGrowing
        ? [1,2,3,4,5,6,7,8].map(i => (
            <div
              key={i}
              style={{
                margin: '6px 12px',
                height: 52,
                borderRadius: 8,
                background: 'var(--canvas)',
                animation: 'pulse 1.5s infinite'
              }}
            />
          ))
        : topGrowing.map((a, i) => (
            <div
              key={a.area_name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom:
                  i < topGrowing.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                gap: 12,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-faint)',
                  width: 18,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'var(--ink)',
                  }}
                >
                  {a.area_name}
                </div>

                <div style={{ marginTop: 4 }}>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.min(
                          (a.change / 30) * 100,
                          100
                        )}%`,
                        background: 'var(--red)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--red)',
                  }}
                >
{a.built_2016?.toFixed(1)}% → {a.built_2024?.toFixed(1)}%             
   </div>

              </div>
            </div>
          ))}
    </div>

    <div
      style={{
        marginTop: 12,
        padding: '12px 14px',
        background: 'var(--paper)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--ink-muted)',
        lineHeight: 1.7,
      }}
    >
      <strong style={{ color: 'var(--ink)' }}>
        How is this calculated?
      </strong>
      <br />
   Each area shows its built-up land coverage in 2016 and 2024.

Areas with the largest increase in coverage are ranked highest.

Areas with the largest increase appear at the top.
    </div>

  </div>

  {/* RIGHT CARD */}
  <div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <h2
        className="serif"
        style={{
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        Most Developed Areas Today
      </h2>
    </div>

    <div
      className="card"
      style={{ overflow: 'hidden' }}
    >
      {!mostBuilt
        ? [1,2,3,4,5,6,7,8].map(i => (
            <div
              key={i}
              style={{
                margin: '6px 12px',
                height: 52,
                borderRadius: 8,
                background: 'var(--canvas)',
                animation: 'pulse 1.5s infinite'
              }}
            />
          ))
        : mostBuilt.map((a, i) => (
            <div
              key={a.grid_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom:
                  i < mostBuilt.length - 1
                    ? '1px solid var(--border)'
                    : 'none',
                gap: 12,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'var(--ink-faint)',
                  width: 18,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'var(--ink)',
                  }}
                >
                  {a.area_name}
                </div>

                <div style={{ marginTop: 4 }}>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${a.built_percent}%`,
                        background: 'var(--red)',
                      }}
                    />
                  </div>
                </div>
              </div>

<div
  style={{
    textAlign: 'right',
    minWidth: 110
  }}
>                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--red)',
                  }}
                >
                  {a.built_percent?.toFixed(1)}%
                </div>

              </div>
            </div>
          ))}
    </div>

    <div
      style={{
        marginTop: 12,
        padding: '12px 14px',
        background: 'var(--paper)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--ink-muted)',
        lineHeight: 1.7,
      }}
    >
      <strong style={{ color: 'var(--ink)' }}>
        How is this calculated?
      </strong>
      <br />
      Example: 
If 67% of the land in an area is covered by buildings,
roads and other developed infrastructure,
its score will be 67%.

Areas with the highest percentages appear at the top.
    </div>

  </div>

</div>

    </div>
  )
}