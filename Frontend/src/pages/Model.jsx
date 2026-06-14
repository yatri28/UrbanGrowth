import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area, AreaChart } from 'recharts'
import { cityApi } from '../services/api'

const FEATURE_IMPORTANCE = [
  { feature: 'built_percent',         score: 0.187, type: 'satellite',  label: 'How much land is built up' },
  { feature: 'built_change_avg_lag2', score: 0.142, type: 'satellite',  label: 'Speed of recent construction' },
  { feature: 'nighttime_norm',        score: 0.118, type: 'satellite',  label: 'Night-time light intensity' },
  { feature: 'infill_potential',      score: 0.098, type: 'guda',       label: 'How much more can legally be built' },
  { feature: 'ndvi_mean',             score: 0.089, type: 'satellite',  label: 'Amount of green cover' },
  { feature: 'gift_city_proximity',   score: 0.081, type: 'guda',       label: 'Distance from GIFT City corridor' },
  { feature: 'neighbor_built_avg',    score: 0.074, type: 'satellite',  label: 'Built-up level of nearby areas' },
  { feature: 'fsi_permitted',         score: 0.068, type: 'guda',       label: 'How tall buildings are allowed' },
  { feature: 'saturation_flag',       score: 0.055, type: 'saturation', label: 'Is the area already full?' },
  { feature: 'zone_type',             score: 0.048, type: 'guda',       label: 'Official land-use zone' },
  { feature: 'built_headroom',        score: 0.040, type: 'saturation', label: 'Remaining construction space' },
]

const typeColor = { satellite: '#C0392B', guda: '#1A6B45', saturation: '#D4570C' }
const typeLabel = { satellite: 'Satellite Data', guda: 'GUDA Policy Data', saturation: 'Saturation Signal' }

const TT = {
  contentStyle: {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
    fontFamily: 'IBM Plex Sans', fontSize: 12, color: 'var(--ink)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  cursor: { stroke: 'var(--border)' },
}

/* ── helpers ── */
function Tag({ children, color = 'var(--ink-muted)' }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontFamily: 'IBM Plex Mono',
      fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
      border: `1px solid ${color}66`, borderRadius: 4, padding: '3px 8px', color,
    }}>{children}</span>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '56px 0' }} />
}

