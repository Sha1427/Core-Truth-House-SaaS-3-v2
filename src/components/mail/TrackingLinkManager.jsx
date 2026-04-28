import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Link2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import apiClient from "../../lib/apiClient";

const EMPTY_FORM = {
  label: "",
  target_url: "",
};

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

function matchesContext(link, context = {}) {
  const metadata = link.metadata || {};

  if (context.campaign_id && link.campaign_id !== context.campaign_id && metadata.campaign_id !== context.campaign_id) {
    return false;
  }

  if (context.offer_id && link.offer_id !== context.offer_id && metadata.offer_id !== context.offer_id) {
    return false;
  }

  if (context.platform && link.platform !== context.platform && metadata.platform !== context.platform) {
    return false;
  }

  if (context.post_id && link.post_id !== context.post_id && metadata.post_id !== context.post_id) {
    return false;
  }

  return true;
}

function TrackingLinkRow({ link, onCopy }) {
  const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;

  return (
    <article className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-sm font-semibold text-[var(--cth-admin-ink)]">
              {link.label || "Tracked link"}
            </h3>
            <span className="rounded-full border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-accent)]">
              {Number(link.click_count || 0)} clicks
            </span>
          </div>

          <p className="mt-2 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
            Target: {link.target_url}
          </p>
          <p className="mt-1 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
            Tracking: {trackingUrl}
          </p>
          <p className="mt-2 text-xs text-[var(--cth-admin-muted)]">
            Created {formatDate(link.created_at)} · Last click {formatDate(link.last_clicked_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCopy(trackingUrl)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ink)]"
          >
            <Copy size={14} />
            Copy
          </button>

          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ink)]"
          >
            <ExternalLink size={14} />
            Test
          </a>
        </div>
      </div>
    </article>
  );
}

export default function TrackingLinkManager({
  title = "Tracking Links",
  subtitle = "Create, copy, and measure tracked links for this workspace.",
  defaultLabel = "",
  defaultUrl = "",
  context = {},
  compact = false,
  autoEnsure = true,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    label: defaultLabel,
    target_url: defaultUrl,
  });
  const [trackingLinks, setTrackingLinks] = useState([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient.get("/api/mail/tracking-links");
      setTrackingLinks(normalizeList(data, "tracking_links"));
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to load tracking links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      label: current.label || defaultLabel,
      target_url: current.target_url || defaultUrl,
    }));
  }, [defaultLabel, defaultUrl]);

  const visibleLinks = useMemo(() => {
    const scoped = trackingLinks.filter((link) => matchesContext(link, context));
    const term = query.trim().toLowerCase();

    if (!term) return scoped;

    return scoped.filter((link) =>
      [link.label, link.target_url, link.tracking_id, link.tracking_url, link.platform, link.offer_id, link.campaign_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [trackingLinks, context, query]);

  const buildTrackingPayload = useCallback((targetUrl, label) => {
    return {
      label: label || defaultLabel || "Tracked link",
      target_url: targetUrl,
      campaign_id: context.campaign_id || "",
      message_id: context.message_id || "",
      contact_id: context.contact_id || "",
      automation_id: context.automation_id || "",
      offer_id: context.offer_id || "",
      platform: context.platform || "",
      post_id: context.post_id || "",
      source_type: context.source_type || context.source || "manual",
      source_id:
        context.source_id ||
        context.campaign_id ||
        context.offer_id ||
        context.post_id ||
        context.message_id ||
        context.automation_id ||
        "",
      link_role: context.link_role || "primary_cta",
      provider: context.provider || "core_truth_house",
      metadata: {
        ...(context.metadata || {}),
        source: context.source || "tracking_link_manager",
        source_type: context.source_type || context.source || "manual",
        source_id:
          context.source_id ||
          context.campaign_id ||
          context.offer_id ||
          context.post_id ||
          context.message_id ||
          context.automation_id ||
          "",
        link_role: context.link_role || "primary_cta",
        campaign_id: context.campaign_id || "",
        offer_id: context.offer_id || "",
        platform: context.platform || "",
        post_id: context.post_id || "",
      },
    };
  }, [context, defaultLabel]);

  const ensureDefaultTrackedLink = useCallback(async () => {
    const targetUrl = String(defaultUrl || "").trim();
    if (!autoEnsure || !targetUrl) return;

    const sourceId =
      context.source_id ||
      context.campaign_id ||
      context.offer_id ||
      context.post_id ||
      context.message_id ||
      context.automation_id ||
      "";

    if (!sourceId) return;

    try {
      await apiClient.post("/api/mail/tracking-links/ensure", buildTrackingPayload(
        targetUrl,
        defaultLabel || "Tracked link"
      ));
      await loadLinks();
    } catch (err) {
      console.warn("Tracking link auto-sync failed:", err);
    }
  }, [autoEnsure, defaultUrl, defaultLabel, context, buildTrackingPayload, loadLinks]);

  useEffect(() => {
    ensureDefaultTrackedLink();
  }, [ensureDefaultTrackedLink]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");

    const targetUrl = form.target_url.trim();
    if (!targetUrl) {
      setError("Add a destination URL before creating a tracked link.");
      return;
    }

    setCreating(true);

    try {
      const payload = buildTrackingPayload(
        targetUrl,
        form.label.trim() || defaultLabel || "Tracked link"
      );

      const data = await apiClient.post("/api/mail/tracking-links/ensure", payload);
      const created = data?.tracking_link;

      setForm({ ...EMPTY_FORM, label: defaultLabel, target_url: defaultUrl });
      setNotice("Tracked link created.");
      await loadLinks();

      if (created?.tracking_url) {
        try {
          await navigator.clipboard.writeText(created.tracking_url);
          setNotice("Tracked link created and copied to clipboard.");
        } catch {
          // Clipboard may be blocked. Link still appears in list.
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to create tracking link.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (value) => {
    setNotice("");
    setError("");

    try {
      await navigator.clipboard.writeText(value);
      setNotice("Tracking link copied to clipboard.");
    } catch {
      setError("Unable to copy automatically. Select and copy it manually.");
    }
  };

  return (
    <section className="rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.08)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 font-serif text-[1.35rem] font-semibold text-[var(--cth-admin-ink)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-[var(--cth-admin-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={loadLinks}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {notice ? (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-[rgba(175,0,42,0.22)] bg-[rgba(175,0,42,0.06)] px-4 py-3 text-sm font-semibold text-[var(--cth-admin-accent)]">
          {error}
        </div>
      ) : null}

      <div className={compact ? "grid gap-5" : "grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"}>
        <form className="grid gap-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
              Link Label
            </label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Example: Book the diagnostic"
              className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
              Destination URL
            </label>
            <input
              name="target_url"
              value={form.target_url}
              onChange={handleChange}
              placeholder="https://coretruthhouse.com/brand-diagnostic"
              className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(175,0,42,0.24)] bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {creating ? "Creating..." : "Create Tracked Link"}
          </button>
        </form>

        <div>
          <div className="relative mb-4">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cth-admin-muted)]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracking links"
              className="w-full rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] py-3 pl-11 pr-4 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
            />
          </div>

          {visibleLinks.length ? (
            <div className="grid gap-3">
              {visibleLinks.map((link) => (
                <TrackingLinkRow
                  key={link.id || link.tracking_id}
                  link={link}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-6 text-sm leading-6 text-[var(--cth-admin-muted)]">
              No tracking links for this context yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
