import { CalendarDays } from 'lucide-react'
import { useYear } from '../../hooks/useYear'
import { useAreas } from '../../hooks/useAreas'
import { Link } from 'react-router-dom'

// Historical: 2016–2024 | Prediction: 2025–2030
const YEARS = [
  2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023, 2024,
  2025, 2026, 2027, 2028, 2029, 2030,
]

export default function Header() {
  const { selectedYear, setSelectedYear } = useYear()
  const { search, setSearch } = useAreas()

  return (
    <header className="
      h-[72px]
      border-b border-white/5
      bg-[#0b1220]/90
      backdrop-blur-xl
      px-6
      flex items-center
      justify-between
    ">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div className="
          w-11 h-11 rounded-2xl
          bg-blue-500/20
          flex items-center justify-center
          text-xl
          glow-blue
        ">
          🌆
        </div>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">
            Urban Growth Prediction
          </h1>
          <p className="text-sm text-slate-400">
            Gandhinagar Spatial Intelligence System
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        <div className="
          glass rounded-xl px-4 py-2
          flex items-center gap-3
        ">
          <CalendarDays size={16} className="text-blue-400" />

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="
              h-11 rounded-2xl
              bg-[#0f172a]
              border border-white/5
              px-4
              text-sm text-white
              outline-none
              focus:border-blue-500/30
              transition-all
            "
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year <= 2024 ? year : `${year} (Predicted)`}
              </option>
            ))}
          </select>

          <Link to="/compare">
            <button className="
              h-11 px-5 rounded-2xl
              bg-blue-500 hover:bg-blue-600
              text-sm font-medium
              transition-all
            ">
              Compare Areas
            </button>
          </Link>
        </div>

        <div className="
          px-5 h-11 rounded-2xl
          border border-white/5
          bg-[#0f172a]
          flex items-center gap-4
        ">
          <div>
            <p className="text-[11px] text-slate-400">XGBoost</p>
            <p className="text-sm font-semibold text-white">Accuracy: 90.67%</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <p className="text-[11px] text-slate-400">Macro F1</p>
            <p className="text-sm font-semibold text-emerald-400">0.9019</p>
          </div>
        </div>

      </div>

    </header>
  )
}