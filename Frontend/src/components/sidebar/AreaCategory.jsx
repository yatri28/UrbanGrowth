import { useState } from 'react'

import AreaCard from './AreaCard'

import { useAreas } from '../../hooks/useAreas'

export default function AreaCategory({
  title,
  type,
}) {

  const {
    filteredAreas,
    loading,
  } = useAreas()

  const [showAll, setShowAll] =
    useState(false)

  // FILTER BY CATEGORY
  const categoryAreas =
    filteredAreas.filter(

      (area) =>

        area.growth_class
          ?.toLowerCase() === type

    )

  // SHOW ONLY 5 INITIALLY
  const visibleAreas = showAll
    ? categoryAreas
    : categoryAreas.slice(0, 5)

  return (

    <div className="mb-8">

      {/* HEADER */}
      <div className="
        flex
        items-center
        justify-between
        mb-4
      ">

        <div>

          <h2 className="
            text-lg
            font-semibold
            text-white
          ">
            {title}
          </h2>

          <p className="
            text-sm
            text-slate-400
            mt-1
          ">
            {categoryAreas.length}
            {' '}
            areas
          </p>

        </div>

      </div>

      {/* LOADING */}
      {loading && (

        <div className="
          text-slate-400
          text-sm
        ">
          Loading...
        </div>

      )}

      {/* AREA LIST */}
      <div className="
        space-y-4
      ">

        {visibleAreas.map((area) => (

          <AreaCard
            key={`${area.grid_id}-${area.year}`}
            area={area}
          />

        ))}

      </div>

      {/* SHOW MORE */}
      {categoryAreas.length > 5 && (

        <button

          onClick={() =>
            setShowAll(!showAll)
          }

          className="
            mt-4

            text-sm
            text-blue-400

            hover:text-blue-300

            transition-all
          "
        >

          {showAll
            ? 'Show Less'
            : 'Show More'
          }

        </button>

      )}

    </div>

  )
}