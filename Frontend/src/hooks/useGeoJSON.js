/**
 * useGeoJSON — lazy-load, filter, and cache local GeoJSON boundary files.
 *
 * Files live in /public/geojson/*.geojson (served statically by Vite).
 * All coordinates are filtered to the Gandhinagar bounding box before
 * being returned, so stale Overpass data from other cities is silently
 * dropped.
 *
 * Usage:
 *   const { getBoundary, loading } = useGeoJSON()
 *   const { positions, type } = await getBoundary(areaName)
 *
 * Returned shape:
 *   { type: 'Polygon' | 'MultiPolygon' | null, positions: [...], bounds: L.LatLngBounds | null }
 *   null type means no boundary is available.
 */

import { useRef, useState, useCallback } from 'react'
import * as L from 'leaflet'

// ─────────────────────────────────────────────
// AREA → FILENAME MAPPING
// Add new entries here to extend boundary support.
// Keys are the area_name values from the backend API.
// ─────────────────────────────────────────────
export const AREA_BOUNDARIES = {
  // Named areas
  'Infocity':    'infocity.geojson',
  'GIFT City':   'GIFT_City.geojson',
'Gujarat International Finance Tec-City': 'GIFT_City.geojson',
  'Randesan':    'Randeson.geojson',
  'Randheja':    'Randheja.geojson',
  'Vavol':       'Vavol.geojson',
  'Sargasan':    'sargasan.geojson',
  'Chiloda':     'Chiloda.geojson',
  'Dholakuva':   'Dholakuva.geojson',
  'Indroda':     'Indroda.geojson',
  'Pethapur':    'Pethapur.geojson',
  'GIDC':        'GIDC.geojson',

  // Sectors with confirmed Gandhinagar features
  'Sector 1':    'Sector 1.geojson',
  'Sector 2':    'Sector 2.geojson',
  'Sector 3':    'Sector 3.geojson',
  'Sector 4':    'Sector 4.geojson',
  'Sector 5':    'Sector 5.geojson',
  'Sector 6':    'Sector 6.geojson',
  'Sector 8':    'Sector 8.geojson',
  'Sector 10':   'Sector 10.geojson',
  'Sector 21':   'Sector 21.geojson',

  // Sectors present in data but sparse — will show OSM fallback
  'Sector 7':    'Sector 7.geojson',
  'Sector 9':    'Sector 9.geojson',
  'Sector 11':   'Sector 11.geojson',
  'Sector 12':   'Sector 12.geojson',
  'Sector 13':   'Sector 13.geojson',
  'Sector 14':   'Sector 14.geojson',
  'Sector 15':   'Sector 15.geojson',
  'Sector 16':   'Sector 16.geojson',
  'Sector 17':   'Sector 17.geojson',
  'Sector 18':   'Sector 18.geojson',
  'Sector 19':   'Sector 19.geojson',
  'Sector 20':   'Sector 20.geojson',
  'Sector 22':   'Sector 22.geojson',
  'Sector 23':   'Sector 23.geojson',
  'Sector 24':   'Sector 24.geojson',
  'Sector 25':   'Sector 25.geojson',
  'Sector 26':   'Sector 26.geojson',
  'Sector 27':   'Sector 27.geojson',
  'Sector 28':   'Sector 28.geojson',
  'Sector 29':   'Sector 29.geojson',
  'Sector 30':   'Sector 30.geojson',
}

// Gandhinagar bounding box — tighter than Gujarat to filter out junk
const GNR_BOUNDS = {
  lonMin: 72.40, lonMax: 73.10,
  latMin: 22.80, latMax: 23.60,
}

function coordInGandhinagar([lon, lat]) {
  return (
    lon >= GNR_BOUNDS.lonMin && lon <= GNR_BOUNDS.lonMax &&
    lat >= GNR_BOUNDS.latMin && lat <= GNR_BOUNDS.latMax
  )
}

// Convert GeoJSON [lon, lat] → Leaflet [lat, lon]
function flip([lon, lat]) { return [lat, lon] }

function ringToLeaflet(ring) { return ring.map(flip) }

/**
 * Parse a FeatureCollection into a unified list of Leaflet ring arrays.
 * Returns { positions: [[ring], ...] for MultiPolygon-like, bounds }.
 */
function parseFeatureCollection(fc) {
  if (!fc?.features?.length) return null

  const allPolygons = [] // each item is an array of rings [[lat,lon],...]

  for (const feature of fc.features) {
    const geom = feature?.geometry
    if (!geom) continue

    if (geom.type === 'Polygon') {
      // Filter: at least the outer ring must be in Gandhinagar
      const outer = geom.coordinates[0]
      if (!outer?.length) continue
      if (!coordInGandhinagar(outer[0])) continue
      allPolygons.push(geom.coordinates.map(ringToLeaflet))
    }

    if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        const outer = poly[0]
        if (!outer?.length) continue
        if (!coordInGandhinagar(outer[0])) continue
        allPolygons.push(poly.map(ringToLeaflet))
      }
    }
  }

  if (!allPolygons.length) return null

  // Build a Leaflet bounds object from all rings
  const allPoints = allPolygons.flat(2)
  const lats = allPoints.map(p => p[0])
  const lons = allPoints.map(p => p[1])
  const bounds = L.latLngBounds(
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)]
  )

  return { positions: allPolygons, bounds }
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────
export function useGeoJSON() {
  const cache = useRef({})          // area_name → parsed result or 'none'
  const [loading, setLoading] = useState(false)

  const getBoundary = useCallback(async (areaName) => {
    if (!areaName) return null

    // Exact-match first, then case-insensitive fallback
    const filename =
      AREA_BOUNDARIES[areaName] ??
      AREA_BOUNDARIES[
        Object.keys(AREA_BOUNDARIES).find(
          k => k.toLowerCase() === areaName.toLowerCase()
        )
      ]

    if (!filename) return null                    // no mapping
    if (cache.current[areaName] !== undefined) {
      return cache.current[areaName] === 'none' ? null : cache.current[areaName]
    }

    setLoading(true)
    try {
      const res = await fetch(`/geojson/${encodeURIComponent(filename)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const fc = await res.json()
      const parsed = parseFeatureCollection(fc)
      cache.current[areaName] = parsed ?? 'none'
      return parsed
    } catch {
      cache.current[areaName] = 'none'
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * For compare mode: load multiple boundaries in parallel.
   * Returns an array of { areaName, boundary } objects.
   */
  const getMultipleBoundaries = useCallback(async (areaNames) => {
    const results = await Promise.all(
      areaNames.map(async (name) => ({
        areaName: name,
        boundary: await getBoundary(name),
      }))
    )
    return results.filter(r => r.boundary !== null)
  }, [getBoundary])

  return { getBoundary, getMultipleBoundaries, loading }
}

// ─────────────────────────────────────────────
// COMPARE MODE COLOUR PALETTE (re-exported for consumers)
// ─────────────────────────────────────────────
export const COMPARE_COLORS = [
  '#6366f1',   // indigo
  '#ec4899',   // pink
  '#14b8a6',   // teal
  '#f59e0b',   // amber
]
