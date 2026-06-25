export function resolvedCourseShareRouteId(routeId = '') {
  const id = String(routeId ?? '').trim();
  return id && !id.startsWith('gen-') ? id : '';
}

export function buildCourseShareUrl(router, routeId) {
  const id = resolvedCourseShareRouteId(routeId);
  if (!id || typeof window === 'undefined') return '';
  return new URL(router.resolve({ name: 'course-detail', params: { routeId: id } }).href, window.location.origin).toString();
}

export async function shareCourseUrl({ title = '', text = '', url = '' } = {}) {
  if (!url) return { ok: false, reason: 'unavailable' };
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return { ok: true, method: 'native' };
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return { ok: true, method: 'clipboard' };
    }
    return { ok: false, reason: 'unavailable' };
  } catch (error) {
    if (error?.name === 'AbortError') return { ok: false, reason: 'aborted' };
    return { ok: false, reason: 'failed' };
  }
}

export async function copyCourseUrl(url = '') {
  if (!url || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
