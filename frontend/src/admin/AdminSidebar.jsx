import React from "react";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_GROUPS, ADMIN_UTILITY_ITEMS } from "./adminNavConfig";

function NavItem({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-[var(--cth-admin-accent)] text-white"
            : "text-[var(--cth-on-dark)] hover:bg-[var(--cth-sidebar-hover)]"
        }`
      }
    >
      <Icon size={18} />
      <span className="flex-1">{item.label}</span>
      {item.badge ? <span className="text-xs">{item.badge}</span> : null}
    </NavLink>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="w-[300px] min-w-[300px] h-screen bg-[linear-gradient(180deg,var(--cth-surface-sidebar-start),var(--cth-surface-sidebar-end))] border-r border-[var(--cth-surface-sidebar-border)] text-white flex flex-col">
      <div className="px-6 py-6 border-b border-[var(--cth-surface-sidebar-divider)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--cth-admin-muted)]">Core Truth House</p>
        <h2 className="mt-2 text-3xl font-semibold">Admin</h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="px-3 mb-2 text-xs uppercase tracking-[0.18em] text-[var(--cth-surface-sidebar-muted)]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--cth-surface-sidebar-divider)] px-3 py-4 space-y-1">
        {ADMIN_UTILITY_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
}
