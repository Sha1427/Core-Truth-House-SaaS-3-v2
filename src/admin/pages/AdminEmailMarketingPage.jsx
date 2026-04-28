import React from "react";
import { Mail, Send, ListChecks, ShieldCheck } from "lucide-react";

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-admin-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "rose" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
    plum: "bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{label}</div>
    </div>
  );
}

function StatusPill({ label, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]",
    success: "bg-[var(--cth-status-success-soft-bg)] text-[var(--cth-status-success-deep)]",
    warning: "bg-[var(--cth-status-warning-soft-bg)] text-[var(--cth-status-warning-deep)]",
    danger: "bg-[var(--cth-status-danger-soft-bg)] text-[var(--cth-status-danger-deep)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone] || tones.neutral}`}>
      {label}
    </span>
  );
}

export default function AdminEmailMarketingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Market</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Email Marketing</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-admin-muted)]">
          Centralize campaign oversight, sequence governance, and future outbound email controls inside the new separated admin shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Mail} label="Campaign Surface" value="Ready" tone="rose" />
        <StatCard icon={Send} label="Broadcast Logic" value="Planned" tone="plum" />
        <StatCard icon={ListChecks} label="Sequence Oversight" value="Next" tone="gold" />
        <StatCard icon={ShieldCheck} label="Admin Ownership" value="Active" tone="green" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard
          title="Email Marketing Framework"
          subtitle="What this page will own in the new admin system"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Campaign Oversight</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Future home for platform-level email campaign review, scheduling, and governance.
                  </div>
                </div>
                <StatusPill label="Scaffolded" tone="success" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Automation + Sequences</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Future controls for nurture flows, lifecycle emails, and sequence-level performance tracking.
                  </div>
                </div>
                <StatusPill label="Next migration" tone="warning" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Delivery Governance</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Future place for sender rules, send governance, and communication standards.
                  </div>
                </div>
                <StatusPill label="Planned" tone="neutral" />
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Email Workspace"
          subtitle="Native admin placeholder for campaign controls"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Campaign Queue</div>
              <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">
                Future home for scheduled campaigns, drafts, active sends, and campaign-level review.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Sequence Management</div>
              <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">
                Future controls for welcome series, nurture flows, and automated sequence governance.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Delivery Standards</div>
              <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">
                Future place for sender configuration, operational rules, and email system oversight.
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
