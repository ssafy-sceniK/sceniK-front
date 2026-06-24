export const NOTICE_ITEMS = [
  {
    id: 'content-location-update-2026-05-20',
    legacyIds: ['notice-csv-1'],
    date: '2026.05.20',
    titleKey: 'notice.items.contentLocationUpdate.title',
    bodyKey: 'notice.items.contentLocationUpdate.body',
  },
  {
    id: 'verified-ai-course-2026-05-18',
    legacyIds: ['notice-csv-2'],
    date: '2026.05.18',
    titleKey: 'notice.items.verifiedAiCourse.title',
    bodyKey: 'notice.items.verifiedAiCourse.body',
  },
  {
    id: 'check-hours-2026-05-12',
    legacyIds: ['notice-csv-3'],
    date: '2026.05.12',
    titleKey: 'notice.items.checkHours.title',
    bodyKey: 'notice.items.checkHours.body',
  },
];

export function noticeRouteId(id) {
  const notice = NOTICE_ITEMS.find((item) => item.id === id || item.legacyIds?.includes(id));
  return notice?.id ?? id;
}

export function findNotice(id) {
  return NOTICE_ITEMS.find((item) => item.id === id || item.legacyIds?.includes(id)) ?? null;
}

export function localizedNotices(t) {
  return NOTICE_ITEMS.map((item) => ({
    ...item,
    title: t(item.titleKey),
    body: t(item.bodyKey),
  }));
}
