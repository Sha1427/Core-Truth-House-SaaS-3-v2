import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useColors, useTheme } from '../context/ThemeContext';
import { WorkspaceSelector } from './WorkspaceSelector';
import { usePlan } from '../context/PlanContext';
import { useUser, useClerk } from '../hooks/useAuth';
import { SIDEBAR_GROUPS, getRoutesByGroup } from '../config/routeConfig';
import { SidebarTooltip } from "./ui/tooltip";
import axios from 'axios';
import {
  ShieldAlert, LayoutDashboard, Layers, BookOpen, Activity, ClipboardCheck,
  Award, Zap, Brain, Target, Search, Columns, Share2, DollarSign,
  PenTool, Image, Sparkles, Hash, Package, Gift, Rocket, Megaphone,
  Workflow, Radio, FileText, Calendar, Globe, Mail, Users, PhoneCall,
  TrendingUp, BarChart2, PlayCircle, FolderOpen, PlusCircle, CreditCard,
  Settings, ChevronDown, ChevronRight, Sun, Moon, LogOut, Download, Lock,
  ShieldCheck, Wand2, HelpCircle, Menu, PanelLeftClose, PanelLeft, X, Database,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import HelpCenter from './help/HelpCenter';
import { SubscriptionProvider } from './shared/PlanGate';
import DemoBanner from './DemoBanner';

const API = import.meta.env.VITE_BACKEND_URL;

// Map route paths to lucide icons
const ICON_MAP = {
  '/admin':              ShieldAlert,
  '/prompt-engine':      Wand2,
  '/command-center':     LayoutDashboard,
  '/dashboard':          LayoutDashboard,
  '/my-data':            Database,
  '/brand-intelligence': Brain,
  '/brand-foundation':   Layers,
  '/brand-memory':       BookOpen,
  '/brand-health':       Activity,
  '/audit':              ClipboardCheck,
  '/scorecard':          Award,
  '/strategic-os':       Zap,
  '/audience-psychology': Brain,
  '/differentiation':    Target,
  '/competitor-analysis': Search,
  '/content-pillars':    Columns,
  '/platform-strategy':  Share2,
  '/monetization':       DollarSign,
  '/campaign-builder':   Megaphone,
  '/automations':        Workflow,
  '/content-studio':     PenTool,
  '/media-studio':       Image,
  '/identity-studio':    Sparkles,
  '/prompt-hub':         Hash,
  '/keyword-generator':  Search,
  '/export':             Download,
  '/offer-builder':      Package,
  '/systems-builder':    Gift,
  '/launch-planner':     Rocket,
  '/social-media':       Radio,
  '/blog-cms':           FileText,
  '/calendar':           Calendar,
  '/seo':                Globe,
  '/digest':             Mail,
  '/contacts':           Users,
  '/crm':                PhoneCall,
  '/pipeline-forecast':  TrendingUp,
  '/analytics':          BarChart2,
  '/team':               Users,
  '/tutorials':          PlayCircle,
  '/training':           PlayCircle,
  '/documents':          FolderOpen,
  '/addon-requests':     PlusCircle,
  '/billing':            CreditCard,
  '/settings':           Settings,
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'OPS_ADMIN', 'BILLING_ADMIN', 'CONTENT_ADMIN', 'SUPPORT_ADMIN'];
const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'OPS_ADMIN'];

