from fastapi import APIRouter
import pandas as pd

router = APIRouter()

# LOAD HISTORICAL DATASET
df = pd.read_csv(
    "historical_2016_2024.csv"
)

@router.get("/history/{grid_id}")

def get_history(
    grid_id: str
):

    area_df = df[
        df["grid_id"] == grid_id
    ].sort_values("year")

    return {

        "grid_id": grid_id,

        "history": area_df[
            [
                "year",
                "ndvi_mean",
                "built_percent",
                "nighttime_mean",
            ]
        ].to_dict(orient="records")

    }