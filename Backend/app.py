import os
from fastapi import FastAPI
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

@app.get("/health")
def health():
    return {"status": "ok"}
app.include_router(history_router)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ── LOAD DATA ──────────────────────────────────────────

historical_df = pd.read_csv("historical_2016_2024.csv")
prediction_df = pd.read_csv("final_urban_growth_predictions_2025_2040.csv")

# Attach coordinates to prediction data (grid centroid avg per area)
coords = (
    historical_df
    .groupby("area_name")
    .agg(center_lat=("center_lat", "mean"), center_lon=("center_lon", "mean"))
    .reset_index()
)
prediction_df = prediction_df.merge(coords, on="area_name", how="left")

# ── PRE-COMPUTE AREA-LEVEL AGGREGATES ─────────────────
# All downstream endpoints serve these — never raw grid rows

# Historical: mean of built_percent, ndvi_mean, nighttime_mean; mode of growth_class
hist_area = (
    historical_df
    .groupby(["area_name", "year"])
    .agg(
        built_percent  =("built_percent",   "mean"),
        ndvi_mean      =("ndvi_mean",        "mean"),
        nighttime_mean =("nighttime_mean",   "mean"),
        center_lat     =("center_lat",       "mean"),
        center_lon     =("center_lon",       "mean"),
        growth_class   =("growth_class",     lambda x: x.mode()[0]),
    )
    .reset_index()
)

# Prediction: mode of growth_class; mean of confidence
pred_area = (
    prediction_df
    .groupby(["area_name", "year"])
    .agg(
        growth_class=("growth_class", lambda x: x.mode()[0]),
        confidence  =("confidence",   "mean"),
        center_lat  =("center_lat",   "mean"),
        center_lon  =("center_lon",   "mean"),
    )
    .reset_index()
)

print("✅ Historical grid rows:", historical_df.shape, "| Area-level rows:", hist_area.shape)
print("✅ Prediction grid rows:", prediction_df.shape, "| Area-level rows:", pred_area.shape)

# ── PRE-COMPUTE AREA-LEVEL AGGREGATES ─────────────────
hist_area = (
    historical_df
    .groupby(["area_name", "year"])
    .agg(
        built_percent  =("built_percent",   "mean"),
        ndvi_mean      =("ndvi_mean",        "mean"),
        nighttime_mean =("nighttime_mean",   "mean"),
        center_lat     =("center_lat",       "mean"),
        center_lon     =("center_lon",       "mean"),
        growth_class   =("growth_class",     lambda x: x.mode()[0]),
    )
    .reset_index()
)

pred_area = (
    prediction_df
    .groupby(["area_name", "year"])
    .agg(
        growth_class=("growth_class", lambda x: x.mode()[0]),
        confidence  =("confidence",   "mean"),
        center_lat  =("center_lat",   "mean"),
        center_lon  =("center_lon",   "mean"),
    )
    .reset_index()
)

print("✅ Area-level hist:", hist_area.shape, "| pred:", pred_area.shape)
print("✅ Years hist:", sorted(hist_area['year'].unique().tolist()))
print("✅ Years pred:", sorted(pred_area['year'].unique().tolist()))

# ── HOME ───────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Urban Growth Backend Running"}

# ── AREAS BY YEAR ──────────────────────────────────────
# Returns ONE row per named area — always area-level
@app.get("/areas/{year}")
def get_areas(year: int):
    if year <= 2024:
        df   = hist_area[hist_area["year"] == year].copy()
        mode = "historical"
        df["built_percent"]  = (df["built_percent"]  * 100).round(1)
        df["ndvi_mean"]      = (df["ndvi_mean"]       * 100).round(1)
        df["nighttime_mean"] = df["nighttime_mean"].round(2)
    else:
        df   = pred_area[pred_area["year"] == year].copy()
        mode = "prediction"
        df["confidence"] = (df["confidence"] * 100).round(1)

    return {
        "mode":  mode,
        "year":  year,
        "count": len(df),
        "areas": df.to_dict(orient="records"),
    }
