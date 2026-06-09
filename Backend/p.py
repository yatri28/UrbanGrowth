 import pandas as pd

# Load CSV
df = pd.read_csv("gandhinagar_with_growth_class.csv")

# Keep only required columns
final_df = pd.DataFrame({
    "grid_id": df["grid_id"],
    "area_name": df["area_name"],
    "year": df["year"],   # existing year column
    "center_lat": df["center_lat"],
    "center_lon": df["center_lon"],
    "ndvi_mean": df["ndvi_mean"],
    "built_percent": df["built_percent"],
    "nighttime_norm": df["nighttime_norm"],
    "growth_class": df["growth_class"]
})

# Save CSV
final_df.to_csv("historical_2016_2024.csv", index=False)

print("✅ CSV created with", len(final_df), "rows")