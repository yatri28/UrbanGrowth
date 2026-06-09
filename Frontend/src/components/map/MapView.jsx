/**
 * MapView — used on the Overview / City Pulse page.
 * Upgraded to use local GeoJSON boundaries from useGeoJSON hook,
 * falling back to a centroid-based rectangle if no file exists.
 */
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Popup,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { useMap as useMapState } from '../../hooks/useMap'
import { useAreas } from '../../hooks/useAreas'
import { useGeoJSON } from '../../hooks/useGeoJSON'
import AreaBoundary from './AreaBoundary'
import FitBounds from './FitBounds'

const HALF_LAT = 0.005
const HALF_LON = 0.0065

const colors = {
  high:   '#ef4444',
  medium: '#f97316',
  low:    '#10b981',
}

function fallbackPolygon(lat, lon) {
  return [[
    [lat + HALF_LAT, lon - HALF_LON],
    [lat + HALF_LAT, lon + HALF_LON],
    [lat - HALF_LAT, lon + HALF_LON],
    [lat - HALF_LAT, lon - HALF_LON],
  ]]
}

function FlyToArea({ area, hasBounds }) {
  const map = useMap()
  useEffect(() => {
    if (!hasBounds && area?.center_lat && area?.center_lon) {
      map.flyTo([area.center_lat, area.center_lon], 15, { duration: 1.5 })
    }
  }, [area?.area_name, hasBounds])
  return null
}

export default function MapView() {
  const { selectedArea, setSelectedArea } = useMapState()
  const { filteredAreas, areas }          = useAreas()
  const { getBoundary }                   = useGeoJSON()

  const [boundary, setBoundary]   = useState(null)
  const [bounds, setBounds]       = useState(null)
  const [loadingBoundary, setLoadingBoundary] = useState(false)

  useEffect(() => {
    if (!selectedArea) {
      setBoundary(null)
      setBounds(null)
      return
    }

    const name = selectedArea.area_name
    if (!name) return

    setBoundary(null)
    setBounds(null)
    setLoadingBoundary(true)

    getBoundary(name).then((result) => {
      if (result) {
        setBoundary(result)
        setBounds(result.bounds)
      } else {
        // Fallback — centroid rectangle
        const allGridIds = selectedArea.grid_ids ?? [selectedArea.grid_id]
        const coordsMap  = {}
        areas.forEach(a => { if (a.grid_id) coordsMap[a.grid_id] = { lat: a.center_lat, lon: a.center_lon } })

        const rects = allGridIds
          .map(gid => coordsMap[gid])
          .filter(Boolean)
          .map(c => fallbackPolygon(c.lat, c.lon))

        setBoundary({ positions: rects, isFallback: true })
        setBounds(null)
      }
      setLoadingBoundary(false)
    })
  }, [selectedArea?.area_name])

  const growthTypeSelected = selectedArea?.growth_class?.toLowerCase()

  function renderFallbackBoundary() {
    if (!boundary?.isFallback || !selectedArea) return null
    const color = colors[growthTypeSelected] ?? '#94a3b8'
    const pathOptions = {
      color, fillColor: color, fillOpacity: 0.12,
      weight: 2, dashArray: '6 4', lineCap: 'round',
    }
    return boundary.positions.map((rings, i) =>
      <Polygon key={`fb-${i}`} positions={rings} pathOptions={pathOptions} />
    )
  }

  return (
    <MapContainer
      center={[23.2156, 72.6369]}
      zoom={12}
      zoomControl={false}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {bounds
        ? <FitBounds bounds={bounds} />
        : <FlyToArea area={selectedArea} hasBounds={false} />
      }

      {filteredAreas.map((area) => {
        if (!area.center_lat || !area.center_lon) return null
        const growthType = area.growth_class?.toLowerCase()
        const color      = colors[growthType] ?? '#94a3b8'
        const allGridIds = area.grid_ids ?? [area.grid_id]
        const isSelected = allGridIds.includes(selectedArea?.grid_id)

        return (
          <CircleMarker
            key={`dot-${area.grid_id}-${area.year}`}
            center={[area.center_lat, area.center_lon]}
            radius={isSelected ? 9 : 6}
            eventHandlers={{ click: () => setSelectedArea(area) }}
            pathOptions={{
              fillColor:   color,
              color:       '#ffffff',
              fillOpacity: isSelected ? 1 : 0.85,
              weight:      isSelected ? 2 : 1,
            }}
          >
            <Popup className="map-popup">
              <PopupContent
                area={area}
                growthType={growthType}
                loadingBoundary={isSelected && loadingBoundary}
              />
            </Popup>
          </CircleMarker>
        )
      })}

      {/* GeoJSON boundary (real) */}
      {boundary && !boundary.isFallback && selectedArea && (
        <AreaBoundary
          key={`overview-${selectedArea.area_name}`}
          boundary={boundary}
          growthClass={growthTypeSelected}
          areaName={selectedArea.area_name}
          confidence={selectedArea.confidence}
          builtPercent={selectedArea.built_percent}
        />
      )}

      {/* Fallback rectangle */}
      {renderFallbackBoundary()}

    </MapContainer>
  )
}

function PopupContent({ area, growthType, loadingBoundary }) {
  return (
    <div className="min-w-[220px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">{area.area_name}</h2>
          <p className="text-xs text-slate-400">
            {loadingBoundary ? '⏳ Loading boundary...' : area.year}
          </p>
        </div>
        <div className={`
          px-3 py-1 rounded-xl text-xs font-medium
          ${growthType === 'high'   ? 'bg-red-500/20 text-red-400'
          : growthType === 'medium' ? 'bg-yellow-500/20 text-yellow-300'
          :                           'bg-emerald-500/20 text-emerald-400'}`}>
          {growthType?.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3">
          <p className="text-[11px] text-slate-500">Year</p>
          <h3 className="text-lg font-bold mt-1">{area.year}</h3>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-[11px] text-slate-500">Confidence</p>
          <h3 className="text-lg font-bold mt-1">
            {area.confidence ? `${(area.confidence * 100).toFixed(0)}%` : 'N/A'}
          </h3>
        </div>
      </div>

      {area.ndvi_mean != null && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3">
            <p className="text-[11px] text-slate-500">NDVI</p>
            <h3 className="text-lg font-bold mt-1">{Number(area.ndvi_mean).toFixed(2)}</h3>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="text-[11px] text-slate-500">Built-up</p>
            <h3 className="text-lg font-bold mt-1">
              {area.built_percent ? `${(Number(area.built_percent) * 100).toFixed(0)}%` : 'N/A'}
            </h3>
          </div>
        </div>
      )}
    </div>
  )
}
