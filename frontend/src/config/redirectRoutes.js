export const REDIRECT_ROUTES = [
  {
    path: "/dashboard",
    redirectTo: "/command-center",
    tooltip: "Redirects to Command Center.",
  },
  {
    path: "/brand-foundation",
    redirectTo: "/brand-intelligence?tab=foundation",
    tooltip: "Redirects to Brand Intelligence.",
  },
  {
    path: "/brand-memory",
    redirectTo: "/brand-intelligence?tab=memory",
    tooltip: "Redirects to Brand Intelligence.",
  },
  {
    path: "/audit",
    redirectTo: "/brand-audit",
    tooltip: "Redirects to Brand Audit.",
  },
];

export function getRedirectRoute(path) {
  return REDIRECT_ROUTES.find((route) => route.path === path) || null;
}