# ── AREA TREND (historical + predicted) ───────────────
# Replaces /prediction-trend/{grid_id} — now area-level
@app.get("/area-trend/{area_name}")
def get_area_trend(area_name: str):
    h = hist_area[hist_area["area_name"] == area_name].sort_values("year")
    p = pred_area[pred_area["area_name"] == area_name].sort_values("year")

    hist_list = []
    for _, row in h.iterrows():
        hist_list.append({
            "year":           int(row["year"]),
            "growth_class":   str(row["growth_class"]).lower(),
            "built_percent":  round(float(row["built_percent"]) * 100, 1),
            "ndvi_mean":      round(float(row["ndvi_mean"])      * 100, 1),
            "nighttime_mean": round(float(row["nighttime_mean"]),       2),
            "confidence":     None,
        })

    built_rate = {"high": 0.010, "medium": 0.008, "low": 0.003}
    ndvi_rate  = {"high": 0.005, "medium": 0.003, "low": 0.001}

    if len(h) > 0:
        last       = h.iloc[-1]
        base_built = float(last["built_percent"])
        base_ndvi  = float(last["ndvi_mean"])
        base_night = float(last["nighttime_mean"])
        base_year  = int(last["year"])
    else:
        base_built = 0.3; base_ndvi = 0.35; base_night = 5.0; base_year = 2024

    pred_list = []
    for _, row in p.iterrows():
        gc    = str(row["growth_class"]).lower()
        delta = int(row["year"]) - base_year
        pred_list.append({
            "year":           int(row["year"]),
            "growth_class":   gc,
            "confidence":     round(float(row["confidence"]) * 100, 1),
            "built_percent":  round(min(98.0, (base_built + delta * built_rate.get(gc, 0.005)) * 100), 1),
            "ndvi_mean":      round(max(5.0,  (base_ndvi  - delta * ndvi_rate.get(gc, 0.003))  * 100), 1),
            "nighttime_mean": round(base_night + delta * 0.5, 2),
        })

    return {
        "area_name":  area_name,
        "historical": hist_list,
        "prediction": pred_list,
    }
# ── PREDICTION STATS FOR A YEAR ─────────────────────────
# Counts are at AREA level (70 max, not 100)

@app.get("/prediction-stats/{year}")
def get_prediction_stats(year: int):
    df = pred_area[pred_area["year"] == year]
    class_counts  = df["growth_class"].str.lower().value_counts().to_dict()
    conf_by_class = (
        df.groupby(df["growth_class"].str.lower())["confidence"]
        .mean().mul(100).round(1).to_dict()
    )
    return {
        "year":                    year,
        "total_areas":             len(df),
        "class_counts":            class_counts,
        "avg_confidence_by_class": conf_by_class,
    }

# ── CITY-WIDE HISTORICAL AGGREGATES ────────────────────

