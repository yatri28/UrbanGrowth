import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useYear } from './useYear'
import { fetchAreas } from '../services/api'

const AreasContext = createContext()

export function AreasProvider({ children }) {

  const { selectedYear } = useYear()

  const [areas, setAreas]               = useState([])
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    async function loadAreas() {
      setLoading(true)
      const data = await fetchAreas(selectedYear)
      if (data?.areas) setAreas(data.areas)
      setLoading(false)
    }
    loadAreas()
  }, [selectedYear])

  // ── GROUP duplicate area_names into one card ──────────────────────
  // Multiple grid_ids can share the same area_name (e.g. "sector 2"
  // spans grid_0_6 and grid_0_7). For the UI we collapse them into
  // one card using the dominant growth_class (highest severity) and
  // store all grid_ids so map highlighting and compare still work.
  const groupedAreas = (() => {
    const map = {}

    areas.forEach((area) => {
      // Normalise name for grouping (trim + lowercase key)
      const key = area.area_name?.trim().toLowerCase()
      if (!key) return

      if (!map[key]) {
        // First grid for this area — use it as the base
        map[key] = {
          ...area,
          area_name: area.area_name?.trim(), // keep original casing
          grid_ids:  [area.grid_id],         // all grids for this area
        }
      } else {
        // Another grid with the same name — merge
        map[key].grid_ids.push(area.grid_id)

        // Use dominant growth_class: high > medium > low
        const rank = { high: 3, medium: 2, low: 1 }
        const existing = map[key].growth_class?.toLowerCase()
        const incoming = area.growth_class?.toLowerCase()
        if ((rank[incoming] ?? 0) > (rank[existing] ?? 0)) {
          map[key].growth_class = area.growth_class
          map[key].confidence   = area.confidence
        }

        // Average confidence across grids
        if (area.confidence != null && map[key].confidence != null) {
          map[key].confidence = (
            (map[key].confidence * (map[key].grid_ids.length - 1) + area.confidence)
            / map[key].grid_ids.length
          )
        }
      }
    })

    return Object.values(map)
  })()

  // ── Filter grouped areas by search + growth class ─────────────────
  const filteredAreas = groupedAreas.filter((area) => {
    const matchesSearch =
      area.area_name?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      activeFilter === 'all'
        ? true
        : area.growth_class?.toLowerCase() === activeFilter

    return matchesSearch && matchesFilter
  })

  return (
    <AreasContext.Provider
      value={{
        areas,
        groupedAreas,
        filteredAreas,
        loading,
        search,
        setSearch,
        activeFilter,
        setActiveFilter,
      }}
    >
      {children}
    </AreasContext.Provider>
  )
}

export function useAreas() {
  return useContext(AreasContext)
}