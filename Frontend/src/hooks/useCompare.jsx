import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const CompareContext =
  createContext()

export function CompareProvider({
  children,
}) {

  const [
    compareAreas,
    setCompareAreas,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        'compareAreas'
      )

    return saved
      ? JSON.parse(saved)
      : []
  })

  // SAVE TO LOCAL STORAGE
  useEffect(() => {

    localStorage.setItem(

      'compareAreas',

      JSON.stringify(compareAreas)

    )

  }, [compareAreas])

  // TOGGLE AREA
  const toggleCompareArea = (
    area
  ) => {

    const exists =
      compareAreas.find(

        (a) =>

          a.grid_id === area.grid_id

      )

    if (exists) {

      setCompareAreas(

        compareAreas.filter(

          (a) =>

            a.grid_id !== area.grid_id

        )
      )

    }

    else {

      if (
        compareAreas.length >= 4
      ) return

      setCompareAreas([
        ...compareAreas,
        area,
      ])
    }
  }

  return (

    <CompareContext.Provider

      value={{

        compareAreas,

        toggleCompareArea,

      }}

    >

      {children}

    </CompareContext.Provider>

  )
}

export function useCompare() {

  return useContext(
    CompareContext
  )
}