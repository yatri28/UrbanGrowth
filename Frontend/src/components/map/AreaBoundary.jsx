/**
 * AreaBoundary — renders a single area's GeoJSON polygons on the map
 * with a premium GIS-style appearance and smooth CSS animation.
 *
 * Props:
 *   boundary   — parsed result from useGeoJSON: { positions, bounds }
 *   growthClass — 'high' | 'medium' | 'low'
 *   isCompare  — boolean, renders in compare palette colour instead
 *   compareColor — hex string override (compare mode)
 *   areaName   — for tooltip / key
 *   onHover    — (areaName | null) => void
 */

import { Polygon, Tooltip } from 'react-leaflet'
import { useMemo } from 'react'

// Growth-class colour tokens — vivid but not harsh
const GROWTH_COLORS = {
  high:   '#ef4444',   // vibrant red
  medium: '#f97316',   // orange
  low:    '#10b981',   // emerald
  unknown:'#94a3b8',   // slate
}

// Compare-mode palette — up to 4 simultaneous areas
export const COMPARE_COLORS = [
  '#6366f1',   // indigo
  '#ec4899',   // pink
  '#14b8a6',   // teal
  '#f59e0b',   // amber
]

export default function AreaBoundary({
  boundary,
  growthClass,
  isCompare = false,
  compareColor,
  areaName = '',
  confidence,
  builtPercent,
  onHover,
}) {
  const baseColor = isCompare
    ? (compareColor ?? COMPARE_COLORS[0])
    : (GROWTH_COLORS[growthClass?.toLowerCase()] ?? GROWTH_COLORS.unknown)

  // Path options — premium GIS look
  const pathOptions = useMemo(() => ({
    color:       baseColor,
    fillColor:   baseColor,
    fillOpacity: 0.12,
    weight:      2.5,
    opacity:     0.9,
    lineCap:     'round',
    lineJoin:    'round',
    // Subtle glow via multiple strokes — rendered via className + CSS
    className:   `area-boundary area-boundary--${growthClass?.toLowerCase() ?? 'unknown'}`,
  }), [baseColor, growthClass])

  const hoverPathOptions = useMemo(() => ({
    ...pathOptions,
    fillOpacity: 0.28,
    weight:      3.5,
    opacity:     1,
  }), [pathOptions])

  if (!boundary?.positions) return null

  // Render all polygons in the boundary
  return (
    <>
      {boundary.positions.map((rings, polyIdx) => (
        <Polygon
          key={`${areaName}-${polyIdx}`}
          positions={rings}
          pathOptions={pathOptions}
          eventHandlers={{
            mouseover: (e) => {
              e.target.setStyle(hoverPathOptions)
              onHover?.(areaName)
            },
            mouseout: (e) => {
              e.target.setStyle(pathOptions)
              onHover?.(null)
            },
          }}
        >
          <Tooltip sticky className="boundary-tooltip">
            <div className="boundary-tooltip__inner">
              <div className="boundary-tooltip__name">{areaName}</div>
              <div className="boundary-tooltip__meta">
                <span
                  className={`boundary-tooltip__badge boundary-tooltip__badge--${growthClass?.toLowerCase()}`}
                >
                  {growthClass?.toUpperCase() ?? 'UNKNOWN'} GROWTH
                </span>
                {confidence != null && (
                  <span className="boundary-tooltip__stat">
                    {(confidence * 100).toFixed(0)}% conf
                  </span>
                )}
                {builtPercent != null && (
                  <span className="boundary-tooltip__stat">
                    {(builtPercent * 100).toFixed(0)}% built
                  </span>
                )}
              </div>
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  )
}
