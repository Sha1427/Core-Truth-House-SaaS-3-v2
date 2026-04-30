import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Link2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import apiClient from "../../lib/apiClient";

const INITIAL_FORM = {
  label: "Brand Diagnostic CTA",
  target_url: "https://coretruthhouse.com/brand-diagnostic",
  campaign_id: "",
  message_id: "",
  contact_id: "",
  automation_id: "",
};

const QUICK_LINKS = [
  {
    label: "Brand Diagnostic CTA",
    target_url: "https://coretruthhouse.com/brand-diagnostic",
  },
  {
    label: "Brand Audit Intake",
    target_url: "https://coretruthhouse.com/brand-audit",
  },
  {
    label: "Consultation Booking",
    target_url: "https://coretruthhouse.com/contact",
  },
  {
    label: "Prospect Follow-up",
    target_url: "https://coretruthhouse.com/methodology",
  },
];

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cth-admin-border)] px-5 py-4">
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

function MetricCard({ icon: Icon, label, value, hint = "" }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--cth-admin-accent)_14%,var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{label}</div>
      {hint ? <div className="mt-2 text-xs text-[var(--cth-copy-muted)]">{hint}</div> : null}
    </div>
  );
}

function SmallButton({ onClick, children, icon: Icon = null, disabled = false, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-surface-elevated-soft)] disabled:opacity-50"
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function TrackingLinkRow({ link, onCopy }) {
  const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;

  return (
    <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">
              {link.label || "Diagnostic tracking link"}
            </div>
            <span className="rounded-full border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-accent)]">
              {Number(link.click_count || 0)} clicks
            </span>
          </div>

          <div className="mt-2 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
            Target: {link.target_url}
          </div>
          <div className="mt-1 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
            Tracking: {trackingUrl}
          </div>
          <div className="mt-2 text-xs text-[var(--cth-admin-muted)]">
            Created {formatDate(link.created_at)} · Last click {formatDate(link.last_clicked_at)}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <SmallButton onClick={() => onCopy(trackingUrl)} icon={Copy}>
            Copy
          </SmallButton>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-surface-elevated-soft)]"
          >
            <ExternalLink size={13} />
            Test
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminBrandAuditsPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [trackingLinks, setTrackingLinks] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [linksRes, clicksRes] = await Promise.allSettled([
        apiClient.get("/api/mail/tracking-links"),
        apiClient.get("/api/mail/clicks"),
      ]);

      if (linksRes.status === "fulfilled") {
        setTrackingLinks(normalizeList(linksRes.value, "tracking_links"));
      }

      if (clicksRes.status === "fulfilled") {
        setClicks(normalizeList(clicksRes.value, "clicks"));
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to load diagnostic tracking data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLinks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return trackingLinks;

    return trackingLinks.filter((link) =>
      [link.label, link.target_url, link.tracking_id, link.tracking_url]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [trackingLinks, query]);

  const diagnosticLinks = useMemo(() => {
    return trackingLinks.filter((link) =>
      String(link.label || "").toLowerCase().includes("diagnostic") ||
      String(link.target_url || "").toLowerCase().includes("brand-diagnostic") ||
      String(link.target_url || "").toLowerCase().includes("brand-audit")
    );
  }, [trackingLinks]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const applyQuickLink = (quick) => {
    setForm((current) => ({
      ...current,
      label: quick.label,
      target_url: quick.target_url,
    }));
  };

  const createLink = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice("");
    setError("");

    try {
      const targetUrl = form.target_url.trim();

      if (!targetUrl) {
        setError("Add a destination URL before creating a diagnostic tracking link.");
        setCreating(false);
        return;
      }

      const data = await apiClient.post("/api/mail/tracking-links", {
        ...form,
        target_url: targetUrl,
        label: form.label.trim() || "Diagnostic tracking link",
        provider: "core_truth_house_admin",
        metadata: {
          source: "admin_brand_audits",
          category: "diagnostic_tracking",
        },
      });

      const created = data?.tracking_link;
      setNotice("Diagnostic tracking link created.");
      setForm(INITIAL_FORM);
      await load();

      if (created?.tracking_url) {
        try {
          await navigator.clipboard.writeText(created.tracking_url);
          setNotice("Diagnostic tracking link created and copied to clipboard.");
        } catch {
          // Clipboard may be blocked. The link still appears in the table.
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to create diagnostic tracking link.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (value) => {
    setNotice("");
    setError("");

    try {
      await navigator.clipboard.writeText(value);
      setNotice("Tracking link copied to clipboard.");
    } catch {
      setError("Unable to copy automatically. Select and copy the link manually.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--cth-admin-border)] bg-[linear-gradient(135deg,var(--cth-admin-ink),#140016_68%,var(--cth-admin-accent)_155%)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              SuperAdmin · Brand Audits
            </p>
            <h1 className="m-0 font-serif text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              Diagnostic Tracking Links
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Track the diagnostic, audit, report-share, and consultation links that move prospects toward a structured brand build.
            </p>
          </div>

          <SmallButton onClick={load} icon={RefreshCw} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </SmallButton>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[rgba(175,0,42,0.22)] bg-[rgba(175,0,42,0.06)] px-4 py-3 text-sm font-semibold text-[var(--cth-admin-accent)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Link2} label="Diagnostic Links" value={diagnosticLinks.length} hint="Audit and diagnostic tracking links" />
        <MetricCard icon={MousePointerClick} label="Tracked Clicks" value={clicks.length} hint="Recorded click events" />
        <MetricCard icon={ShieldCheck} label="Access" value="Admin" hint="Role-gated, not customer-plan gated" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PanelCard
          title="Create Diagnostic Tracking Link"
          subtitle="Create links for diagnostics, audit report sharing, consultation CTAs, or prospect follow-up."
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(196,169,91,0.32)] bg-[rgba(196,169,91,0.12)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-ink)]">
              <ClipboardCheck size={13} />
              SuperAdmin
            </span>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {QUICK_LINKS.map((quick) => (
              <SmallButton key={quick.label} onClick={() => applyQuickLink(quick)} icon={BarChart3}>
                {quick.label}
              </SmallButton>
            ))}
          </div>

          <form className="grid gap-4" onSubmit={createLink}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-muted)]">
                Link Label
              </label>
              <input
                name="label"
                value={form.label}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none"
                placeholder="Brand Diagnostic CTA"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-muted)]">
                Destination URL
              </label>
              <input
                name="target_url"
                value={form.target_url}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none"
                placeholder="https://coretruthhouse.com/brand-diagnostic"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none"
                placeholder="Campaign ID optional"
              />
              <input
                name="contact_id"
                value={form.contact_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none"
                placeholder="Contact ID optional"
              />
            </div>

            <SmallButton type="submit" icon={Plus} disabled={creating}>
              {creating ? "Creating..." : "Create Diagnostic Link"}
            </SmallButton>
          </form>
        </PanelCard>

        <PanelCard
          title="Tracking Link Activity"
          subtitle="Review, copy, and test diagnostic links from the admin side."
          actions={
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cth-admin-muted)]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-64 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] py-2 pl-9 pr-3 text-xs text-[var(--cth-admin-ink)] outline-none"
                placeholder="Search links"
              />
            </div>
          }
        >
          {filteredLinks.length ? (
            <div className="grid gap-3">
              {filteredLinks.map((link) => (
                <TrackingLinkRow
                  key={link.id || link.tracking_id}
                  link={link}
                  onCopy={copyLink}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-6 text-sm text-[var(--cth-admin-muted)]">
              No diagnostic tracking links yet. Create one from the panel on the left.
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
