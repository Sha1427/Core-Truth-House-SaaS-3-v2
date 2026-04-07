export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/about",
  "/blog",
  "/store",
  "/privacy",
  "/contact",
  "/terms",
  "/help",
  "/headshots",
  "/studio/:token",
  "/sign-in/*",
  "/sign-up/*",
  "/admin-login",
];

export function isPublicRoute(pathname = "") {
  const path = String(pathname || "").trim();

  if (!path) return false;

  return PUBLIC_ROUTE_PATHS.some((route) => {
    if (route.endsWith("/*")) {
      const prefix = route.slice(0, -2);
      return path === prefix || path.startsWith(`${prefix}/`);
    }

    if (route.includes(":token")) {
      const prefix = route.split("/:")[0];
      return path.startsWith(`${prefix}/`);
    }

    return path === route;
  });
}
