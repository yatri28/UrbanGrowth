import { Search } from 'lucide-react'

import { useAreas } from '../../hooks/useAreas'

export default function SearchBar() {

  const {
    search,
    setSearch,
  } = useAreas()

  return (

    <div className="
      relative
    ">

      {/* ICON */}
      <Search

        size={18}

        className="
          absolute

          left-4
          top-1/2

          -translate-y-1/2

          text-slate-500
        "
      />

      {/* INPUT */}
      <input

        type="text"

        placeholder="Search area..."

        value={search}

        onChange={(e) =>
          setSearch(e.target.value)
        }

        className="
          w-[260px]
          h-11

          rounded-2xl

          bg-[#0f172a]

          border
          border-white/5

          pl-11
          pr-4

          text-sm
          text-white

          outline-none

          focus:border-blue-500/30

          transition-all
        "
      />

    </div>

  )
}