import os
from urllib import response

from fastapi import FastAPI
from flask import app
from matplotlib import lines
import pandas as pd
from scipy import stats
from fastapi.middleware.cors import CORSMiddleware
from routes.history import router as history_router
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)

genai.configure(
    api_key=  os.getenv("GEMINI_API_KEY")
)
model = genai.GenerativeModel("gemini-2.5-flash")

@app.post("/compare-summary")
def compare_summary(data: dict):

    areas = data.get("areas", [])

    if len(areas) < 2:
        return {
            "summary": "Please select at least two areas for comparison."
        }

    prompt = """
Compare the following Gandhinagar areas.

"""

    for area in areas:
        prompt += f"""
Area Name: {area['name']}
Built-up: {area['built']}
Green Cover: {area['ndvi']}
Night Activity: {area['night']}

"""

    prompt += """

Generate exactly 6 bullet points.

Instructions:
- Compare all selected areas.
- Identify which area appears most developed.
- Identify which area appears greenest.
- Identify which area is most active at night.
- Mention interesting differences between areas.
- Use very simple language.
- Maximum 20 words per bullet.
- No percentages.
- No technical terms like NDVI.
- No headings.
- Return bullet points only.
- Start every line with "•".
"""

    try:
        response = model.generate_content(prompt)

        return {
            "summary": response.text
        }

    except Exception as e:
        return {
            "summary": f"Unable to generate AI summary: {str(e)}"
        }

def area_overview(area_name: str):
    prompt = f"""
    Give exactly 3 short bullet points about the Gandhinagar area:

    {area_name}

    Requirements:

    - 1 sentence each
    - maximum 20 words each
    - mention location, connectivity, importance, residential/commercial value
    - do not mention percentages
    - do not mention AI
    - return only bullet points
    """
    response = model.generate_content(prompt)
    lines = [
    line.replace("*","").replace("-","").strip()
    for line in response.text.split("\n")
    if line.strip()
    ]

    return {
        "points": lines[:3]
    }   
    


# ── LOAD DATA ──────────────────────────────────────────

historical_df = pd.read_csv("historical_2016_2024.csv")
prediction_df = pd.read_csv("final_urban_growth_predictions_2025_2040.csv")

# Attach coordinates to prediction data
coords = (
    historical_df[["grid_id", "center_lat", "center_lon"]]
    .drop_duplicates("grid_id")
)
prediction_df = prediction_df.merge(coords, on="grid_id", how="left")

print("✅ Historical:", historical_df.shape, sorted(historical_df['year'].unique().tolist()))
print("✅ Prediction:", prediction_df.shape, sorted(prediction_df['year'].unique().tolist()))

# ── HOME ───────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Urban Growth Backend Running"}

# ── AREAS BY YEAR ──────────────────────────────────────

@app.get("/areas/{year}")
def get_areas(year: int):
    if year <= 2024:
        filtered_df = historical_df[historical_df["year"] == year]
        mode = "historical"
    else:
        filtered_df = prediction_df[prediction_df["year"] == year]
        mode = "prediction"

    return {
        "mode": mode,
        "year": year,
        "count": len(filtered_df),
        "areas": filtered_df.to_dict(orient="records"),
    }

# ── PREDICTION TREND FOR A GRID ────────────────────────

@app.get("/prediction-trend/{grid_id}")
def get_prediction_trend(grid_id: str):

    hist_rows = (
        historical_df[historical_df["grid_id"] == grid_id]
        .sort_values("year")
        .tail(3)
    )

    pred_rows = (
        prediction_df[prediction_df["grid_id"] == grid_id]
        .sort_values("year")
    )

    built_rate = {"high": 0.010, "medium": 0.008, "low": 0.003}
    ndvi_rate  = {"high": 0.005, "medium": 0.003, "low": 0.001}

    if len(hist_rows) > 0:
        last       = hist_rows.iloc[-1]
        base_built = float(last["built_percent"])
        base_ndvi  = float(last["ndvi_mean"])
        base_night = float(last["nighttime_mean"])
        base_year  = int(last["year"])
    else:
        base_built = 0.3
        base_ndvi  = 0.35
        base_night = 0.5
        base_year  = 2024

    projected = []
    for _, row in pred_rows.iterrows():
        gc    = str(row["growth_class"]).lower()
        delta = int(row["year"]) - base_year
        projected.append({
            "year":           int(row["year"]),
            "growth_class":   row["growth_class"],
            "confidence":     round(float(row["confidence"]) * 100, 1),
            "built_percent":  round(min(0.98, base_built + delta * built_rate.get(gc, 0.005)), 4),
            "ndvi_mean":      round(max(0.05, base_ndvi  - delta * ndvi_rate.get(gc, 0.003)), 4),
            "nighttime_mean": round(
                base_night + delta * 0.5,
                2
            )
        })

    hist_list = hist_rows[
        ["year", "ndvi_mean", "built_percent", "nighttime_mean", "growth_class"]
    ].to_dict(orient="records")

    for h in hist_list:
        h["growth_class"] = str(h["growth_class"]).lower()
        h["confidence"]   = None

    return {
        "grid_id":    grid_id,
        "historical": hist_list,
        "prediction": projected,
    }

