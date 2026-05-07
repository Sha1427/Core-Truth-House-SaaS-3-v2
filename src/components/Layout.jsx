import React, { useEffect, useMemo, useState, useRef} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useColors, useTheme } from "../context/ThemeContext";
import { usePlan } from "../context/PlanContext";
import { useUser, useClerk } from "../hooks/useAuth";
import { useWorkspace } from "../context/WorkspaceContext";
import { SIDEBAR_GROUPS, getRoutesByGroup } from "../config/routeConfig";
import { SidebarTooltip } from "./ui/tooltip";
import apiClient from "../lib/apiClient";
import {
  Shield,
  Key,
  Video,
  ShieldAlert,
  LayoutDashboard,
  Layers,
  BookOpen,
  Activity,
  ClipboardCheck,
  Award,
  Zap,
  Brain,
  Target,
  Search,
  Columns,
  Share2,
  DollarSign,
  PenTool,
  Image,
  Sparkles,
  Hash,
  Package,
  Gift,
  Rocket,
  Megaphone,
  Workflow,
  Radio,
  FileText,
  Calendar,
  Globe,
  Mail,
  Users,
  UsersRound,
  PhoneCall,
  TrendingUp,
  BarChart2,
  PlayCircle,
  FolderOpen,
  PlusCircle,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Download,
  Lock,
  Wand2,
  HelpCircle,
  Menu,
  PanelLeftClose,
  PanelLeft,
  X,
  Database,
  MessageCircle,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import HelpCenter from "./help/HelpCenter";

const ICON_MAP = {
  "/admin": ShieldAlert,
  "/prompt-engine": Wand2,
  "/command-center": LayoutDashboard,
  "/dashboard": LayoutDashboard,
  "/my-data": Database,
  "/brand-intelligence": Brain,
  "/brand-foundation": Layers,
  "/audience": UsersRound,
  "/brand-memory": BookOpen,
  "/brand-health": Activity,
  "/brand-audit": Search,
  "/strategic-os": Zap,
  "/audience-psychology": Brain,
  "/differentiation": Target,
  "/competitor-analysis": Search,
  "/content-pillars": Columns,
  "/platform-strategy": Share2,
  "/monetization": DollarSign,
  "/campaign-builder": Megaphone,
  "/automations": Workflow,
  "/content-studio": PenTool,
  "/media-studio": Image,
  "/identity-studio": Sparkles,
  "/prompt-hub": Hash,
  "/keyword-generator": Search,
  "/export": Download,
  "/offer-builder": Package,
  "/systems-builder": Gift,
  "/launch-planner": Rocket,
  "/social-media": Radio,
  "/blog-cms": FileText,
  "/calendar": Calendar,
  "/community": MessageCircle,
  "/seo": Globe,
  "/digest": Mail,
  "/crm": PhoneCall,
  "/pipeline-forecast": TrendingUp,
  "/analytics": BarChart2,
  "/team": Users,
  "/tutorials": PlayCircle,
  "/training": PlayCircle,
  "/documents": FolderOpen,
  "/workspace-library": FolderOpen,
  "/addon-requests": PlusCircle,
  "/billing": CreditCard,
  "/settings": Settings,
};

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "OPS_ADMIN",
  "BILLING_ADMIN",
  "CONTENT_ADMIN",
  "SUPPORT_ADMIN",
];

const SUPER_ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN"];

const KEYBOARD_SHORTCUTS = {
  "1": "/command-center",
  "2": "/brand-intelligence",
  "3": "/strategic-os",
  "4": "/content-studio",
  "5": "/media-studio",
  "6": "/crm",
  "7": "/calendar",
  "8": "/settings",
  "9": "/billing",
};

function mapUsagePayload(data) {
  const used =
    Number(
      data?.used ??
        data?.usage_used ??
        data?.credits_used ??
        data?.current_month_used ??
        0
    ) || 0;

  const rawLimit =
    data?.limit ??
    data?.usage_limit ??
    data?.credits_limit ??
    data?.monthly_limit ??
    0;

  const limit =
    rawLimit === "unlimited" || rawLimit === null
      ? 999999
      : Number(rawLimit) || 0;

  const remaining =
    limit === 999999 ? 999999 : Math.max(limit - used, 0);

  const percentage =
    limit > 0 && limit !== 999999 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

  return {
    used,
    limit,
    remaining,
    percentage,
  };
}

