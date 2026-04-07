import { Shield } from "lucide-react";

export const ADMIN_ROUTES = [
  {
    path: "/admin",
    label: "Super Admin",
    icon: Shield,
    group: "platformAdmin",
    requiredPlan: null,
    gateType: null,
    adminOnly: true,
    superAdminOnly: true,
    tooltip: "Platform-level tenant management, billing overview, and AI configuration.",
  },
];
