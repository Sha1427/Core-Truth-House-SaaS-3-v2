import React from "react";
import { FileText, AlertTriangle } from "lucide-react";

function PanelCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[var(--cth-admin-border)] px-5 py-4">
        <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">{subtitle}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminBlogPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Market</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Blog Admin</h2>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          Platform blog admin is temporarily paused until the admin-wide article inventory endpoint is confirmed.
        </p>
      </section>

      <PanelCard
        title="Why this is paused"
        subtitle="Current blog CMS is tenant-scoped, not platform-scoped"
      >
        <div className="flex items-start gap-3 rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
          <AlertTriangle className="mt-0.5 text-[var(--cth-status-warning-deep)]" size={16} />
          <div className="text-sm text-[var(--cth-admin-ink)]">
            The existing Blog CMS is using user-scoped article behavior, so it is not a reliable platform admin inventory.
            The next step is confirming a true admin article list endpoint before reconnecting this page.
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Next implementation steps"
        subtitle="What needs to be confirmed before reconnecting Blog Admin"
      >
        <div className="grid gap-3 text-sm text-[var(--cth-admin-ink)]">
          <div>1. Confirm admin-wide blog article list endpoint</div>
          <div>2. Confirm article status contract for published vs draft</div>
          <div>3. Build read-first admin inventory page</div>
          <div>4. Add edit/publish actions only after backend contract is confirmed</div>
        </div>
      </PanelCard>
    </div>
  );
}
