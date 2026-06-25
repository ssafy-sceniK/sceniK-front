export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenSearchValues(values) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return flattenSearchValues(value);
    return [value];
  });
}

export function matchesSearchText(values, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return flattenSearchValues(values).some((value) => normalizeSearchText(value).includes(normalizedQuery));
}
