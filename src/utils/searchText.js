import { supportedLocales } from '../i18n/languages.js';
import { placeNameFallbackForLocale } from '../i18n/placeNameRomanization.js';

const SEARCH_LOCALES = supportedLocales ?? ['ko', 'en', 'ja', 'zh-CN'];

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
    if (value instanceof Set) return flattenSearchValues([...value]);
    return [value];
  });
}

export function matchesSearchText(values, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return flattenSearchValues(values).some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

function collectLocalizedFieldVariants(item, baseName) {
  if (!item || !baseName) return [];
  const pascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return [
    item[`${baseName}Ko`],
    item[`${baseName}En`],
    item[`${baseName}Ja`],
    item[`${baseName}Zh`],
    item[`${baseName}ZhCn`],
    item[`${baseName}_ko`],
    item[`${baseName}_en`],
    item[`${baseName}_ja`],
    item[`${baseName}_zh`],
    item[`${baseName}_zh_cn`],
    item[`ko${pascalName}`],
    item[`en${pascalName}`],
    item[`ja${pascalName}`],
    item[`zh${pascalName}`],
    item.localized?.[baseName],
    item.localizedFields?.[baseName],
    item.translations?.ko?.[baseName],
    item.translations?.en?.[baseName],
    item.translations?.ja?.[baseName],
    item.translations?.['zh-CN']?.[baseName],
    item.translation?.ko?.[baseName],
    item.translation?.en?.[baseName],
    item.translation?.ja?.[baseName],
    item.translation?.['zh-CN']?.[baseName],
  ];
}

function callLocalizedLabel(value, kind, helpers, locale) {
  if (!value || typeof helpers.localizeSystemLabel !== 'function') return value;
  return helpers.localizeSystemLabel(value, kind, helpers.t, locale);
}

function callLocalizedTag(value, helpers, locale) {
  if (!value || typeof helpers.localizeSystemTag !== 'function') return value;
  return helpers.localizeSystemTag(value, helpers.t, locale);
}

function localizedSystemLabels(value, kind, helpers = {}) {
  if (!value) return [];
  return [
    value,
    SEARCH_LOCALES.map((locale) => callLocalizedLabel(value, kind, helpers, locale)),
  ];
}

function localizedSystemTags(values, helpers = {}) {
  const tags = Array.isArray(values) ? values : [values];
  return tags.filter(Boolean).flatMap((tag) => [
    tag,
    SEARCH_LOCALES.map((locale) => callLocalizedTag(tag, helpers, locale)),
  ]);
}

function localizeForEveryLocale(item, localizer, helpers = {}) {
  if (typeof localizer !== 'function') return [];
  return SEARCH_LOCALES.map((locale) => {
    try {
      return localizer(item, locale, helpers.t);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function localizedPlaceNameFallbacks(place, fieldName) {
  const source = place?.[`original${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]
    ?? place?.[fieldName]
    ?? place?.originalPlaceName
    ?? place?.placeName
    ?? place?.originalName
    ?? place?.name;
  if (!source) return [];
  return SEARCH_LOCALES.map((locale) => placeNameFallbackForLocale(source, locale));
}

export function buildContentSearchFields(content, helpers = {}) {
  if (!content) return [];
  const localizedContents = localizeForEveryLocale(content, helpers.localizeContent, helpers);
  const sourceTags = Array.isArray(content.originalTags) && content.originalTags.length
    ? content.originalTags
    : content.tags;

  return [
    content.contentId,
    content.title,
    content.originalTitle,
    collectLocalizedFieldVariants(content, 'title'),
    content.category,
    content.originalCategory,
    localizedSystemLabels(content.originalCategory ?? content.category, 'category', helpers),
    content.subcategory,
    content.originalSubcategory,
    localizedSystemTags(content.originalSubcategory ?? content.subcategory, helpers),
    content.description,
    content.originalDescription,
    collectLocalizedFieldVariants(content, 'description'),
    content.castNames,
    content.originalCastNames,
    collectLocalizedFieldVariants(content, 'castNames'),
    content.country,
    content.ottPlatform,
    content.tags,
    content.originalTags,
    localizedSystemTags(sourceTags, helpers),
    localizedContents.map((item) => [
      item.title,
      item.description,
      item.category,
      item.subcategory,
      item.castNames,
      item.tags,
    ]),
  ];
}

export function buildPlaceSearchFields(place, helpers = {}) {
  if (!place) return [];
  const localizedPlaces = localizeForEveryLocale(place, helpers.localizePlace, helpers);
  const sourceTags = Array.isArray(place.originalTags) && place.originalTags.length
    ? place.originalTags
    : place.tags;

  return [
    place.placeId,
    place.name,
    place.originalName,
    place.placeName,
    place.originalPlaceName,
    collectLocalizedFieldVariants(place, 'name'),
    collectLocalizedFieldVariants(place, 'placeName'),
    localizedPlaceNameFallbacks(place, 'name'),
    localizedPlaceNameFallbacks(place, 'placeName'),
    place.address,
    place.region,
    place.originalRegion,
    localizedSystemLabels(place.originalRegion ?? place.region, 'region', helpers),
    place.district,
    place.originalDistrict,
    localizedSystemLabels(place.originalDistrict ?? place.district, 'region', helpers),
    place.category,
    place.originalCategory,
    localizedSystemLabels(place.originalCategory ?? place.category, 'category', helpers),
    place.description,
    place.originalDescription,
    collectLocalizedFieldVariants(place, 'description'),
    place.tags,
    place.originalTags,
    localizedSystemTags(sourceTags, helpers),
    place.relatedContents?.map((content) => [
      content.contentId,
      content.title,
      content.originalTitle,
      collectLocalizedFieldVariants(content, 'title'),
    ]),
    localizedPlaces.map((item) => [
      item.name,
      item.placeName,
      item.region,
      item.district,
      item.category,
      item.description,
      item.tags,
    ]),
  ];
}