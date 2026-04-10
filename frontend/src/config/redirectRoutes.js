export const REDIRECT_ROUTES = [
  {
    path: "/dashboard",
    redirectTo: "/command-center",
    tooltip: "Redirects to Command Center.",
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
