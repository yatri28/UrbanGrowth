export const CLASS_COLORS = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
};

export const CLASS_BG = {
  high:   'bg-red-50',
  medium: 'bg-amber-50',
  low:    'bg-green-50',
};

export const CLASS_TEXT = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-green-600',
};

export const CLASS_BORDER = {
  high:   'border-red-200',
  medium: 'border-amber-200',
  low:    'border-green-200',
};

export const CLASS_BADGE_STYLE = {
  high:   { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  medium: { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  low:    { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
};

export const COMPARE_LINE_COLORS = [
  '#6366f1', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#ec4899',
];

export const normalizeClass = (cls) => {
  if (cls === 'medium' || cls === 'mid') return 'medium';
  return cls;
};