import { TrendingUp } from 'lucide-react'
import { useCompare } from '../../hooks/useCompare'
import { useMap } from '../../hooks/useMap'

const glowStyles = {
  high:   'glow-red',
  medium: 'glow-yellow',
  low:    'glow-green',
}

const dotColors = {
  high:   'bg-red-500',
  medium: 'bg-yellow-400',
  low:    'bg-emerald-400',
}

export default function AreaCard({ area }) {

  const { setSelectedArea } = useMap()
  const { compareAreas, toggleCompareArea } = useCompare()

  const growthType = area.growth_class?.toLowerCase()
  const allGridIds = area.grid_ids ?? [area.grid_id]

  const isCompared = compareAreas.some((a) =>
    allGridIds.includes(a.grid_id)
  )

  return (
    <div
      onClick={() => setSelectedArea(area)}
      className={`
        glass rounded-2xl p-4 cursor-pointer
        transition-all hover:scale-[1.02] hover:border-white/10
        ${glowStyles[growthType]}
      `}
    >
      {/* TOP */}
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[growthType]}`} />
          <h4 className="text-sm font-semibold text-white">
            {area.area_name}
          </h4>
        </div>

        <div className="flex items-center gap-1 text-blue-400">
          <TrendingUp size={14} />
          <span className="text-xs font-medium">
            {growthType?.toUpperCase()}
          </span>
        </div>

      </div>

      {/* YEAR */}
      <div className="mt-4">
        <p className="text-[11px] text-slate-500">Year</p>
        <h5 className="text-sm font-semibold mt-1">{area.year}</h5>
      </div>

      {/* COMPARE BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleCompareArea({ ...area, grid_id: allGridIds[0] })
        }}
        className={`
          mt-4 w-full h-10 rounded-2xl border
          text-sm font-medium transition-all
          ${isCompared
            ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
            : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400'
          }
        `}
      >
        {isCompared ? 'Remove Compare' : 'Add To Compare'}
      </button>
    </div>
  )
}