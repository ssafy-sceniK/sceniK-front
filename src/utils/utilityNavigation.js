const MAIN_ROUTE_PREFIXES = [
  '/home',
  '/community',
  '/explore',
  '/contents',
  '/places',
  '/search',
  '/ai',
  '/my',
];

const UTILITY_PATHS = new Set(['/settings', '/notifications']);

function routePath(route) {
  return String(route?.path ?? '');
}

function routeBasePath(path) {
  return String(path ?? '').split('?')[0].split('#')[0];
}

function isUtilityPath(path) {
  return UTILITY_PATHS.has(routeBasePath(path));
}

function isMainFeaturePath(path) {
  const basePath = routeBasePath(path);
  return MAIN_ROUTE_PREFIXES.some((prefix) => basePath === prefix || basePath.startsWith(`${prefix}/`));
}

export function utilityOriginForRoute(route) {
  const path = routePath(route);
  const origin = typeof route?.query?.origin === 'string' ? route.query.origin : '';
  if (isUtilityPath(path) && isMainFeaturePath(origin)) return origin;
  if (isMainFeaturePath(path)) return route.fullPath || path;
  return '/home';
}

export function utilityRouteTo(path, currentRoute) {
  return {
    path,
    query: {
      origin: utilityOriginForRoute(currentRoute),
    },
  };
}

export function utilityBackTo(route) {
  const origin = typeof route?.query?.origin === 'string' ? route.query.origin : '';
  return isMainFeaturePath(origin) ? origin : '/home';
}
