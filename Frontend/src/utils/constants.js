export const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const GROWTH_CLASSES = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export const MAP_CENTER = [23.230, 72.665];
export const MAP_ZOOM = 13;

export const SHOW_INITIAL = 5;
export const MAX_COMPARE = 6;

export const TREND_METRICS = [
  { key: 'built_percent',     label: 'Built Cover',   unit: '%',    scale: 100 },
  { key: 'nighttime_norm',    label: 'Night Lights',  unit: '%',    scale: 100 },
  { key: 'ndvi_mean',         label: 'Vegetation',    unit: '%',    scale: 100 },
  { key: 'built_change_avg',  label: 'Growth Rate',   unit: '%/yr', scale: 100 },
];

export const COMPARE_TABS = [
  { key: 'built',   label: 'Built Cover',   metric: 'built_percent',    scale: 100 },
  { key: 'night',   label: 'Night Lights',  metric: 'nighttime_norm',   scale: 100 },
  { key: 'ndvi',    label: 'Vegetation',    metric: 'ndvi_mean',        scale: 100 },
  { key: 'change',  label: 'Growth Rate',   metric: 'built_change_avg', scale: 100 },
];