import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlugZap, RefreshCw, Server, Settings, ShieldCheck } from "lucide-react";
import apiClient from "../../lib/apiClient";

const DEFAULT_INTEGRATIONS = [
  {
    id: "gmail",
    provider: "gmail",
    display_name: "Gmail",
    status: "not_connected",
    connection_type: "oauth",
    description: "Connect a Google mailbox for inbox sync, sent mail, and tracked follow-ups.",
  },
  {
    id: "microsoft",
    provider: "microsoft",
    display_name: "Microsoft 365 / Outlook",
    status: "not_connected",
    connection_type: "oauth",
    description: "Connect Outlook or Microsoft 365 for workspace email visibility.",
  },
  {
    id: "smtp_imap",
    provider: "smtp_imap",
    display_name: "SMTP / IMAP",
    status: "planned",
    connection_type: "server",
    description: "Connect a custom mailbox for sending and inbox sync when OAuth is not available.",
  },
  {
    id: "resend",
    provider: "resend",
    display_name: "Resend",
    status: "planned",
    connection_type: "api_key",
    description: "Connect transactional email for confirmations, system messages, and click events.",
  },
];

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function IntegrationCard({ integration, onSetup }) {
  const isConnected = integration.status === "connected";
  const isPlanned = integration.status === "planned";

  return (
    <article className="rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.58)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(196,169,91,0.32)] bg-[rgba(196,169,91,0.10)] text-[var(--cth-admin-accent)]">
            {integration.connection_type === "server" ? <Server size={18} /> : <PlugZap size={18} />}
          </div>
          <div>
            <h3 className="m-0 text-sm font-semibold text-[var(--cth-admin-ink)]">
              {integration.display_name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--cth-admin-muted)]">
              {integration.description}
            </p>
          </div>
        </div>

        <span
          className={[
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
            isConnected
              ? "border-green-200 bg-green-50 text-green-700"
              : isPlanned
                ? "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]"
                : "border-[rgba(175,0,42,0.22)] bg-[rgba(175,0,42,0.06)] text-[var(--cth-admin-accent)]",
          ].join(" ")}
        >
          {isConnected ? "Connected" : isPlanned ? "Planned" : "Connect"}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--cth-admin-muted)]">
          <ShieldCheck size={14} />
          Workspace-scoped
        </div>

        <button
          type="button"
          onClick={() => onSetup(integration)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ink)]"
        >
          <Settings size={14} />
          {isConnected ? "Manage" : "Set up"}
        </button>
      </div>
    </article>
  );
}

export default function MailIntegrationsSettings() {
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === "connected").length,
    [integrations]
  );

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await apiClient.get("/api/mail/integrations");
      const saved = normalizeList(data, "integrations");

      if (saved.length) {
        const byProvider = new Map(DEFAULT_INTEGRATIONS.map((item) => [item.provider, item]));
        saved.forEach((item) => {
          byProvider.set(item.provider, {
            ...byProvider.get(item.provider),
            ...item,
          });
        });
        setIntegrations(Array.from(byProvider.values()));
      }
    } catch {
      setError("Unable to load mail integrations. This requires The Structure plan and above.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleSetupIntegration = async (integration) => {
    setError("");
    setNotice("");

    try {
      await apiClient.post("/api/mail/integrations", {
        provider: integration.provider,
        display_name: integration.display_name,
        status: integration.status === "connected" ? "connected" : "not_connected",
        connection_type: integration.connection_type,
        settings: {},
      });

      setNotice(`${integration.display_name} setup record saved. OAuth and credential wiring come next.`);
      await loadIntegrations();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to save integration setup.");
    }
  };

  return (
    <section className="rounded-[30px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_22px_56px_rgba(43,16,64,0.08)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cth-admin-accent)]">
            Structure plan and above
          </p>
          <h2 className="m-0 font-serif text-[1.45rem] font-semibold leading-tight text-[var(--cth-admin-ink)]">
            Mail Service Integrations
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--cth-admin-muted)]">
            Connect Gmail, Microsoft 365, SMTP/IMAP, or Resend for workspace communication.
          </p>
        </div>

        <button
          type="button"
          onClick={loadIntegrations}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(175,0,42,0.24)] bg-[rgba(175,0,42,0.08)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]"
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

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
            Connected
          </div>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--cth-admin-ink)]">
            {connectedCount}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
            Providers
          </div>
          <div className="mt-2 font-serif text-3xl font-semibold text-[var(--cth-admin-ink)]">
            {integrations.length}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
            Security
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-[var(--cth-admin-ink)]">
            Workspace scoped
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.provider || integration.id}
            integration={integration}
            onSetup={handleSetupIntegration}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 text-sm leading-6 text-[var(--cth-admin-muted)]">
        <strong className="text-[var(--cth-admin-ink)]">Security note:</strong> provider tokens should be encrypted on the backend, scoped to the workspace, and never exposed as raw credentials in the browser.
      </div>
    </section>
  );
}
