import { getRoute } from "../config/routeConfig";

export function resolveAppPath(path, fallback = "/command-center") {
  const route = getRoute(path);
  if (!route) return fallback;
  return route.redirectTo || route.path;
}

export function navigateToRoute(navigate, path, options = {}) {
  navigate(resolveAppPath(path), options);
}