@app.get("/city-history")
def get_city_history():
    agg = (
        pred_area
        .groupby("year")
        .agg(
            built =("built_percent",  "mean"),
            ndvi  =("ndvi_mean",      "mean"),
            night =("nighttime_mean", "mean"),
        )
        .reset_index()
    )
    agg["built"] = (agg["built"] * 100).round(1)
    agg["ndvi"]  = (agg["ndvi"]  * 100).round(1)
    agg["night"] = agg["night"].round(1)

    gc_counts = (
        pred_area
        .groupby(["year", "growth_class"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    for col in ["high", "medium", "low"]:
        if col not in gc_counts.columns:
            gc_counts[col] = 0

    merged = agg.merge(gc_counts[["year", "high", "medium", "low"]], on="year", how="left")
    merged["year"] = merged["year"].astype(int)
    return {"history": merged.to_dict(orient="records")}

# ── CITY-WIDE PREDICTION AGGREGATES ────────────────────

@app.get("/city-predictions")
def get_city_predictions():
    gc_counts = (
        pred_area
        .groupby(["year", "growth_class"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    for col in ["high", "medium", "low"]:
        if col not in gc_counts.columns:
            gc_counts[col] = 0

    avg_conf = (
        pred_area
        .groupby("year")["confidence"]
        .mean().mul(100).round(1)
        .reset_index()
        .rename(columns={"confidence": "conf"})
    )
    merged = gc_counts.merge(avg_conf, on="year", how="left")
    merged["year"] = merged["year"].astype(int)
    return {"predictions": merged[["year", "high", "medium", "low", "conf"]].to_dict(orient="records")}

# ── TOP GROWING AREAS (area-level) ─────────────────────

@app.get("/top-growing")
def get_top_growing(n: int = 8):
    years      = sorted(hist_area["year"].unique())
    first_year, last_year = years[0], years[-1]

    df_first = hist_area[hist_area["year"] == first_year].set_index("area_name")
    df_last  = hist_area[hist_area["year"] == last_year].set_index("area_name")
    common   = df_first.index.intersection(df_last.index)

    result = df_last.loc[common].copy()
    result["built_2016"] = (df_first.loc[common, "built_percent"] * 100).round(1)
    result["built_2024"] = (df_last.loc[common,  "built_percent"] * 100).round(1)
    result["change"]     = (
        (df_last.loc[common, "built_percent"] - df_first.loc[common, "built_percent"])
        / df_first.loc[common, "built_percent"].replace(0, float("nan"))
        * 100
    ).round(2)

    top = (
        result.reset_index()
        .nlargest(n, "change")
        [["area_name", "built_percent", "ndvi_mean", "growth_class", "change", "built_2016", "built_2024"]]
    )
    top["built_percent"] = (top["built_percent"] * 100).round(1)
    top["ndvi_mean"]     = (top["ndvi_mean"]     * 100).round(1)

    return {"areas": top.to_dict(orient="records"), "from_year": int(first_year), "to_year": int(last_year)}

# ── MOST URBANISED AREAS (area-level) ─────────────────

@app.get("/most-built")
def get_most_built(n: int = 8):
    latest_year = int(hist_area["year"].max())
    df_latest   = hist_area[hist_area["year"] == latest_year]

    top = (
        df_latest.nlargest(n, "built_percent")
        [["area_name", "built_percent", "ndvi_mean", "nighttime_mean", "growth_class"]]
        .reset_index(drop=True)
    )
    top["built_percent"]  = (top["built_percent"]  * 100).round(1)
    top["ndvi_mean"]      = (top["ndvi_mean"]       * 100).round(1)
    top["nighttime_mean"] = top["nighttime_mean"].round(2)
    return {"areas": top.to_dict(orient="records"), "year": latest_year}

# ── SCATTER (area-level) ───────────────────────────────

@app.get("/scatter/{year}")
def get_scatter(year: int):
    if year <= 2024:
        df = hist_area[hist_area["year"] == year].copy()
        df["built_percent"]  = (df["built_percent"]  * 100).round(1)
        df["ndvi_mean"]      = (df["ndvi_mean"]       * 100).round(1)
        df["nighttime_mean"] = df["nighttime_mean"].round(1)
        cols = ["area_name", "built_percent", "ndvi_mean", "nighttime_mean", "growth_class"]
    else:
        p  = pred_area[pred_area["year"] == year][["area_name", "growth_class", "confidence"]]
        h  = hist_area[hist_area["year"] == 2024][["area_name", "built_percent", "ndvi_mean", "nighttime_mean"]]
        df = p.merge(h, on="area_name", how="left")
        df["built_percent"]  = (df["built_percent"]  * 100).round(1)
        df["ndvi_mean"]      = (df["ndvi_mean"]       * 100).round(1)
        df["nighttime_mean"] = df["nighttime_mean"].round(1)
        cols = ["area_name", "built_percent", "ndvi_mean", "nighttime_mean", "growth_class"]
    return {"year": year, "areas": df[cols].dropna().to_dict(orient="records")}

# ── CORRELATIONS ────────────────────────────────────────

@app.get("/correlations")
def get_correlations():
    d = hist_area[hist_area["year"] == 2024].dropna(
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
            "Moderate"    if abs(r) >= 0.4 else "Weak"
        )
        if r < 0:
            strength += " (inverse)"
        results.append({"pair": label, "r": round(r, 2), "strength": strength})
    return {"correlations": results}

# ── YEAR-OVER-YEAR CHANGES ─────────────────────────────

@app.get("/yoy-changes")
def get_yoy_changes():
    agg = (
        hist_area
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

# ── AREA OVERVIEW SUMMARY ──────────────────────────────

@app.get("/area-overview")
def get_area_overview(area_name: str, year: int):
    csv_path = (
        "Summary/gandhinagar_area_analysis_v4.csv"   if year <= 2024
        else "Summary/gandhinagar_future_analysis_v4.csv"
    )
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        return {"points": ["Summary data not available."]}

    row = df[
        (df["area_name"].str.strip().str.lower() == area_name.strip().lower())
        & (df["year"] == year)
    ]
    if row.empty:
        return {"points": ["No summary available for this area and year."]}

    analysis = row.iloc[0]["analysis"]
    points   = [p.strip() for p in analysis.split("|") if p.strip()]
    return {"points": points}

# ── COMPARE AI SUMMARY ─────────────────────────────────

@app.post("/compare-summary")
def compare_summary(data: dict):
    areas = data.get("areas", [])
    if len(areas) < 2:
        return {"summary": "Please select at least two areas for comparison."}

    prompt = "Compare the following Gandhinagar areas.\n\n"
    for area in areas:
        prompt += f"Area Name: {area['name']}\nBuilt-up: {area['built']}\nGreen Cover: {area['ndvi']}\nNight Activity: {area['night']}\n\n"
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
        return {"summary": response.text}
    except Exception as e:
        return {"summary": f"Unable to generate AI summary: {str(e)}"}
    