const KEYBOARD_SHORTCUTS = {
  '1': '/command-center',
  '2': '/brand-intelligence',
  '3': '/strategic-os',
  '4': '/content-studio',
  '5': '/media-studio',
  '6': '/crm',
  '7': '/calendar',
  '8': '/settings',
  '9': '/billing',
};

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id || 'default';
  const { canAccess: checkPlanAccess, isSuperAdmin, plan, userRole } = usePlan();

  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSuperAdminRole = SUPER_ADMIN_ROLES.includes(userRole) || isSuperAdmin;

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (API && userId !== 'default') {
      axios.get(`${API}/api/usage/summary?workspace_id=default`).then(r => setUsage(r.data)).catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        if (KEYBOARD_SHORTCUTS[e.key]) { e.preventDefault(); navigate(KEYBOARD_SHORTCUTS[e.key]); }
        if (e.key === 'k') { e.preventDefault(); setShowShortcuts(prev => !prev); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleGroup = (label) => setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const sidebarWidth = sidebarCollapsed ? 'w-[68px] min-w-[68px]' : 'w-[240px] min-w-[240px]';
  const showLabels = !sidebarCollapsed || mobileOpen;

  return (
    <>
      {/* Demo Mode Banner */}
      <DemoBanner />
      
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile Menu Button */}
      <button onClick={() => setMobileOpen(true)} className="fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-[#2b1040] border border-white/10 text-white" data-testid="mobile-menu-btn">
        <Menu size={20} />
      </button>

      <aside
        className={`flex flex-col h-screen border-r overflow-hidden transition-all duration-300 ease-in-out ${sidebarWidth} ${mobileOpen ? 'fixed left-0 top-0 z-50 w-[240px]' : 'hidden md:flex'} md:relative md:flex`}
        style={{ background: 'linear-gradient(180deg, #2b1040, #1c0828)', borderColor: 'rgba(199, 160, 157, 0.2)' }}
        data-testid="sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(199, 160, 157, 0.15)' }}>
          <div className={`flex items-center gap-2.5 ${sidebarCollapsed && !mobileOpen ? 'justify-center w-full' : ''}`}>
            <img src="/cth-logo.png" alt="Core Truth House" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            {showLabels && (
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight font-serif truncate">Core Truth House</p>
                <p className="text-[#C7A09D] text-[10px] uppercase tracking-widest">Brand OS</p>
              </div>
            )}
          </div>
          {showLabels && (
            <button onClick={() => mobileOpen ? setMobileOpen(false) : setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#C7A09D] hover:text-white hover:bg-white/10 transition-colors hidden md:flex"
              data-testid="sidebar-collapse-btn" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {sidebarCollapsed && !mobileOpen && (
          <button onClick={() => setSidebarCollapsed(false)} className="mx-auto my-2 p-1.5 rounded-lg text-[#C7A09D] hover:text-white hover:bg-white/10 transition-colors" data-testid="sidebar-expand-btn" title="Expand sidebar">
            <PanelLeft size={16} />
          </button>
        )}

        {showLabels && (
          <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(199, 160, 157, 0.15)' }}>
            <WorkspaceSelector />
          </div>
        )}

        {/* Navigation — driven from routeConfig */}
        <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 scrollbar-hide ${sidebarCollapsed && !mobileOpen ? 'px-2' : 'px-3'}`}>
          {SIDEBAR_GROUPS.map(group => {
            // Admin group: show if user has visible items (Command Center is visible to all)
            if (group.id === 'admin') {
              // Don't hide the whole group — Command Center is visible to all users
            }

            const items = getRoutesByGroup(group.id).filter(item => {
              if (item.adminOnly && !isSuperAdminRole) return false;
              if (item.superAdminOnly && !isSuperAdminRole) return false;
              return true;
            });

            if (items.length === 0) return null;

            const isGroupCollapsed = collapsedGroups[group.label];

            return (
              <div key={group.id} className="mb-1">
                {showLabels && (
                  <button onClick={() => toggleGroup(group.label)} className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5 group"
                    data-testid={`nav-group-${group.id}`}>
                    <span className="text-[#C7A09D] text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                      {group.label}
                    </span>
                    {isGroupCollapsed ? <ChevronRight size={10} className="text-[#C7A09D]" /> : <ChevronDown size={10} className="text-[#C7A09D]" />}
                  </button>
                )}

                {(!isGroupCollapsed || !showLabels) && (
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const active = isActive(item.path);
                      const Icon = ICON_MAP[item.path] || Layers;
                      const isLocked = !checkPlanAccess(item.path);
                      const isCollapsedView = sidebarCollapsed && !mobileOpen;

                      // Collapsed — icon only
                      if (isCollapsedView) {
                        return (
                          <SidebarTooltip key={item.path} path={item.path} userPlan={plan} collapsed>
                            <NavLink to={item.path} data-testid={`nav-${item.path.replace('/', '')}`} title={item.label}
                              className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
                                active ? 'bg-[#E04E35]/15 text-white border border-[#E04E35]/20'
                                  : isLocked ? 'opacity-45 text-[#C7A09D] hover:bg-[#231035] border border-transparent'
                                    : 'text-[#C7A09D] hover:text-white hover:bg-[#231035] border border-transparent'
                              }`}>
                              <Icon size={18} className={active ? 'text-[#E04E35]' : isLocked ? 'text-[#9B1B30]' : ''} />
                            </NavLink>
                          </SidebarTooltip>
                        );
                      }

                      // Locked item
                      if (isLocked) {
                        return (
                          <SidebarTooltip key={item.path} path={item.path} userPlan={plan}>
                            <div data-testid={`nav-${item.path.replace('/', '')}`} onClick={() => navigate(item.path)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer opacity-45 text-[#C7A09D] hover:bg-[#231035] transition-all group relative w-full">
                              <Icon size={16} className="text-[#9B1B30]" />
                              <span className="flex-1 truncate">{item.label}</span>
                              <Lock size={12} className="text-[#C7A09D]" />
                            </div>
                          </SidebarTooltip>
                        );
                      }

                      // Normal nav item
                      return (
                        <SidebarTooltip key={item.path} path={item.path} userPlan={plan}>
                          <NavLink to={item.path} data-testid={`nav-${item.path.replace('/', '')}`}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative w-full ${
                              active ? 'bg-[#E04E35]/15 text-white border border-[#E04E35]/20'
                                : 'text-[#C7A09D] hover:text-white hover:bg-[#231035] border border-transparent'
                            }`}>
                            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#E04E35] rounded-r-full" />}
                            <Icon size={16} className={active ? 'text-[#E04E35]' : 'text-[#9B1B30] group-hover:text-[#e04e35]'} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E04E35]/20 text-[#E04E35] border border-[#E04E35]/20 flex-shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        </SidebarTooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom bar */}
        <div className={`pt-3 pb-4 space-y-2 ${sidebarCollapsed && !mobileOpen ? 'px-2' : 'px-3'}`} style={{ borderTop: '1px solid rgba(199, 160, 157, 0.15)' }}>
          {usage && (
            sidebarCollapsed && !mobileOpen ? (
              <button onClick={() => navigate('/billing')} title={`AI Credits: ${usage.used}/${usage.limit === 999999 ? '\u221E' : usage.limit}`}
                className="w-full flex items-center justify-center p-2.5 rounded-xl transition-colors" style={{ background: '#231035', border: '1px solid rgba(199, 160, 157, 0.15)' }}>
                <Zap size={18} className={usage.percentage >= 90 ? 'text-red-500' : 'text-[#E04E35]'} />
              </button>
            ) : (
              <div data-testid="credit-usage-meter" className="px-3 py-2.5 rounded-xl" style={{ background: '#231035', border: '1px solid rgba(199, 160, 157, 0.15)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} className="text-[#E04E35]" />
                    <span className="text-[#C7A09D] text-[10px] font-bold uppercase tracking-widest">AI Credits</span>
                  </div>
                  <span className={`text-xs font-bold ${usage.percentage >= 90 ? 'text-red-500' : 'text-white'}`}>
                    {usage.used}/{usage.limit === 999999 ? '\u221E' : usage.limit}
                  </span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(199, 160, 157, 0.2)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(usage.percentage, 100)}%`, backgroundColor: usage.percentage >= 90 ? '#ef4444' : usage.percentage >= 70 ? '#f59e0b' : '#E04E35' }} />
                </div>
                <p className="text-[#b0a0b8] text-[10px]">
                  {usage.remaining === 0 ? 'No credits remaining' : `${usage.limit === 999999 ? 'Unlimited' : usage.remaining} remaining this month`}
                </p>
              </div>
            )
          )}

          <button data-testid="help-center-btn" onClick={() => setShowHelpCenter(true)} title="Help & Tutorials"
            className={`w-full flex items-center ${sidebarCollapsed && !mobileOpen ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2'} rounded-xl text-[#b0a0b8] hover:text-white text-xs transition-colors`}
            style={{ background: '#231035', border: '1px solid rgba(199, 160, 157, 0.15)' }}>
            <HelpCircle size={sidebarCollapsed && !mobileOpen ? 18 : 14} />
            {showLabels && <span>Help & Tutorials</span>}
          </button>

          {showLabels && (
            <button data-testid="keyboard-shortcuts-btn" onClick={() => setShowShortcuts(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#b0a0b8] hover:text-white text-[10px] transition-colors"
              style={{ background: '#231035', border: '1px solid rgba(199, 160, 157, 0.15)' }}>
              <span className="px-1.5 py-0.5 rounded text-[#C7A09D] font-mono" style={{ background: 'rgba(199, 160, 157, 0.15)' }}>&#8984;K</span>
              <span>Keyboard shortcuts</span>
            </button>
          )}

          <button data-testid="theme-toggle" onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}
            className={`w-full flex items-center ${sidebarCollapsed && !mobileOpen ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2'} rounded-xl text-[#C7A09D] hover:text-white text-xs transition-colors`}
            style={{ border: '1px solid rgba(199, 160, 157, 0.15)' }}>
            {isDark ? <Sun size={sidebarCollapsed && !mobileOpen ? 18 : 13} /> : <Moon size={sidebarCollapsed && !mobileOpen ? 18 : 13} />}
            {showLabels && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button data-testid="sign-out-btn" onClick={() => signOut({ redirectUrl: '/' })} title="Sign Out"
            className={`w-full flex items-center ${sidebarCollapsed && !mobileOpen ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2'} rounded-xl text-[#E04E35] hover:bg-[#E04E35]/10 text-xs font-semibold transition-colors`}>
            <LogOut size={sidebarCollapsed && !mobileOpen ? 18 : 13} />
            {showLabels && <span>Sign Out</span>}
          </button>
        </div>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowShortcuts(false)}>
            <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: '#1c0828', border: '1px solid rgba(199, 160, 157, 0.2)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg font-serif">Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="text-[#C7A09D] hover:text-white p-1">&times;</button>
              </div>
              <div className="space-y-2">
                {Object.entries(KEYBOARD_SHORTCUTS).map(([key, path]) => {
                  const labels = { '/dashboard': 'Command Center', '/brand-foundation': 'Brand Foundation', '/strategic-os': 'Strategic OS', '/content-studio': 'Content Studio', '/media-studio': 'Media Studio', '/crm': 'CRM Suite', '/calendar': 'Calendar', '/settings': 'Settings', '/billing': 'Billing' };
                  return (
                    <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(199, 160, 157, 0.1)' }}>
                      <span className="text-[#C7A09D] text-sm">{labels[path]}</span>
                      <span className="px-2 py-1 rounded text-[#C7A09D] font-mono text-xs" style={{ background: '#231035' }}>&#8984;{key}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(199, 160, 157, 0.1)' }}>
                  <span className="text-[#C7A09D] text-sm">Toggle this menu</span>
                  <span className="px-2 py-1 rounded text-[#C7A09D] font-mono text-xs" style={{ background: '#231035' }}>&#8984;K</span>
                </div>
              </div>
              <p className="text-[#b0a0b8] text-xs mt-4 text-center">Use Cmd (Mac) or Ctrl (Windows) + number to navigate quickly</p>
            </div>
          </div>
        )}

        <HelpCenter isOpen={showHelpCenter} onClose={() => setShowHelpCenter(false)} />

        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg text-white hover:bg-white/10 md:hidden" data-testid="mobile-close-btn">
            <X size={20} />
          </button>
        )}
      </aside>
    </>
  );
}

export function TopBar({ title, subtitle, action }) {
  const colors = useColors();
  return (
    <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-7 md:py-4" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.darkest }}>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg md:text-2xl truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{title}</h1>
        {subtitle && <p className="text-xs md:text-[13px] truncate" style={{ color: colors.tuscany, margin: '2px 0 0 0' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
        {action}
        <NotificationBell />
      </div>
    </div>
  );
}

export function DashboardLayout({ children }) {
  const colors = useColors();
  return (
    <SubscriptionProvider>
      <div style={{ display: 'flex', height: '100vh', background: colors.darkest, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', color: colors.textPrimary }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</div>
      </div>
    </SubscriptionProvider>
  );
}

