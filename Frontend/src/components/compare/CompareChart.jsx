/* =======================================================
   IMPORTS
======================================================= */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts'

import {
  useEffect,
  useState,
} from 'react'

import { useCompare } from '../../hooks/useCompare'
import { useYear } from '../../hooks/useYear'

import {
  fetchHistory,
} from '../../services/historyApi'

/* =======================================================
   COLORS
======================================================= */

const chartColors = [
  '#ff4d6d',
  '#3b82f6',
  '#06d6a0',
  '#ffb703',
]

/* =======================================================
   MAIN COMPONENT
======================================================= */

export default function CompareChart() {

  const {
    compareAreas,
  } = useCompare()

  const {
    selectedYear,
  } = useYear()

  const isHistorical =
    selectedYear <= 2025

  // EMPTY STATE
  if (compareAreas.length === 0) {

    return (

      <div className="
        glass
        rounded-3xl
        p-12
        text-center
      ">

        <h2 className="
          text-2xl
          font-semibold
        ">
          No Areas Selected
        </h2>

        <p className="
          text-slate-400
          mt-3
        ">
          Select areas from dashboard
        </p>

      </div>

    )
  }

  return (

    <>

      {isHistorical ? (

        <HistoricalCharts
          compareAreas={compareAreas}
        />

      ) : (

        <PredictionInsights
          compareAreas={compareAreas}
          selectedYear={selectedYear}
        />

      )}

    </>

  )
}

/* =======================================================
   HISTORICAL CHARTS
======================================================= */

function HistoricalCharts({
  compareAreas,
}) {

  const [
    historicalData,
    setHistoricalData,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  /* ===============================
     FETCH HISTORY
  =============================== */

  useEffect(() => {

    async function loadData() {

      try {

        setLoading(true)

        const results =
          await Promise.all(

            compareAreas.map(

              (area) =>

                fetchHistory(
                  area.grid_id
                )

            )
          )

        setHistoricalData(results)

      }

      catch (err) {

        console.error(err)

      }

      finally {

        setLoading(false)

      }
    }

    loadData()

  }, [compareAreas])

  /* ===============================
     LOADING
  =============================== */

  if (loading) {

    return (

      <div className="
        glass
        rounded-3xl
        p-12
        text-center
      ">

        <h2 className="
          text-2xl
          font-semibold
        ">
          Loading Historical Analytics...
        </h2>

      </div>

    )
  }

  /* =====================================================
     NDVI DATA
  ===================================================== */

  const ndviData = []

  historicalData.forEach((areaData) => {

    areaData.history.forEach((item) => {

      let row = ndviData.find(
        (r) => r.year === item.year
      )

      if (!row) {

        row = {
          year: item.year,
        }

        ndviData.push(row)
      }

      const area =
        compareAreas.find(
          (a) =>
            a.grid_id === areaData.grid_id
        )

      // SAFE CHECK
      if (area) {

        row[area.area_name] =
          item.ndvi_mean
      }

    })
  })

  /* =====================================================
     BUILT-UP DATA
  ===================================================== */

  const builtData = []

  historicalData.forEach((areaData) => {

    areaData.history.forEach((item) => {

      let row = builtData.find(
        (r) => r.year === item.year
      )

      if (!row) {

        row = {
          year: item.year,
        }

        builtData.push(row)
      }

      const area =
        compareAreas.find(
          (a) =>
            a.grid_id === areaData.grid_id
        )

      // SAFE CHECK
      if (area) {

        row[area.area_name] =
          item.built_percent
      }

    })
  })

  /* =====================================================
     NIGHTTIME DATA
  ===================================================== */

  const nightData = []

  historicalData.forEach((areaData) => {

    areaData.history.forEach((item) => {

      let row = nightData.find(
        (r) => r.year === item.year
      )

      if (!row) {

        row = {
          year: item.year,
        }

        nightData.push(row)
      }

      const area =
        compareAreas.find(
          (a) =>
            a.grid_id === areaData.grid_id
        )

      // SAFE CHECK
      if (area) {

        row[area.area_name] =
          item.nighttime_norm
      }

    })
  })

  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="
      w-full
      grid
      grid-cols-2
      gap-6
      pb-10
    ">

      {/* NDVI */}
      <SimpleLineChart
        title="NDVI Vegetation Analysis"
        subtitle="Real historical vegetation trend"
        data={ndviData}
        compareAreas={compareAreas}
      />

      {/* BUILT-UP */}
      <SimpleLineChart
        title="Built-up Expansion"
        subtitle="Real historical urbanization"
        data={builtData}
        compareAreas={compareAreas}
      />

      {/* NIGHTTIME */}
      <SimpleLineChart
        title="Nighttime Light Intensity"
        subtitle="Real historical economic activity"
        data={nightData}
        compareAreas={compareAreas}
      />

      {/* OVERALL */}
      <OverallBarChart
        compareAreas={compareAreas}
      />

    </div>

  )
}

/* =======================================================
   PREDICTION MODE
======================================================= */

function PredictionInsights({
  compareAreas,
  selectedYear,
}) {

  return (

    <div className="
      glass
      rounded-3xl
      p-10
    ">

      <h2 className="
        text-2xl
        font-bold
      ">
        Future Prediction Analytics
      </h2>

      <p className="
        text-slate-400
        mt-3
      ">
        Forecast intelligence for
        year {selectedYear}
      </p>

    </div>

  )
}

/* =======================================================
   SIMPLE LINE CHART
======================================================= */

function SimpleLineChart({
  title,
  subtitle,
  data,
  compareAreas,
}) {

  return (

    <ChartCard
      title={title}
      subtitle={subtitle}
    >

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />

          <XAxis
            dataKey="year"
            stroke="#94a3b8"
          />

          <YAxis
            stroke="#94a3b8"
          />

          <Tooltip />

          {compareAreas.map(
            (area, index) => (

              <Line
                key={area.grid_id}
                type="monotone"
                dataKey={area.area_name}
                stroke={chartColors[index]}
                strokeWidth={3}
                dot={{ r: 4 }}
              />

            )
          )}

        </LineChart>

      </ResponsiveContainer>

    </ChartCard>

  )
}

/* =======================================================
   OVERALL BAR CHART
======================================================= */

function OverallBarChart({
  compareAreas,
}) {

  const data = compareAreas.map(
    (area) => ({

      name: area.area_name,

      growth:
        area.growth_class
          ?.toLowerCase() === 'high'
          ? 95
          : area.growth_class
              ?.toLowerCase() === 'medium'
          ? 70
          : 45,
    })
  )

  return (

    <ChartCard
      title="Overall Urban Growth"
      subtitle="Combined prediction score"
    >

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <BarChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
          />

          <YAxis
            stroke="#94a3b8"
          />

          <Tooltip />

          <Bar
            dataKey="growth"
            fill="#3b82f6"
            radius={[10, 10, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </ChartCard>

  )
}

/* =======================================================
   CHART CARD
======================================================= */

function ChartCard({
  title,
  subtitle,
  children,
}) {

  return (

    <div className="
      glass
      rounded-3xl
      p-6
      min-h-[420px]
      w-full
      flex
      flex-col
    ">

      <div className="mb-6">

        <h2 className="
          text-xl
          font-semibold
        ">
          {title}
        </h2>

        <p className="
          text-sm
          text-slate-400
          mt-1
        ">
          {subtitle}
        </p>

      </div>

      <div className="
        flex-1
        min-h-[300px]
      ">
        {children}
      </div>

    </div>

  )
}