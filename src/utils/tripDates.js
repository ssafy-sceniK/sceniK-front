const DAY_MS = 24 * 60 * 60 * 1000;

function localIsoDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function dateAfter(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return localIsoDate(date);
}

export function ensureDateRange(conditions = {}) {
  const startDate = conditions.startDate || dateAfter(7);
  const endDate = conditions.endDate || startDate;
  return endDate < startDate
    ? { startDate, endDate: startDate }
    : { startDate, endDate };
}

export function getTripDurationDays(conditions = {}) {
  const { startDate, endDate } = ensureDateRange(conditions);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return Math.max(1, Number.isFinite(diff) ? diff : Number(conditions.duration || 1));
}

export function formatDateLabel(dateValue) {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  return `${year}.${month}.${day}`;
}

export function formatDateRange(conditions = {}) {
  const { startDate, endDate } = ensureDateRange(conditions);
  if (startDate === endDate) return formatDateLabel(startDate);
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}
