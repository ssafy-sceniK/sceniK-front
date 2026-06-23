export const TRANSPORT_MODES = {
  PUBLIC_TRANSIT: 'PUBLIC_TRANSIT',
  CAR: 'CAR',
};

export const TRANSPORT_MODE_OPTIONS = [
  { value: TRANSPORT_MODES.PUBLIC_TRANSIT, label: '대중교통' },
  { value: TRANSPORT_MODES.CAR, label: '차량' },
];

export function normalizeTransportModes(value, fallback = '대중교통') {
  const source = Array.isArray(value) ? value : String(fallback ?? '').split(/[,+·]/);
  const normalized = new Set();

  source.forEach((item) => {
    const text = String(item ?? '').trim();
    if (!text || text.includes('도보')) return;
    if (text === TRANSPORT_MODES.CAR || text.includes('차량') || text.toUpperCase() === 'CAR') {
      normalized.add(TRANSPORT_MODES.CAR);
      return;
    }
    if (text === TRANSPORT_MODES.PUBLIC_TRANSIT || text.includes('대중교통') || text.toUpperCase() === 'PUBLIC_TRANSIT') {
      normalized.add(TRANSPORT_MODES.PUBLIC_TRANSIT);
    }
  });

  if (normalized.has(TRANSPORT_MODES.CAR)) normalized.add(TRANSPORT_MODES.PUBLIC_TRANSIT);
  if (!normalized.size) normalized.add(TRANSPORT_MODES.PUBLIC_TRANSIT);
  return [TRANSPORT_MODES.PUBLIC_TRANSIT, TRANSPORT_MODES.CAR].filter((mode) => normalized.has(mode));
}

export function normalizeCarDays(value, durationDays = 1, modes = [TRANSPORT_MODES.PUBLIC_TRANSIT]) {
  const duration = Math.max(1, Number(durationDays) || 1);
  const hasCar = normalizeTransportModes(modes).includes(TRANSPORT_MODES.CAR);
  if (!hasCar) return [];

  const days = [...new Set((Array.isArray(value) ? value : [])
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= duration))]
    .sort((a, b) => a - b);

  return days.length ? days : [1];
}

export function transportLabel(modes, carDays = [], durationDays = 1) {
  const normalizedModes = normalizeTransportModes(modes);
  if (!normalizedModes.includes(TRANSPORT_MODES.CAR)) return '대중교통';

  const normalizedCarDays = normalizeCarDays(carDays, durationDays, normalizedModes);
  const dayLabel = normalizedCarDays.map((day) => `Day ${day}`).join(', ');
  return `대중교통 + 차량 (${dayLabel} 차량)`;
}
