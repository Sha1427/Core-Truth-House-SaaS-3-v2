import {
  LayoutDashboard,
  Users,
  BarChart3,
  LifeBuoy,
  Bell,
  ClipboardList,
    ClipboardCheck,
  FileStack,
  FileText,
  Handshake,
  Mail,
  BadgeDollarSign,
  Package,
  ShoppingCart,
  BookOpen,
  Boxes,
  Workflow,
  KeyRound,
  FlaskConical,
  CalendarRange,
  Activity,
  Settings,
  ArrowRightLeft,
} from "lucide-react";

export const ADMIN_NAV_GROUPS = [
  {
    id: "manage",
    label: "Manage",
    items: [
      { id: "dashboard", label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { id: "accounts-users", label: "Accounts & Users", to: "/admin/accounts-users", icon: Users },
      { id: "analytics", label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
        { id: "brand-audits", label: "Brand Audits", to: "/admin/brand-audits", icon: ClipboardCheck },
      { id: "help-desk", label: "Help Desk", to: "/admin/help-desk", icon: LifeBuoy, badge: "🚧" },
      { id: "notifications", label: "Notifications", to: "/admin/notifications", icon: Bell },
      { id: "onboarding", label: "Onboarding", to: "/admin/onboarding", icon: ClipboardList },
    ],
  },
  {
    id: "market",
    label: "Market",
    items: [
      { id: "pages", label: "Pages", to: "/admin/pages", icon: FileStack },
      { id: "blog", label: "Blog", to: "/admin/blog", icon: FileText },
      { id: "crm", label: "CRM", to: "/admin/crm", icon: Handshake },
      { id: "email-marketing", label: "Email Marketing", to: "/admin/email-marketing", icon: Mail },
      { id: "affiliates", label: "Affiliates", to: "/admin/affiliates", icon: BadgeDollarSign, badge: "🚧" },
      { id: "store-products", label: "Store Products", to: "/admin/store-products", icon: Package },
      { id: "store-orders", label: "Store Orders", to: "/admin/store-orders", icon: ShoppingCart },
      { id: "knowledge-base", label: "Knowledge Base", to: "/admin/knowledge-base", icon: BookOpen },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      { id: "entities", label: "Entities", to: "/admin/entities", icon: Boxes },
      { id: "workflows", label: "Workflows", to: "/admin/workflows", icon: Workflow },
      { id: "api", label: "API", to: "/admin/api", icon: KeyRound },
      { id: "playground", label: "Playground", to: "/admin/playground", icon: FlaskConical },
      { id: "events", label: "Events", to: "/admin/events", icon: CalendarRange },
      { id: "metrics", label: "Metrics", to: "/admin/metrics", icon: Activity },
    ],
  },
];

export const ADMIN_UTILITY_ITEMS = [
  { id: "settings", label: "Settings", to: "/admin/settings", icon: Settings },
  { id: "switch-to-app", label: "Switch to App", to: "/command-center", icon: ArrowRightLeft },
];
