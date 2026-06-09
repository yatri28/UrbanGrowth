import {
  createContext,
  useContext,
  useState,
} from 'react'

const YearContext = createContext()

export function YearProvider({
  children,
}) {

  // Default to 2024 — the last year with real historical data
  const [selectedYear, setSelectedYear] =
    useState(2024)

  return (

    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
      }}
    >

      {children}

    </YearContext.Provider>

  )
}

export function useYear() {
  return useContext(YearContext)
}