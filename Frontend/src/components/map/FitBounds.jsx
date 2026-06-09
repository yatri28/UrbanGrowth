/**
 * FitBounds — inner Leaflet component that calls fitBounds() whenever
 * `bounds` changes, with a smooth flyToBounds animation.
 *
 * Must be rendered inside <MapContainer>.
 */

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

export default function FitBounds({ bounds, padding = [40, 40], duration = 1.2 }) {
  const map = useMap()
  const prev = useRef(null)

  useEffect(() => {
    if (!bounds || !bounds.isValid()) return

    // Skip if identical bounds (prevents thrashing on re-renders)
    if (prev.current && bounds.equals(prev.current, 0.0001)) return
    prev.current = bounds

    try {
      map.flyToBounds(bounds, {
        paddingTopLeft:    [padding[0], padding[1]],
        paddingBottomRight:[padding[0], padding[1]],
        duration,
        easeLinearity: 0.25,
        maxZoom: 16,
      })
    } catch {
      // Fallback — instant fit if animation fails
      map.fitBounds(bounds, { padding })
    }
  }, [bounds])

  return null
}
