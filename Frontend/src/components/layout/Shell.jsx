import { NavLink, useLocation } from 'react-router-dom'
import { Map, BarChart2, TrendingUp, Microscope, Activity, GitCompare, Brain, Waves } from 'lucide-react'
import { useCompare } from '../../hooks/useCompare'

const nav = [
  { to: '/',            icon: Activity,    label: 'Overview',   sub: 'City Pulse' },
  { to: '/atlas',       icon: Map,         label: 'Atlas',      sub: 'Area Explorer' },
  { to: '/forecast',    icon: TrendingUp,  label: 'Forecast',   sub: '2025–2040' },
  { to: '/insights',    icon: Microscope,  label: 'Insights',   sub: 'Analytics' },
  { to: '/compare',     icon: GitCompare,  label: 'Compare',    sub: 'Side-by-Side' },
  { to: '/model',       icon: Brain,       label: 'ModelDetails', sub: 'XGBoost & Methodology' },
  { to: '/riverfront',  icon: Waves,       label: 'Riverfront', sub: 'Corridor Case Study' },
]

export default function Shell({ children }) {
  const { compareAreas } = useCompare()

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Urban<br />Growth
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 6, fontFamily: 'IBM Plex Mono' }}>
            Gandhinagar · Gujarat
          </div>
          <div style={{
            marginTop: 12, padding: '6px 10px',
            background: 'var(--paper)', border: '1px solid var(--border)',
            borderRadius: 6, fontSize: 10, lineHeight: 1.5,
          }}>
            <div style={{ color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 9, fontFamily: 'IBM Plex Mono' }}>XGBoost Model</div>
            <div style={{ fontWeight: 600, color: 'var(--green)', marginTop: 1 }}>89.5% Accuracy</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', padding: '0 4px', marginBottom: 8, fontFamily: 'IBM Plex Mono' }}>
            Navigation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <n.icon size={15} />
                <div style={{ flex: 1 }}>
                  <div style={{ lineHeight: 1.2 }}>{n.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.65, lineHeight: 1 }}>{n.sub}</div>
                </div>
                {n.to === '/compare' && compareAreas.length > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono',
                    background: 'var(--orange)', color: '#fff',
                    borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>
                    {compareAreas.length}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', letterSpacing: '0.06em' }}>2016–2040</div>
            <div>70 Areas · 9 yrs historical</div>
            <div>16 yrs projected</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', background: 'var(--cream)' }}>
        {children}
      </main>
    </div>
  )
}