import { useAreas } from '../../hooks/useAreas'

const filters = [
  'all',
  'high',
  'medium',
  'low',
]

export default function FilterTabs() {

  const {
    activeFilter,
    setActiveFilter,
  } = useAreas()

  return (

    <div className="
      flex
      gap-3
      mb-6
      flex-wrap
    ">

      {filters.map((filter) => (

        <button

          key={filter}

          onClick={() =>
            setActiveFilter(filter)
          }

          className={`
            px-4
            py-2

            rounded-xl

            text-sm
            font-medium

            transition-all

            ${
              activeFilter === filter
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400'
            }
          `}
        >

          {filter.toUpperCase()}

        </button>

      ))}

    </div>

  )
}