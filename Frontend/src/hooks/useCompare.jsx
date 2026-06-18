import { useState, useCallback } from 'react'

/**
 * useCompare — tracks which areas are selected for comparison.
 *
 * KEY GUARANTEES:
 * 1. State is always a NEW array reference on every change → React re-renders all consumers.
 * 2. Deduplication and removal are both keyed on area_name (no grid_id needed).
 * 3. Never mutates the existing array — always spreads into a new one.
 */
export function useCompare() {
  // Always a fresh array reference on every toggle → triggers re-renders everywhere
  const [compareAreas, setCompareAreas] = useState([])

  const toggleCompareArea = useCallback((area) => {
    setCompareAreas(prev => {
      const exists = prev.some(a => a.area_name === area.area_name)
      if (exists) {
        // Remove — return a new filtered array
        return prev.filter(a => a.area_name !== area.area_name)
      } else {
        // Add (cap at 4) — return a new spread array
        if (prev.length >= 4) return prev
        return [...prev, area]
      }
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompareAreas([])
  }, [])

  return { compareAreas, toggleCompareArea, clearCompare }
}