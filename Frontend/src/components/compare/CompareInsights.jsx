import { useCompare } from '../../hooks/useCompare'

const typeColors = {
  high:
    'text-red-400 border-red-500/30 bg-red-500/10',

  medium:
    'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',

  low:
    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
}

export default function CompareInsights() {

  const {
    compareAreas,
  } = useCompare()

  return (

    <div className="
      grid
      grid-cols-3
      gap-6
      mb-6
    ">

      {compareAreas.map((area) => {

        const growthType =
          area.growth_class
            ?.toLowerCase()

        return (

          <div

            key={area.grid_id}

            className="
              glass
              rounded-3xl
              p-5
            "
          >

            {/* TOP */}
            <div className="mb-5">

              <h2 className="
                text-2xl
                font-bold
              ">
                {area.area_name}
              </h2>

              <p className="
                text-slate-400
                mt-1
              ">
                Grid:
                {' '}
                {area.grid_id}
              </p>

            </div>

            {/* TYPE */}
            <div className={`

              inline-flex

              px-3
              py-1

              rounded-xl

              border

              text-sm
              font-medium

              mb-5

              ${typeColors[growthType]}

            `}>

              {area.growth_class
                ?.toUpperCase()}

            </div>

            {/* INFO */}
            <div className="
              space-y-4
            ">



              <InfoRow
                label="Prediction Year"
                value={area.year}
              />

              <InfoRow
                label="Coordinates"
                value={`
                  ${Number(
                    area.center_lat
                  ).toFixed(3)},
                  
                  ${Number(
                    area.center_lon
                  ).toFixed(3)}
                `}
              />

            </div>

            {/* BAR */}
            <div className="
              mt-6
            ">

              <div className="
                flex
                items-center
                justify-between
                mb-2
              ">

                <span className="
                  text-sm
                  text-slate-400
                ">
                  Model Confidence
                </span>

                <span className="
                  text-sm
                  font-semibold
                ">

                  {area.confidence
                    ? `${
                        Number(
                          area.confidence * 100
                        ).toFixed(1)
                      }%`
                    : 'N/A'}

                </span>

              </div>

              <div className="
                w-full
                h-2

                rounded-full

                bg-white/5

                overflow-hidden
              ">

                <div

                  className="
                    h-full
                    rounded-full
                    bg-yellow-400
                  "

                  style={{
                      width: `${
                      area.confidence * 100
                    }%`
                  }}
                />

              </div>

            </div>

          </div>

        )
      })}

    </div>

  )
}

function InfoRow({
  label,
  value,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
    ">

      <span className="
        text-slate-400
        text-sm
      ">
        {label}
      </span>

      <span className="
        text-sm
        font-semibold
      ">
        {value}
      </span>

    </div>

  )
}