export function Sidebar() {
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [usage, setUsage] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const enterTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [utilityDrawerOpen, setUtilityDrawerOpen] = useState(false);

  const { user } = useUser();
  const { signOut } = useClerk();
  const { plan, userRole, isSuperAdmin, canAccess: checkPlanAccess } = usePlan();
  const { activeWorkspaceId } = useWorkspace();

  const userId = user?.id || "default";
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSuperAdminRole = SUPER_ADMIN_ROLES.includes(userRole) || isSuperAdmin;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      if (!activeWorkspaceId || userId === "default") {
        setUsage(null);
        return;
      }

      try {
        const data = await apiClient.get("/api/usage/summary", {
          params: { workspace_id: activeWorkspaceId },
        });

        if (!cancelled) {
          setUsage(mapUsagePayload(data));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load usage summary", error);
          setUsage(null);
        }
      }
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (KEYBOARD_SHORTCUTS[e.key]) {
          e.preventDefault();
          navigate(KEYBOARD_SHORTCUTS[e.key]);
        }
        if (e.key === "k") {
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleSidebarMouseEnter = () => {
    if (!sidebarCollapsed || mobileOpen) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      setHoverExpanded(true);
    }, 200);
  };

  const handleSidebarMouseLeave = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setHoverExpanded(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const toggleGroup = (label) =>
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (path) => {
    const current = `${location.pathname}${location.search || ""}`;
    return current === path || location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isExpanded = !sidebarCollapsed || hoverExpanded || mobileOpen;
  const sidebarWidth = isExpanded ? "w-[240px] min-w-[240px]" : "w-[68px] min-w-[68px]";
  const showLabels = isExpanded;
  const isHoverOverlay = sidebarCollapsed && hoverExpanded && !mobileOpen;

  const adminUtilityItems = isSuperAdminRole
    ? [
        {
          path: "/admin?tab=store_products",
          label: "Store",
          icon: Package,
          group: "platformAdmin",
        },
        {
          path: "/admin?tab=personal-keys",
          label: "AI API Keys",
          icon: Key,
          group: "platformAdmin",
        },
        {
          path: "/admin?tab=training",
          label: "Video Tutorials",
          icon: Video,
          group: "platformAdmin",
        },
      ]
    : [];

  const routeGroups = useMemo(() => {
    return SIDEBAR_GROUPS.map((group) => {
      const baseItems = getRoutesByGroup(group.id).filter((item) => {
        if (item.adminOnly && !isSuperAdminRole) return false;
        if (item.superAdminOnly && !isSuperAdminRole) return false;
        return true;
      });

      const extraItems =
        group.id === "platformAdmin" ? adminUtilityItems : [];

      const items = [...baseItems, ...extraItems].filter(
        (item) => !["/settings", "/billing"].includes(item.path)
      );

      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  }, [isSuperAdminRole, adminUtilityItems]);

  return (
    <>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-[var(--cth-admin-panel)] border border-[var(--cth-admin-border)] text-[var(--cth-admin-ink)]"
        data-testid="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={`flex flex-col h-screen border-r overflow-hidden transition-all duration-300 ease-in-out ${sidebarWidth} ${
          mobileOpen ? "fixed left-0 top-0 z-50 w-[240px]" : "hidden md:flex"
        } ${isHoverOverlay ? "absolute left-0 top-0 z-40 shadow-2xl" : "md:relative md:flex"}`}
        style={{
          background: "linear-gradient(180deg, var(--cth-admin-sidebar-start), var(--cth-admin-sidebar-end))",
          borderColor: "var(--cth-admin-border-dark)",
        }}
        data-testid="sidebar"
      >
        <div
          className="flex items-center justify-between px-3.5 pt-4.5 pb-3"
          style={{ borderBottom: "1px solid rgba(199, 160, 157, 0.12)" }}
        >
          <div
            className={`flex items-center gap-2.5 ${
              sidebarCollapsed && !mobileOpen ? "justify-center w-full" : ""
            }`}
          >
            <img
              src="/cth-logo.png"
              alt="Core Truth House"
              className="h-9 w-9 rounded-2xl object-cover flex-shrink-0 ring-1 ring-white/10"
            />
            {showLabels && (
              <div className="min-w-0">
                <p className="font-bold text-[13px] leading-tight truncate tracking-[0.01em]" style={{ color: "var(--cth-admin-panel)" }}>
                  Core Truth House
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--cth-admin-tuscany)" }}>
                  Brand OS
                </p>
              </div>
            )}
          </div>

          {showLabels && (
            <button
              onClick={() =>
                mobileOpen ? setMobileOpen(false) : (setSidebarCollapsed(!sidebarCollapsed), setHoverExpanded(false))
              }
              className="hidden rounded-xl border border-[rgba(199,160,157,0.16)] bg-[rgba(248,244,242,0.05)] p-2 text-[var(--cth-admin-tuscany)] transition-colors md:flex hover:bg-[rgba(248,244,242,0.10)]" style={{ color: "var(--cth-admin-tuscany)" }}
              data-testid="sidebar-collapse-btn"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {sidebarCollapsed && !mobileOpen && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mx-auto my-2 rounded-xl border border-[rgba(199,160,157,0.16)] bg-[rgba(248,244,242,0.05)] p-2 text-[var(--cth-admin-tuscany)] transition-colors hover:bg-[rgba(248,244,242,0.10)]" style={{ color: "var(--cth-admin-tuscany)" }}
            data-testid="sidebar-expand-btn"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}


        <nav
          className={`flex-1 overflow-y-auto py-3 px-0 space-y-1 scrollbar-hide ${
            sidebarCollapsed && !mobileOpen ? "px-2" : "px-3"
          }`}
        >
          {routeGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label];

            return (
              <div key={group.id} className="mb-2.5">
                {showLabels && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 mb-1 group transition-colors hover:bg-[rgba(248,244,242,0.04)]"
                    data-testid={`nav-group-${group.id}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: "var(--cth-admin-tuscany)" }}>
                      {group.label}
                    </span>
                    {isGroupCollapsed ? (
                      <ChevronRight size={10} style={{ color: "var(--cth-admin-tuscany)" }} />
                    ) : (
                      <ChevronDown size={10} style={{ color: "var(--cth-admin-tuscany)" }} />
                    )}
                  </button>
                )}

                {(!isGroupCollapsed || !showLabels) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.path);
                      const Icon = ICON_MAP[item.path] || Layers;
                      const isLocked = !checkPlanAccess(item.path);
                      const isCollapsedView = sidebarCollapsed && !mobileOpen && !hoverExpanded;

                      if (isCollapsedView) {
                        return (
                          <SidebarTooltip key={item.path} path={item.path} userPlan={plan} collapsed>
                            <NavLink
                              to={item.path}
                              data-testid={`nav-${item.path.replace("/", "")}`}
                              title={item.label}
                              className={`flex items-center justify-center p-3 rounded-2xl transition-all ${
                                active
                                  ? "cth-sidebar-active border"
                                  : isLocked
                                  ? "opacity-55 text-[rgba(248,244,242,0.62)] hover:bg-[rgba(248,244,242,0.08)] border border-transparent"
                                  : "text-[rgba(248,244,242,0.76)] hover:text-white hover:bg-[rgba(248,244,242,0.08)] border border-transparent"
                              }`}
                            >
                              <Icon
                                size={18}
                                className={active ? "text-white" : isLocked ? "text-[rgba(248,244,242,0.42)]" : ""}
                              />
                            </NavLink>
                          </SidebarTooltip>
                        );
                      }

                      if (isLocked) {
                        return (
                          <SidebarTooltip key={item.path} path={item.path} userPlan={plan}>
                            <div
                              data-testid={`nav-${item.path.replace("/", "")}`}
                              onClick={() => navigate(item.path)}
                              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-medium cursor-pointer opacity-45 text-[rgba(248,244,242,0.72)] hover:bg-[rgba(248,244,242,0.08)] transition-all group relative w-full border border-transparent"
                            >
                              <Icon size={16} className="text-[var(--cth-crimson)]" />
                              <span className="flex-1 truncate">{item.label}</span>
                              <Lock size={12} className="text-[var(--cth-tuscany)]" />
                            </div>
                          </SidebarTooltip>
                        );
                      }

                      const isSocialPlanner = item.path === "/social-media-manager";
                      const socialPlannerChildren = [
                          { id: "publish", label: "Publish Calendar", surface: "publish" },
                          { id: "create", label: "Create", surface: "create" },
                          { id: "grid", label: "Grid", surface: "grid" },
                        ];

                      return (
                        <SidebarTooltip key={item.path} path={item.path} userPlan={plan}>
                          <div className="w-full">
                            <NavLink
                              to={item.path}
                              data-testid={`nav-${item.path.replace("/", "")}`}
                              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group relative w-full ${
                                active
                                  ? "cth-sidebar-active border"
                                  : "text-[rgba(248,244,242,0.76)] hover:text-white hover:bg-[rgba(248,244,242,0.08)] border border-transparent"
                              }`}
                            >
                              {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "var(--cth-app-accent)" }} />
                              )}
                              <Icon
                                size={16}
                                className={
                                  active
                                    ? "text-white"
                                    : "text-[rgba(248,244,242,0.42)] group-hover:text-white"
                                }
                              />
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--cth-admin-accent)]/20 text-white border border-[var(--cth-admin-accent)]/20 flex-shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>

                            {isSocialPlanner && active && (
                              <div className="ml-7 mt-2 space-y-1">
                                {socialPlannerChildren.map((child) => (
                                  <NavLink
                                    key={child.id}
                                    to={`/social-media-manager?surface=${child.surface || child.id}`}
                                    data-testid={`nav-social-${child.id}`}
                                    className="block rounded-xl px-3 py-2 text-[11px] font-medium text-[rgba(248,244,242,0.72)] transition-all hover:bg-[rgba(248,244,242,0.08)] hover:text-white"
                                  >
                                    {child.label}
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </div>
                        </SidebarTooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

          <div
            className={`cth-sidebar-footer ${sidebarCollapsed && !mobileOpen ? "px-2 py-2" : "px-3 pt-3 pb-3"}`}
            style={{ borderTop: "1px solid rgba(199, 160, 157, 0.15)" }}
          >
            <button
              type="button"
              data-testid="sidebar-utility-toggle"
              onClick={() => setUtilityDrawerOpen((open) => !open)}
              className={`cth-sidebar-utility-toggle w-full flex items-center shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${
                sidebarCollapsed && !mobileOpen
                  ? "justify-center p-2.5"
                  : "justify-between gap-2 px-3 py-2.5"
              } rounded-xl text-xs transition-colors`}
              title="Workspace Controls"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Settings size={sidebarCollapsed && !mobileOpen ? 18 : 14} />
                {showLabels && (
                  <span className="flex min-w-0 flex-col text-left leading-tight">
                    <span className="truncate">Workspace Controls</span>
                    <span className="truncate text-[10px] font-medium opacity-[0.85]">
                      {plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan` : "Current Plan"}
                    </span>
                  </span>
                )}
              </span>
              {showLabels && (
                <ChevronDown
                  size={14}
                  className={`transition-transform ${utilityDrawerOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {utilityDrawerOpen && (
              <div className="cth-sidebar-utility-drawer" data-testid="sidebar-utility-drawer">

                {usage &&
                  (sidebarCollapsed && !mobileOpen ? (
                    <button
                      onClick={() => navigate("/billing")}
                      title={`AI Credits: ${usage.used}/${usage.limit === 999999 ? "∞" : usage.limit}`}
                      className="cth-sidebar-utility w-full flex items-center justify-center p-2.5 rounded-xl transition-colors"
                    >
                      <Zap
                        size={18}
                        className={usage.percentage >= 90 ? "text-red-500" : "text-[var(--cth-app-accent)]"}
                      />
                    </button>
                  ) : (
                    <div
                      data-testid="credit-usage-meter"
                      className="cth-sidebar-utility px-3 py-2.5 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Zap size={11} className="text-[var(--cth-app-accent)]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[rgba(248,244,242,0.92)]">
                            AI Credits
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            usage.percentage >= 90 ? "text-red-500" : "text-[rgba(248,244,242,0.95)]"
                          }`}
                        >
                          {usage.used}/{usage.limit === 999999 ? "∞" : usage.limit}
                        </span>
                      </div>
                    </div>
                  ))}

                <button data-testid="sidebar-billing-btn" onClick={() => navigate("/billing")} className="cth-sidebar-utility w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors">
                  <CreditCard size={14} />
                  {showLabels && <span>Billing</span>}
                </button>

                <button data-testid="sidebar-settings-btn" onClick={() => navigate("/settings")} className="cth-sidebar-utility w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors">
                  <Settings size={14} />
                  {showLabels && <span>Settings</span>}
                </button>

                <button data-testid="help-center-btn" onClick={() => setShowHelpCenter(true)} className="cth-sidebar-utility w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors">
                  <HelpCircle size={14} />
                  {showLabels && <span>Help Center</span>}
                </button>

                {showLabels && (
                  <button data-testid="keyboard-shortcuts-btn" onClick={() => setShowShortcuts(true)} className="cth-sidebar-utility w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] transition-colors">
                    <span className="px-1.5 py-0.5 rounded font-mono text-white" style={{ background: "rgba(199, 160, 157, 0.15)" }}>
                      &#8984;K
                    </span>
                    <span>Keyboard shortcuts</span>
                  </button>
                )}

                <button data-testid="theme-toggle" onClick={toggleTheme} className="cth-sidebar-utility w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors">
                  {isDark ? <Sun size={13} /> : <Moon size={13} />}
                  {showLabels && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
                </button>

                <button data-testid="sign-out-btn" onClick={() => signOut({ redirectUrl: "/" })} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--cth-app-accent)] hover:bg-[rgba(224,78,53,0.10)] text-xs font-semibold transition-colors">
                  <LogOut size={13} />
                  {showLabels && <span>Sign Out</span>}
                </button>
              </div>
            )}
          </div>
        {showShortcuts && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className="cth-shortcuts-modal rounded-2xl p-6 max-w-md w-full"
              style={{
                background: "var(--cth-app-panel)",
                border: "1px solid var(--cth-app-border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg cth-heading">
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 cth-muted"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(KEYBOARD_SHORTCUTS).map(([key, path]) => {
                  const labels = {
                    "/command-center": "Command Center",
                    "/brand-intelligence": "Brand Intelligence",
                    "/strategic-os": "Strategic OS",
                    "/content-studio": "Content Studio",
                    "/media-studio": "Media Studio",
                    "/crm": "CRM Suite",
                    "/calendar": "Calendar",
                    "/settings": "Settings",
                    "/billing": "Billing",
                  };

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: "1px solid var(--cth-border)" }}
                    >
                      <span className="text-sm cth-heading">{labels[path] || path}</span>
                      <span
                        className="px-2 py-1 rounded font-mono text-xs cth-heading"
                        style={{ background: "var(--cth-app-panel)" }}
                      >
                        &#8984;{key}
                      </span>
                    </div>
                  );
                })}

                <div
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--cth-border)" }}
                >
                  <span className="text-sm cth-heading">Toggle this menu</span>
                  <span
                    className="px-2 py-1 rounded text-[var(--cth-tuscany)] font-mono text-xs"
                    style={{ background: "var(--cth-app-panel)" }}
                  >
                    &#8984;K
                  </span>
                </div>
              </div>

              <p className="text-xs mt-4 text-center" style={{ color: "rgba(248, 244, 242, 0.68)" }}>
                Use Cmd (Mac) or Ctrl (Windows) + number to navigate quickly
              </p>
            </div>
          </div>
        )}

        <HelpCenter isOpen={showHelpCenter} onClose={() => setShowHelpCenter(false)} />

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-[rgba(248,244,242,0.9)] hover:bg-[rgba(248,244,242,0.08)] md:hidden"
            data-testid="mobile-close-btn"
          >
            <X size={20} />
          </button>
        )}
      </aside>
    </>
  );
}

export function TopBar({ title, subtitle, action }) {
  return (
    <div className="cth-topbar sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:px-7 md:py-5">
      <div className="min-w-0 flex-1">
        <h1
          className="text-xl md:text-[28px] leading-tight truncate"
          style={{
            fontWeight: 700,
            color: "var(--cth-app-ink)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs md:text-sm truncate"
            style={{
              margin: "6px 0 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="ml-3 flex items-center gap-2 md:gap-3 flex-shrink-0">
        {action}
        <NotificationBell />
      </div>
    </div>
  );
}

export function DashboardLayout({ children }) {
  return (
    <div className="cth-app-shell">
      <Sidebar />
      <div className="cth-app-main">
        <div className="cth-app-stage">
          <div className="cth-app-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
