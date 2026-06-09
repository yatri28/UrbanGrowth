import { useNavigate } from 'react-router-dom'

import SearchBar from '../sidebar/SearchBar'
import FilterTabs from '../sidebar/FilterTabs'
import AreaCategory from '../sidebar/AreaCategory'

import { useCompare } from '../../hooks/useCompare'

export default function Sidebar() {

  const navigate = useNavigate()

  const {
    compareAreas,
  } = useCompare()

  return (

    <div className="h-full flex flex-col relative">

      {/* TOP */}
      <div className="
        p-5
        border-b
        border-white/5
      ">

        <SearchBar />

        <div className="mt-4">
          <FilterTabs />
        </div>

      </div>

      {/* AREA LIST */}
      <div className="
        flex-1
        overflow-y-auto
        px-4
        py-5
        space-y-7
      ">

        <AreaCategory
          title="High Growth"
          type="high"
        />

        <AreaCategory
          title="Medium Growth"
          type="medium"
        />

        <AreaCategory
          title="Low Growth"
          type="low"
        />

      </div>

      {/* FLOATING COMPARE BUTTON */}
      {compareAreas.length > 0 && (

        <div className="
          absolute
          bottom-5
          left-5
          right-5
          z-50
        ">

          <button
            onClick={() =>
              navigate('/compare')
            }

            className="
              w-full
              h-14
              rounded-2xl

              bg-blue-500
              hover:bg-blue-400

              text-white
              font-semibold

              transition-all
              duration-300

              shadow-2xl
              shadow-blue-500/30
            "
          >

            Compare Areas
            ({compareAreas.length})

          </button>

        </div>

      )}

    </div>

  )
}