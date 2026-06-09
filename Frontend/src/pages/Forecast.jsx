import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell, ComposedChart } from 'recharts'
import { cityApi, api } from '../services/api'
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const TT = { contentStyle: { background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'IBM Plex Sans', fontSize: 12, color: 'var(--ink)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }, cursor: { stroke: 'var(--ink-faint)' } }

function Skeleton({ height = 240 }) {
  return <div style={{ height, borderRadius: 12, background: 'var(--canvas)', animation: 'pulse 1.5s infinite' }} />
}

function InsightCard({ icon: Icon, title, body, color }) {
  return (
    <div className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}

export default function Forecast() {
  const [history, setHistory]   = useState(null)
  const [preds,   setPreds]     = useState(null)
  const [scenario, setScenario] = useState('baseline')

  useEffect(() => {
    cityApi.history().then(d    => d && setHistory(d.history))
    cityApi.predictions().then(d => d && setPreds(d.predictions))
  }, [])

  const firstHist = history?.[0]
  const lastHist  = history?.[history.length - 1]
  const lastPred  = preds?.[preds.length - 1]
  const avgConf   = preds ? (preds.reduce((s, d) => s + (d.conf ?? 0), 0) / preds.length).toFixed(1) : null

  // Full 2016–2040 timeline for the main chart
  const fullTimeline = [
    ...(history ?? []).map(d => ({ ...d, phase: 'historical' })),
    ...(preds   ?? []).map(d => ({ ...d, phase: 'prediction' })),
  ]

  // Build scenario data from real prediction base
  const scenarioData = preds ? preds.map((d, i) => {
    const base = lastHist?.built ?? 32.3
    return {
      year:         d.year,
      baseline:     parseFloat((base + i * 0.8).toFixed(1)),
      accelerated:  parseFloat((base + i * 1.3).toFixed(1)),
      conservation: parseFloat((base + i * 0.4).toFixed(1)),
      conf:         d.conf,
    }
  }) : []

  return (
    <div style={{ padding: '40px 40px 60px', maxWidth: 1200 }}>

      <div style={{ marginBottom: 36 }}>
        <div className="research-tag" style={{ marginBottom: 10 }}>Forecast · XGBoost · 2025–2040</div>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          How Gandhinagar May Look in 2040
        </h1>
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-muted)', maxWidth: 560, lineHeight: 1.7 }}>
          Using past city growth patterns and satellite data, we estimate how different parts of Gandhinagar may develop by 2040.
        </p>
      </div>

      {/* Key findings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        <InsightCard icon={TrendingUp} color="var(--red)" title="More Areas Are Expected to Grow Quickly"
          body={lastHist && lastPred ? `The number of rapidly developing areas may increase from ${lastHist.high} (${lastHist.year}) to ${lastPred.high} by 2040.` : 'Loading…'} />
        <InsightCard icon={AlertTriangle} color="var(--orange)" title="Fewer Areas Are Being Left Behind"
          body="Areas showing little development are expected to become less common by 2040." />
      </div>

      {/* Full timeline */}
      <div className="card" style={{ padding: '24px 24px 16px', marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Fast, Moderate and Slow Growing Areas Over Time</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>This chart shows how many areas were growing quickly, steadily, or slowly from 2016 to 2024, and how those trends may change by 2040. Historical data + AI projections (split at 2024)</p>
        </div>
        {fullTimeline.length === 0 ? <Skeleton height={280} /> : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={fullTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--canvas)" />
              <XAxis
                dataKey="year"
                label={{
                  value: "Year",
                  position: "insideBottom",
                  offset: -5
                }}
              />
              <YAxis
                label={{
                  value: "Number of Areas",
                  angle: -90,
                  position: "insideLeft"
                }}
              />
              <Tooltip {...TT} />
              
              <ReferenceLine x={2024} stroke="var(--ink-muted)" strokeDasharray="6 3"
                label={{ value: '◀ Historical  |  Predicted ▶', fill: 'var(--ink-muted)', fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="high"   name="High"   stroke="var(--red)"    strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="medium" name="Medium" stroke="var(--orange)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="low"    name="Low"    stroke="var(--green)"  strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <div
  style={{
    marginTop: 16,
    padding: '12px 16px',
    borderRadius: 10,
    background: 'var(--paper)',
    border: '1px solid var(--border)',
    fontSize: 12,
    color: 'var(--ink-muted)',
    lineHeight: 1.8,
  }}
>
  <strong style={{ color: 'var(--ink)' }}>
    What do these categories mean?
  </strong>

  <div style={{ marginTop: 8 }}>
    <span style={{ color: 'var(--red)', fontWeight: 600 }}>
      High:
    </span>{' '}
    Areas where new buildings, roads, and development are increasing quickly.
    The graph shows how many such areas exist each year.
  </div>

  <div style={{ marginTop: 6 }}>
    <span style={{ color: 'var(--orange)', fontWeight: 600 }}>
      Medium:
    </span>{' '}
    Areas experiencing steady and gradual development.
    The graph shows how many such areas exist each year.
  </div>

  <div style={{ marginTop: 6 }}>
    <span style={{ color: 'var(--green)', fontWeight: 600 }}>
      Low:
    </span>{' '}
    Areas with little change or development compared to other parts of the city.
    The graph shows how many such areas exist each year.
  </div>
</div>
    </div>
  )
}