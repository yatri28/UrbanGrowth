import { createContext, useContext, useState } from 'react'

const MapContext = createContext()

export function MapProvider({ children }) {

  const [selectedArea, setSelectedArea] = useState(null)

  return (
    <MapContext.Provider
      value={{
        selectedArea,
        setSelectedArea,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  return useContext(MapContext)
}