# ── GLOBAL PREDICTION STATS FOR A YEAR ─────────────────

@app.get("/prediction-stats/{year}")
def get_prediction_stats(year: int):
    df = prediction_df[prediction_df["year"] == year]

    class_counts = (
        df["growth_class"].str.lower()
        .value_counts()
        .to_dict()
    )

    conf_by_class = (
        df.groupby(df["growth_class"].str.lower())["confidence"]
        .mean()
        .mul(100)
        .round(1)
        .to_dict()
    )

    return {
        "year":                    year,
        "total_areas":             len(df),
        "class_counts":            class_counts,
        "avg_confidence_by_class": conf_by_class,
    }

# ── CITY-WIDE HISTORICAL AGGREGATES ────────────────────
# Used by Overview and Forecast pages instead of hardcoded arrays

@app.get("/city-history")
def get_city_history():
    """Year-by-year city-wide averages: built_percent, ndvi_mean, nighttime_mean + growth class counts."""
    agg = (
        historical_df
        .groupby("year")
        .agg(
            built=("built_percent",  "mean"),
            ndvi= ("ndvi_mean",      "mean"),
            night=("nighttime_mean", "mean"),
        )
        .reset_index()
    )
    agg["built"] = (agg["built"] * 100).round(1)
    agg["ndvi"]  = (agg["ndvi"]  * 100).round(1)
    agg["night"] = agg["night"].round(1)

    # Growth class counts per year
    gc_counts = (
        historical_df
        .groupby(["year", "growth_class"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    # Ensure all three columns exist
    for col in ["high", "medium", "low"]:
        if col not in gc_counts.columns:
            gc_counts[col] = 0

    merged = agg.merge(gc_counts[["year", "high", "medium", "low"]], on="year", how="left")
    merged["year"] = merged["year"].astype(int)

    return {"history": merged.to_dict(orient="records")}


# ── CITY-WIDE PREDICTION AGGREGATES ────────────────────

@app.get("/city-predictions")
def get_city_predictions():
    """Year-by-year prediction class counts + avg confidence for 2025–2040."""
    gc_counts = (
        prediction_df
        .groupby(["year", "growth_class"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    for col in ["high", "medium", "low"]:
        if col not in gc_counts.columns:
            gc_counts[col] = 0

    avg_conf = (
        prediction_df
        .groupby("year")["confidence"]
        .mean()
        .mul(100)
        .round(1)
        .reset_index()
        .rename(columns={"confidence": "conf"})
    )

    merged = gc_counts.merge(avg_conf, on="year", how="left")
    merged["year"] = merged["year"].astype(int)

    return {"predictions": merged[["year", "high", "medium", "low", "conf"]].to_dict(orient="records")}


# ── TOP GROWING AREAS ──────────────────────────────────

@app.get("/top-growing")
def get_top_growing(n: int = 8):
    """Top N areas by built-up % change from earliest to latest historical year."""

    years = sorted(historical_df["year"].unique())
    first_year, last_year = years[0], years[-1]

    df_first = historical_df[
        historical_df["year"] == first_year
    ].set_index("grid_id")

    df_last = historical_df[
        historical_df["year"] == last_year
    ].set_index("grid_id")

    common = df_first.index.intersection(df_last.index)

    result = df_last.loc[common].copy()

    result["change"] = (
        (
            df_last.loc[common, "built_percent"]
            - df_first.loc[common, "built_percent"]
        ) * 100
    ).round(2)

    # Remove duplicate area names
    result = (
        result.reset_index()
        .groupby("area_name", as_index=False)
        .agg({
            "grid_id": "first",
            "built_percent": "mean",
            "ndvi_mean": "mean",
            "growth_class": "first",
            "change": "max"
        })
    )

    top = (
        result.nlargest(n, "change")
        [["grid_id", "area_name", "built_percent", "ndvi_mean", "growth_class", "change"]]
    )

    top["built_percent"] = (
        top["built_percent"] * 100
    ).round(1)

    top["ndvi_mean"] = (
        top["ndvi_mean"] * 100
    ).round(1)

    return {
        "areas": top.to_dict(orient="records"),
        "from_year": int(first_year),
        "to_year": int(last_year),
    }

# ── MOST URBANISED AREAS ───────────────────────────────

@app.get("/most-built")
def get_most_built(n: int = 8):
    """Top N areas by built-up % in the latest historical year."""
    latest_year = int(historical_df["year"].max())
    df_latest   = historical_df[historical_df["year"] == latest_year]

    top = (
        df_latest.nlargest(n, "built_percent")
        [["grid_id", "area_name", "built_percent", "ndvi_mean", "nighttime_mean", "growth_class"]]
        .reset_index(drop=True)
    )
    top["built_percent"]   = (top["built_percent"]) * 100
    top["ndvi_mean"]       = (top["ndvi_mean"]) * 100
    top["nighttime_mean"]  = (top["nighttime_mean"])

    return {"areas": top.to_dict(orient="records"), "year": latest_year}


# ── SCATTER DATA (built vs NDVI per area for a year) ───

@app.get("/scatter/{year}")
def get_scatter(year: int):

    if year <= 2024:
        df = historical_df[historical_df["year"] == year].copy()

    else:
        pred = prediction_df[
            prediction_df["year"] == year
        ][[
            "grid_id",
            "area_name",
            "growth_class",
            "confidence"
        ]]

        latest = historical_df[
            historical_df["year"] == 2024
        ][[
            "grid_id",
            "built_percent",
            "ndvi_mean",
            "nighttime_mean"
        ]]

        df = pred.merge(
            latest,
            on="grid_id",
            how="left"
        )

    result = df.copy()

    result["built_percent"] = (
    result["built_percent"] * 100
    ).round(1)

    result["ndvi_mean"] = (
        result["ndvi_mean"] * 100
    ).round(1)

    result["nighttime_mean"] = (
        result["nighttime_mean"]
    ).round(1)

    cols = [
        "area_name",
        "built_percent",
        "ndvi_mean",
        "nighttime_mean"
    ]

    if "growth_class" in result.columns:
        cols.append("growth_class")

    return {
        "year": year,
        "areas": result[cols]
        .dropna()
        .to_dict(orient="records")
    }


# ── CORRELATIONS ────────────────────────────────────────

@app.get("/correlations")
def get_correlations():
    """Pearson r between key metrics using 2024 data."""
    d = historical_df[historical_df["year"] == 2024].dropna(
        subset=["built_percent", "ndvi_mean", "nighttime_mean"]
    )

    pairs = [
        ("built_percent",  "nighttime_mean", "Built-up vs Night Light"),
        ("built_percent",  "ndvi_mean",      "Built-up vs NDVI"),
        ("nighttime_mean", "ndvi_mean",       "Night Light vs NDVI"),
    ]

    results = []
    for col_a, col_b, label in pairs:
        r, p = stats.pearsonr(d[col_a], d[col_b])
        strength = (
            "Very Strong" if abs(r) >= 0.8 else
            "Strong"      if abs(r) >= 0.6 else
            "Moderate"    if abs(r) >= 0.4 else
            "Weak"
        )
        if r < 0:
            strength += " (inverse)"
        results.append({"pair": label, "r": round(r, 2), "strength": strength})

    return {"correlations": results}


# ── YEAR-OVER-YEAR CHANGES ─────────────────────────────

@app.get("/yoy-changes")
def get_yoy_changes():
    """Annual delta in city-wide built_percent, ndvi_mean, nighttime_norm."""
    agg = (
        historical_df
        .groupby("year")
        .agg(built=("built_percent","mean"), ndvi=("ndvi_mean","mean"), night=("nighttime_mean","mean"))
        .reset_index()
        .sort_values("year")
    )

    changes = []
    rows = agg.to_dict(orient="records")
    for i in range(1, len(rows)):
        prev, curr = rows[i-1], rows[i]
        changes.append({
            "year":   f"{int(prev['year'])}→{int(curr['year'])}",
            "builtΔ": round((curr["built"] - prev["built"]) * 100, 2),
            "ndviΔ":  round((curr["ndvi"]  - prev["ndvi"])  * 100, 2),
            "nightΔ": round(curr["night"] - prev["night"], 1),
        })

    return {"changes": changes}


@app.get("/area-overview")
def area_overview(area_name: str, year: int):

    if year <= 2024:
        df = pd.read_csv(
        "Summary/gandhinagar_area_analysis_v3.csv"
    )
    else:
        df = pd.read_csv(
        "Summary/gandhinagar_future_analysis_v3.csv"
    )

    row = df[
    (df["area_name"].str.strip().str.lower() ==
     area_name.strip().lower())
    &
    (df["year"] == year)
]

    if row.empty:
        return {"points": ["No summary available."]}

    analysis = row.iloc[0]["analysis"]

    points = [
        p.strip()
        for p in analysis.split("|")
        if p.strip()
    ]

    return {
        "points": points
    }