function SectionHead({ num, title, sub }) {
  return (
    <div style={{ display: 'flex', gap: 28, marginBottom: 32, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', marginTop: 4 }}>
        {String(num).padStart(2, '0')}
      </div>
      <div>
        <h2 className="serif" style={{ fontSize: 26, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.015em', margin: '0 0 6px' }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.75, maxWidth: 600, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── CHANGE 1: StatPill now has a description line ── */
function StatPill({ label, value, desc, color = 'var(--red)' }) {
  return (
    <div style={{
      padding: '20px 22px 18px',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      borderTop: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-muted)' }}>{label}</div>
      <div className="serif" style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      {/* CHANGE 1: description */}
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function Model() {
  const [confData, setConfData] = useState(null)

  useEffect(() => {
    cityApi.predictions().then(d => {
      if (d?.predictions) setConfData(d.predictions)
    })
  }, [])

  // Compute tight Y domain for line chart
  const confMin = confData ? Math.max(0, Math.floor(Math.min(...confData.map(d => d.conf ?? 100)) / 5) * 5 - 5) : 0
  const confMax = confData ? Math.min(100, Math.ceil(Math.max(...confData.map(d => d.conf ?? 0)) / 5) * 5 + 5) : 100

  return (
    <div style={{ padding: '44px 52px 88px', maxWidth: 1080, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 52, paddingBottom: 40, borderBottom: '1px solid var(--border)' }}>
        <Tag color="var(--red)">Model Documentation · v7</Tag>
        <h1 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.08, color: 'var(--ink)', margin: '14px 0 16px' }}>
          How the Prediction<br />Model Works
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.85, maxWidth: 560, margin: 0 }}>
          This page explains the AI model behind Gandhinagar's urban growth predictions —
          what it does, how it was trained, and how confident it is in its forecasts.
        </p>
      </div>

      {/* ── CHANGE 1: Model stats strip with desc lines ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 56 }}>
        <StatPill
          label="Model Type" value="XGBoost" color="var(--red)"
          desc="The classification algorithm used to assign growth labels to each area."
        />
        <StatPill
          label="Accuracy" value="89.5%" color="#1A6B45"
          desc="Out of 200 test areas, the model correctly predicted the class for ~179."
        />
        <StatPill
          label="Macro F1 Score" value="0.90" color="var(--red)"
          desc="Balances precision and recall equally across all three classes. 1.0 is perfect."
        />
        <StatPill
          label="Forecasting" value="Holt's" color="#D4570C"
          desc="The time-series method used to project satellite values into 2025–2040."
        />
      </div>

      {/* ══ SECTION 1 — Models ══ */}
      <SectionHead
        num={1}
        title="XGBoost + Holt's Forecasting"
        sub="Two different tools working together — one classifies areas, the other forecasts future satellite values."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 0 }}>
        <div style={{ padding: '26px 24px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, borderTop: '4px solid var(--red)' }}>
          <div style={{ fontSize: 26, marginBottom: 14 }}>🌲</div>
          <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: 12 }}>XGBoost Classifier</div>
          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.9 }}>
            <div style={{ marginBottom: 10 }}><strong>What it does:</strong> Looks at satellite data for every area and decides — is this area growing <em>fast</em>, <em>slowly</em>, or is it <em>stable</em>?</div>
            <div style={{ marginBottom: 10 }}><strong>How it works:</strong> It's like asking 300 experts to vote on each area. Every expert (a "decision tree") looks at the data and gives an opinion. The final answer is a majority vote.</div>
            <div><strong>Why XGBoost?</strong> It handles messy real-world data well and is trusted in research. We compared it with Random Forest — XGBoost won: 89.5% vs 86% accuracy.</div>
          </div>
          <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--paper)', borderRadius: 8, fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', letterSpacing: '0.02em' }}>
            n_estimators=300 · max_depth=5 · learning_rate=0.05
          </div>
        </div>

        <div style={{ padding: '26px 24px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, borderTop: '4px solid #D4570C' }}>
          <div style={{ fontSize: 26, marginBottom: 14 }}>📈</div>
          <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#D4570C', marginBottom: 12 }}>Holt's Dampened Trend Forecasting</div>
          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.9 }}>
            <div style={{ marginBottom: 10 }}><strong>What it does:</strong> Takes 2016–2024 satellite values for each area and forecasts what they'll look like in 2025, 2030, and 2040.</div>
            <div style={{ marginBottom: 10 }}><strong>How it works:</strong> Like predicting tomorrow's temperature from a trend — if it's been rising 1°C per year, you estimate that pattern. But we gradually slow it down (damping) so it doesn't go unrealistically high.</div>
            <div><strong>Why dampened?</strong> Cities don't grow forever. A damping factor (φ = 0.95) ensures a fully-built area isn't predicted to keep expanding past its legal ceiling.</div>
          </div>
          <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--paper)', borderRadius: 8, fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'IBM Plex Mono', letterSpacing: '0.02em' }}>
            alpha=0.4 · beta=0.2 · dampen=0.95 · hard clamp [0, 1]
          </div>
        </div>
      </div>

      <Divider />

      {/* ══ SECTION 2 — Classification ══ */}
      <SectionHead
        num={2}
        title="How High, Medium & Stable Are Decided"
        sub="Every area gets a growth score. The score's percentile rank determines which class it falls into."
      />

      <div style={{ padding: '20px 24px', background: 'var(--paper)', borderRadius: 12, marginBottom: 24, borderLeft: '4px solid var(--red)' }}>
        <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: 10 }}>Growth Score Formula — Literature-Backed Weights</div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--ink)', lineHeight: 2.1, background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
          score = (built_percent × <strong>0.35</strong>) + (night_lights × <strong>0.25</strong>) + (zone_policy × <strong>0.15</strong>) + (ndvi × <strong>0.15</strong>) + (population × <strong>0.10</strong>)
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          Weights validated against Purswani et al. (2021) <em>Journal of Urban Management</em> and GUDA Development Plan 2024. Areas already heavily built in low-FSI zones are re-labelled High → Medium to avoid false signals.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { emoji: '🔴', label: 'High Growth',     color: '#C0392B', bg: '#fdf1f0', score: 'Top 34% of scores',    what: 'Construction is accelerating fast — new buildings, roads, expanding townships on city edges.', signal: 'High construction speed + strong night lights + near GIFT City or TP Scheme zone.', eg: 'Sargasan, Vavol, Randesan' },
          { emoji: '🟠', label: 'Moderate Growth', color: '#D4570C', bg: '#fdf4ee', score: 'Middle 33% of scores', what: 'Growing at a normal, steady pace — filling in gaps rather than expanding outward dramatically.', signal: 'Moderate construction + medium FSI zone + incremental night-light increase.', eg: 'Sector 1, Kudasan, Nabhoi' },
          { emoji: '🟢', label: 'Stable',           color: '#1A6B45', bg: '#f0f7f3', score: 'Bottom 33% of scores', what: 'Already well-developed and mostly full, or a protected green belt or institutional zone.', signal: 'High saturation flag + low FSI zone + near-zero construction velocity.', eg: 'Sector 6, Sector 22, Green City' },
        ].map(c => (
          <div key={c.label} style={{ padding: '20px 18px', background: c.bg, border: `1px solid ${c.color}33`, borderRadius: 12, borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{c.emoji}</div>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c.color, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: c.color, background: '#fff', borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>{c.score}</div>
            <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.75, marginBottom: 8 }}>{c.what}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.65, marginBottom: 8 }}><strong>Signals:</strong> {c.signal}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'IBM Plex Mono' }}>e.g. {c.eg}</div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ══ SECTION 3 — Feature Importance ══ */}
      <SectionHead
        num={3}
        title="What Does the Model Actually Look At?"
        sub="Not all data is equally useful. These are the top signals the model relies on most when predicting growth."
      />

      {/* CHANGE 2: removed right-column plain-English list — chart only, full width */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Top 11 Features by Importance Score</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {Object.entries(typeColor).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 9, height: 9, background: c, borderRadius: 2 }} />
                <span style={{ color: 'var(--ink-muted)' }}>{typeLabel[k]}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={[...FEATURE_IMPORTANCE].sort((a, b) => a.score - b.score)}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 14, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--canvas)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-faint)' }} axisLine={false} tickLine={false} domain={[0, 0.22]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} width={175} />
            <Tooltip {...TT}
              formatter={(v, n, p) => [`${(v * 100).toFixed(1)}%`, 'Importance']}
              labelFormatter={label => {
                const f = FEATURE_IMPORTANCE.find(x => x.feature === label)
                return f ? `${label}\n${f.label}` : label
              }}
            />
            <Bar dataKey="score" radius={[0, 5, 5, 0]} label={{ position: 'right', fontSize: 11, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)', formatter: v => `${(v*100).toFixed(0)}%` }}>
              {[...FEATURE_IMPORTANCE].sort((a, b) => a.score - b.score).map((f, i) => (
                <Cell key={i} fill={typeColor[f.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center' }}>
          Hover a bar to see the plain-English meaning of each feature
        </div>
      </div>

      <Divider />

      {/* ══ SECTION 4 — Confusion Matrix ══ */}
      <SectionHead
        num={4}
        title="Where Did the Model Get It Right?"
        sub="A confusion matrix shows exactly where the model was correct — and where it made mistakes."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <img src="/matrix.png" alt="Confusion Matrix" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 10 }}>Left: Raw counts · Right: Normalised (0–1)</div>
        </div>

        <div>
          <div style={{ padding: '18px 20px', background: '#fdf1f0', borderRadius: 12, marginBottom: 20, borderLeft: '4px solid var(--red)' }}>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--red)', marginBottom: 10 }}>What is a Confusion Matrix?</div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.85 }}>
              The model looked at 200 test areas and predicted High / Medium / Stable for each. We then checked: was it right?
              <br /><br />
              The matrix shows this as a grid. <strong>Numbers on the diagonal = correct predictions.</strong> Numbers off-diagonal = mistakes. A perfect model has zeros everywhere except the diagonal.
            </div>
          </div>

          <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 14 }}>Results on 200 test areas</div>
          {[
            { label: 'High Growth', color: '#C0392B', correct: '88%', w: '88%', note: 'Out of 73 high-growth areas, 64 correctly identified.' },
            { label: 'Stable',      color: '#1A6B45', correct: '94%', w: '94%', note: 'Out of 52 stable areas, 49 correct. Best performing class.' },
            { label: 'Moderate',    color: '#D4570C', correct: '88%', w: '88%', note: 'Out of 75 moderate areas, 66 correctly identified.' },
          ].map(r => (
            <div key={r.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{r.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'IBM Plex Mono', color: r.color }}>{r.correct}</span>
              </div>
              <div style={{ height: 3, background: 'var(--canvas)', borderRadius: 99, marginBottom: 8 }}>
                <div style={{ height: '100%', width: r.w, background: r.color, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ══ SECTION 5 — Correlation ══ */}
      <SectionHead
        num={5}
        title="How Are the Data Points Related?"
        sub="Before training, we checked how different measurements relate to each other using correlation analysis."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ padding: '18px 20px', background: '#f0f7f3', borderRadius: 12, marginBottom: 20, borderLeft: '4px solid #1A6B45' }}>
            <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1A6B45', marginBottom: 10 }}>What is Correlation?</div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.85 }}>
              Correlation answers: <strong>when one thing goes up, does another also go up — or go down?</strong>
              <br /><br />
              Example: when it rains more, umbrella sales go up → <strong>positive correlation</strong>. When temperature drops, ice cream sales fall → <strong>negative correlation</strong>.
              The scale runs from −1.0 (perfect opposite) to +1.0 (perfect match). Zero means no relationship.
            </div>
          </div>

          <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 14 }}>What we found in Gandhinagar's data</div>

          {[
            { pair: 'Built-up vs Night Lights', r: '+0.78', strength: 'Strong Positive', color: '#C0392B', note: 'More buildings = more lights at night. Makes sense — more people means more activity.' },
            { pair: 'Built-up vs Greenery',     r: '−0.61', strength: 'Strong Negative', color: '#1A6B45', note: 'As more land gets built, green cover disappears. Every new road removes trees.' },
            { pair: 'Night Lights vs Greenery', r: '−0.52', strength: 'Moderate Negative', color: '#D4570C', note: 'Brighter, more active areas have less vegetation. Urban activity replaces nature.' },
          ].map(c => (
            <div key={c.pair} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{c.pair}</span>
                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'IBM Plex Mono', color: c.color }}>{c.r}</span>
              </div>
              <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: c.color, marginBottom: 6 }}>{c.strength}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{c.note}</div>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--paper)', borderRadius: 8, fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            Scale: <strong style={{ color: 'var(--ink)' }}>+1.0</strong> = perfect positive · <strong style={{ color: 'var(--ink)' }}>0</strong> = no relation · <strong style={{ color: 'var(--ink)' }}>−1.0</strong> = perfect inverse
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <img src="/correlation.png" alt="Correlation Matrix" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 10 }}>Darker red = strong positive · Darker blue = strong negative</div>
        </div>
      </div>

      <Divider />

      {/* ══ SECTION 6 — CHANGE 3: Line chart, tight Y-axis ══ */}
      <SectionHead
        num={6}
        title="How Confident Is the Model Year by Year?"
        sub="As predictions go further into the future, the model becomes less certain. This chart shows that honestly."
      />

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 20px 16px', marginBottom: 16 }}>
        {!confData ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
            Loading confidence data…
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={confData} margin={{ top: 10, right: 24, left: 0, bottom: 24 }}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1A6B45" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A6B45" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--canvas)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                  axisLine={false} tickLine={false}
                  label={{ value: 'Year', position: 'insideBottom', offset: -14, fontSize: 11, fill: 'var(--ink-muted)' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: 'var(--ink-muted)' }}
                  axisLine={false} tickLine={false}
                  unit="%" domain={[confMin, confMax]}
                  tickCount={6}
                />
                <Tooltip {...TT} formatter={v => [`${v?.toFixed(1)}%`, 'Avg Confidence']} />
                {/* reference line at 75% threshold */}
                <ReferenceLine y={75} stroke="#D4570C" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: '75% threshold', position: 'insideTopRight', fontSize: 10, fill: '#D4570C', fontFamily: 'IBM Plex Mono' }} />
                <Area type="monotone" dataKey="conf" fill="url(#confGrad)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="conf"
                  stroke="#1A6B45"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    const c = payload.conf >= 75 ? '#1A6B45' : payload.conf >= 60 ? '#D4570C' : '#C0392B'
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={c} stroke="#fff" strokeWidth={2} />
                  }}
                  activeDot={{ r: 6, fill: '#1A6B45', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: 20, marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { color: '#1A6B45', label: '≥ 75% — High confidence' },
                { color: '#D4570C', label: '60–75% — Moderate confidence' },
                { color: '#C0392B', label: '< 60% — Lower confidence' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 9, height: 9, background: l.color, borderRadius: '50%' }} />
                  <span style={{ color: 'var(--ink-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '16px 20px', background: 'var(--paper)', borderRadius: 10, borderLeft: '4px solid var(--border)', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--ink)' }}>Why does confidence vary?</strong> Near-term predictions (2025–2027) use fresh satellite data. As we forecast further out (2035–2040), tiny errors compound — like directions that get fuzzier the farther you travel. Dips below the orange line warrant treating predictions as directional estimates, not exact values.
      </div>

    </div>
  )
}