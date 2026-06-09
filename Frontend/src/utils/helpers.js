export const pct = (val, decimals = 1) =>
  `${(val * 100).toFixed(decimals)}%`;

export const pctRaw = (val, decimals = 1) =>
  (val * 100).toFixed(decimals);

export const truncate = (str, max = 18) =>
  str.length > max ? str.slice(0, max) + '…' : str;

export const dedupe = (areas, key = 'area_name') => {
  const seen = new Set();
  return areas.filter((a) => {
    if (seen.has(a[key])) return false;
    seen.add(a[key]);
    return true;
  });
};

export const groupByClass = (areas) => ({
  high:   areas.filter((a) => a.growth_class === 'high'),
  medium: areas.filter((a) => a.growth_class === 'medium'),
  low:    areas.filter((a) => a.growth_class === 'low'),
});