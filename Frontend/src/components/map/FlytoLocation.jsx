import { useEffect } from 'react'
import { useMap as useLeafletMap } from 'react-leaflet'

export default function FlyToLocation({
  selectedArea,
}) {

  const map = useLeafletMap()

  useEffect(() => {

    if (!selectedArea) return

    map.flyTo(
      [selectedArea.lat, selectedArea.lng],
      14,
      {
        duration: 1.8,
      }
    )

  }, [selectedArea, map])

  return null
}