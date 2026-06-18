import { createContext, useContext, useState, useCallback } from 'react'

/**
 * useCompare — Context-based compare state shared across all pages.
 *
 * Exports:
 *   CompareProvider  — wrap App (or Router) with this
 *   useCompare()     — returns { compareAreas, toggleCompareArea, clearCompare }
 *
 * Reactivity guarantee:
 *   Every toggle returns a NEW array reference so React re-renders all consumers.
 *   Deduplication keyed on area_name only — no grid_id needed.
 */

const CompareContext = createContext(null)

export function CompareProvider({ children }) {
  const [compareAreas, setCompareAreas] = useState([])

  const toggleCompareArea = useCallback((area) => {
    setCompareAreas(prev => {
      const exists = prev.some(a => a.area_name === area.area_name)
      if (exists) {
        // Return new filtered array — new reference triggers re-render
        return prev.filter(a => a.area_name !== area.area_name)
      }
      // Cap at 4 areas
      if (prev.length >= 4) return prev
      // Spread into new array — new reference triggers re-render
      return [...prev, area]
    })
  }, [])

  const clearCompare = useCallback(() => setCompareAreas([]), [])

  return (
    <CompareContext.Provider value={{ compareAreas, toggleCompareArea, clearCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used inside <CompareProvider>')
  return ctx
}