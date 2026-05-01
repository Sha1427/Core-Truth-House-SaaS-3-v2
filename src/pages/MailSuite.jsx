import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  ExternalLink,
  FileText,
  Inbox,
  Link2,
  Lock,
  Mail,
  MailCheck,
  MousePointerClick,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Tags,
  Users,
  X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer";
import MailIntegrationsSettings from "../components/mail/MailIntegrationsSettings";
import apiClient from "../lib/apiClient";

const MAILBOXES = [
  { id: "inbox", label: "Inbox", icon: Inbox, helper: "New and active conversations" },
  { id: "sent", label: "Sent", icon: Send, helper: "Outbound communication" },
  { id: "drafts", label: "Drafts", icon: FileText, helper: "Messages in progress" },
  { id: "starred", label: "Starred", icon: Star, helper: "Important conversations" },
  { id: "archive", label: "Archive", icon: Archive, helper: "Closed or stored threads" },
  { id: "clicks", label: "Click Signals", icon: MousePointerClick, helper: "Tracked link activity" },
];

const INITIAL_TRACKING_FORM = {
  label: "",
  target_url: "",
  campaign_id: "",
  message_id: "",
  contact_id: "",
  automation_id: "",
};

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0%";
  return `${Math.round(number)}%`;
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mailboxCount(messages, mailbox) {
  return messages.filter((message) => message.mailbox === mailbox).length;
}

function getMessageTitle(message) {
  return message.subject || message.label || "Untitled message";
}

function getMessagePreview(message) {
  return message.preview || message.body || message.url || "No preview available.";
}

function ActionButton({ children, icon: Icon, onClick, variant = "secondary", type = "button", disabled = false }) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ borderRadius: 4 }}
      className={[
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition",
        isPrimary
          ? "bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] hover:brightness-110"
          : "border border-[var(--cth-command-border)] bg-transparent text-[var(--cth-command-ink)] hover:bg-[var(--cth-command-panel-soft)]",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-[30px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_22px_56px_rgba(43,16,64,0.08)] ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 font-serif text-[1.45rem] font-semibold leading-tight text-[var(--cth-admin-ink)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-[var(--cth-admin-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MailboxButton({ item, active, count, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-start justify-between rounded border px-4 py-3 text-left transition",
        active
          ? "border-[color-mix(in_srgb,var(--cth-command-crimson)_28%,transparent)] bg-[color-mix(in_srgb,var(--cth-command-crimson)_8%,transparent)] text-[var(--cth-command-ink)]"
          : "border-transparent bg-transparent text-[var(--cth-command-muted)] hover:border-[var(--cth-command-border)] hover:bg-[var(--cth-command-panel-soft)]",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0">
          <Icon size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{item.label}</span>
          <span className="mt-0.5 block text-xs leading-5 opacity-70">{item.helper}</span>
        </span>
      </span>
      <span className="ml-3 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-2 py-0.5 text-xs font-semibold opacity-80">
        {count}
      </span>
    </button>
  );
}

function EmptyMailbox({ activeBox }) {
  return (
    <div
      className="grid min-h-[310px] place-items-center border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-panel-soft)] p-8 text-center"
      style={{ borderRadius: 4 }}
    >
      <div className="max-w-md">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[color-mix(in_srgb,var(--cth-command-gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--cth-command-gold)_10%,transparent)] text-[var(--cth-command-crimson)]"
          style={{ borderRadius: 4 }}
        >
          <Mail size={26} />
        </div>
        <h3 className="m-0 font-serif text-2xl font-semibold text-[var(--cth-command-ink)]">
          No {activeBox === "clicks" ? "click signals" : "messages"} yet
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--cth-command-muted)]">
          Connect a mailbox, create a tracked link, or send a campaign message to begin collecting communication signals.
        </p>
      </div>
    </div>
  );
}

function MessageRow({ message, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ borderRadius: 4 }}
      className={[
        "w-full border p-4 text-left transition",
        active
          ? "border-[color-mix(in_srgb,var(--cth-command-crimson)_32%,transparent)] bg-[color-mix(in_srgb,var(--cth-command-crimson)_7%,transparent)]"
          : "border-[var(--cth-command-border)] bg-[var(--cth-command-panel)] hover:bg-[var(--cth-command-panel-soft)]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cth-admin-ink)]">
            {getMessageTitle(message)}
          </div>
          <div className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
            {getMessagePreview(message)}
          </div>
        </div>
        <span className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
          {message.status || message.mailbox || "draft"}
        </span>
      </div>
    </button>
  );
}

function MessageDetail({ message, activeBox }) {
  if (!message) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-[26px] border border-dashed border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.44)] p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.07)] text-[var(--cth-admin-accent)]">
            <MailCheck size={25} />
          </div>
          <h3 className="m-0 font-serif text-2xl font-semibold text-[var(--cth-admin-ink)]">
            Message Center
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
            Select a message to read, review context, and prepare the next move.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.62)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--cth-admin-border)] pb-5">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-accent)]">
            {activeBox === "clicks" ? "Click signal" : "Conversation"}
          </p>
          <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[var(--cth-admin-ink)]">
            {getMessageTitle(message)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
            {message.sender || message.provider || "Workspace signal"} · {formatDate(message.created_at || message.timestamp)}
          </p>
        </div>
        <span className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
          {message.status || message.mailbox || activeBox}
        </span>
      </div>

      <div className="py-5">
        <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--cth-admin-ink)]">
          {message.body || message.preview || message.url || "No full message body is available yet."}
        </p>
      </div>

      <div className="grid gap-3 border-t border-[var(--cth-admin-border)] pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">Linked contact</div>
            <div className="mt-1 text-sm font-semibold text-[var(--cth-admin-ink)]">{message.contact_name || message.sender || "Not linked"}</div>
          </div>
          <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">Campaign</div>
            <div className="mt-1 text-sm font-semibold text-[var(--cth-admin-ink)]">{message.campaign_id || "Not linked"}</div>
          </div>
        </div>

        <textarea
          placeholder="Internal note or reply draft..."
          className="min-h-[120px] w-full resize-y rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
        />

        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Send} variant="primary">Reply</ActionButton>
          <ActionButton icon={Archive}>Archive</ActionButton>
          <ActionButton icon={Star}>Mark important</ActionButton>
        </div>
      </div>
    </div>
  );
}

function AutomationTemplateCard({ template, onCreate, creating }) {
  const locked = Boolean(template.locked);
  const Icon =
    template.id === "offer_launch_flow"
      ? Rocket
      : template.id === "brand_welcome_flow"
      ? MailCheck
      : template.id === "weekly_founder_notes"
      ? FileText
      : Users;

  return (
    <article
      className={[
        "rounded-2xl border p-5",
        locked
          ? "border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.48)] opacity-75"
          : "border-[rgba(175,0,42,0.22)] bg-[rgba(255,250,247,0.72)]",
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(196,169,91,0.35)] bg-[rgba(196,169,91,0.10)] text-[var(--cth-admin-accent)]">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="m-0 font-serif text-xl font-semibold text-[var(--cth-admin-ink)]">
              {template.name}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-accent)]">
              {template.category}
            </p>
          </div>
        </div>

        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-muted)]">
            <Lock size={12} />
            House
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-green-700">
            <CheckCircle2 size={12} />
            Ready
          </span>
        )}
      </div>

      <p className="text-sm leading-6 text-[var(--cth-admin-muted)]">
        {template.description}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.58)] p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
          Flow steps
        </div>
        <div className="grid gap-2">
          {(template.steps || []).slice(0, 4).map((step, index) => (
            <div key={`${template.id}-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--cth-admin-ink)]">
                Day {step.day}: {step.subject}
              </span>
              <span className="text-[var(--cth-admin-muted)]">{step.type}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={locked || creating}
        onClick={() => onCreate(template)}
        style={{ borderRadius: 4 }}
        className={[
          "mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition",
          locked
            ? "cursor-not-allowed border border-[var(--cth-command-border)] bg-transparent text-[var(--cth-command-muted)]"
            : "bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] hover:brightness-110",
        ].join(" ")}
      >
        {locked ? <Lock size={15} /> : <Sparkles size={15} />}
        {locked ? "Upgrade to House" : creating ? "Creating..." : "Use Template"}
      </button>
    </article>
  );
}

function TrackingLinkRow({ link, onCopy }) {
  const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;

  return (
    <article className="rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.62)] p-4">
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
          <ActionButton icon={Copy} onClick={() => onCopy(trackingUrl)}>Copy</ActionButton>
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

function MailDrawer({ open, onOpenChange, title, description, children }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[88vh] max-w-5xl overflow-hidden rounded-t-[34px] border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)]">
        <DrawerHeader className="border-b border-[var(--cth-admin-border)] px-6 pb-5 pt-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DrawerTitle className="font-serif text-3xl font-semibold text-[var(--cth-admin-ink)]">
                {title}
              </DrawerTitle>
              {description ? (
                <DrawerDescription className="mt-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
                  {description}
                </DrawerDescription>
              ) : null}
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-2 text-[var(--cth-admin-ink)]"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}


function ComposeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(13,0,16,0.72)] px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-[34px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] shadow-[0_34px_90px_rgba(13,0,16,0.36)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--cth-admin-border)] px-6 py-5">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cth-admin-accent)]">
              Mailboxes
            </p>
            <h2 className="mt-1 font-serif text-3xl font-semibold leading-tight text-[var(--cth-admin-ink)]">
              Compose Message
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
              Write a focused message from the mailbox workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-2 text-[var(--cth-admin-ink)]"
            aria-label="Close compose modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="grid gap-4 p-6">
          <input
            placeholder="To"
            className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <input
            placeholder="Subject"
            className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <textarea
            placeholder="Write the message..."
            className="min-h-[260px] w-full resize-y rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--cth-admin-border)] pt-5">
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={FileText}>Save draft</ActionButton>
              <ActionButton icon={Clock}>Schedule</ActionButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={onClose}>Cancel</ActionButton>
              <ActionButton icon={Send} variant="primary">Send</ActionButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MailSuite() {
  const [activeBox, setActiveBox] = useState("inbox");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingTemplateId, setCreatingTemplateId] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeDrawer, setActiveDrawer] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState("");

  const [messages, setMessages] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [trackingLinks, setTrackingLinks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [trackingForm, setTrackingForm] = useState(INITIAL_TRACKING_FORM);

  const loadMailSuite = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [templatesData, automationsData, messagesData, clicksData, trackingLinksData] =
        await Promise.allSettled([
          apiClient.get("/api/mail/automations/templates"),
          apiClient.get("/api/mail/automations"),
          apiClient.get("/api/mail/messages"),
          apiClient.get("/api/mail/clicks"),
          apiClient.get("/api/mail/tracking-links"),
        ]);

      if (templatesData.status === "fulfilled") {
        setTemplates(normalizeList(templatesData.value, "templates"));
      }

      if (automationsData.status === "fulfilled") {
        setAutomations(normalizeList(automationsData.value, "automations"));
      }

      if (messagesData.status === "fulfilled") {
        setMessages(normalizeList(messagesData.value, "messages"));
      }

      if (clicksData.status === "fulfilled") {
        setClicks(normalizeList(clicksData.value, "clicks"));
      }

      if (trackingLinksData.status === "fulfilled") {
        setTrackingLinks(normalizeList(trackingLinksData.value, "tracking_links"));
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to load Mail Suite data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMailSuite();
  }, [loadMailSuite]);

  const stats = useMemo(() => {
    const sent = mailboxCount(messages, "sent");
    const drafts = mailboxCount(messages, "drafts");
    const inbox = mailboxCount(messages, "inbox");

    return {
      inbox,
      sent,
      drafts,
      tracking_links: trackingLinks.length,
      tracked_clicks: clicks.length,
      automations: automations.length,
      click_rate: sent ? Math.round((clicks.length / sent) * 100) : 0,
    };
  }, [messages, clicks, trackingLinks, automations]);

  const mailboxCounts = useMemo(() => {
    return {
      inbox: stats.inbox,
      sent: stats.sent,
      drafts: stats.drafts,
      starred: mailboxCount(messages, "starred"),
      archive: mailboxCount(messages, "archive"),
      clicks: clicks.length,
    };
  }, [messages, clicks, stats]);

  const filteredMessages = useMemo(() => {
    const source = activeBox === "clicks"
      ? clicks.map((click) => ({
          id: click.id || click.click_id || `${click.label}-${click.url}`,
          subject: click.label || "Tracked click",
          preview: click.url || "No URL stored.",
          status: click.provider || "click",
          mailbox: "clicks",
          ...click,
        }))
      : messages.filter((message) => (message.mailbox || "inbox") === activeBox);

    const term = query.trim().toLowerCase();
    if (!term) return source;

    return source.filter((message) =>
      [message.subject, message.sender, message.preview, message.body, message.url, message.label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [messages, clicks, activeBox, query]);

  const selectedMessage = useMemo(() => {
    if (!filteredMessages.length) return null;
    return (
      filteredMessages.find((message) => String(message.id || message.subject) === String(selectedMessageId)) ||
      filteredMessages[0]
    );
  }, [filteredMessages, selectedMessageId]);

  useEffect(() => {
    if (!filteredMessages.length) {
      setSelectedMessageId("");
      return;
    }

    const stillExists = filteredMessages.some((message) => String(message.id || message.subject) === String(selectedMessageId));
    if (!stillExists) {
      const first = filteredMessages[0];
      setSelectedMessageId(String(first.id || first.subject || ""));
    }
  }, [filteredMessages, selectedMessageId]);

  const filteredTrackingLinks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return trackingLinks;

    return trackingLinks.filter((link) =>
      [link.label, link.target_url, link.tracking_id, link.tracking_url]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [trackingLinks, query]);

  const handleCreateAutomation = async (template) => {
    setCreatingTemplateId(template.id);
    setError("");
    setNotice("");

    try {
      await apiClient.post("/api/mail/automations", {
        template_id: template.id,
        name: template.name,
        status: "draft",
      });
      setNotice(`${template.name} automation created as a draft.`);
      await loadMailSuite();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to create automation. This may require The House plan.");
    } finally {
      setCreatingTemplateId("");
    }
  };

  const handleTrackingFormChange = (event) => {
    const { name, value } = event.target;
    setTrackingForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateTrackingLink = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const targetUrl = trackingForm.target_url.trim();
    if (!targetUrl) {
      setError("Add a destination URL before creating a tracked link.");
      return;
    }

    setCreatingLink(true);

    try {
      const data = await apiClient.post("/api/mail/tracking-links", {
        ...trackingForm,
        target_url: targetUrl,
        label: trackingForm.label.trim() || "Tracked link",
        provider: "core_truth_house",
      });

      const created = data?.tracking_link;
      setTrackingForm(INITIAL_TRACKING_FORM);
      setNotice("Tracked link created. Copy it into your email, automation, or campaign.");
      await loadMailSuite();

      if (created?.tracking_url) {
        try {
          await navigator.clipboard.writeText(created.tracking_url);
          setCopiedUrl(created.tracking_url);
          setNotice("Tracked link created and copied to clipboard.");
        } catch {
          // Clipboard can fail on some browsers. The link still exists.
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to create tracking link.");
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopy = async (value) => {
    setError("");
    setNotice("");

    try {
      await navigator.clipboard.writeText(value);
      setCopiedUrl(value);
      setNotice("Tracking link copied to clipboard.");
    } catch {
      setError("Unable to copy link automatically. You can still select and copy it manually.");
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Mail Suite"
        subtitle="Mailbox, message center, follow-up signals, and brand-aligned communication."
      />

      <div className="space-y-6 px-4 pb-10 pt-4 md:px-7">
        <section className="overflow-hidden rounded-[34px] border border-[var(--cth-admin-border-dark)] bg-[linear-gradient(135deg,#33033C_0%,#140016_62%,#AF002A_160%)] p-6 text-white shadow-[0_28px_70px_rgba(43,16,64,0.22)] md:p-7">
          <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                Message Command Center
              </p>
              <h1 className="m-0 max-w-4xl font-serif text-[2.35rem] font-semibold leading-[1] tracking-[-0.035em] text-white md:text-[4rem]">
                Keep every message tied to the brand, the offer, and the next move.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/75">
                Mail Suite now centers the mailbox and message center first. Templates, tracking, automations, and settings stay close, but out of the way until you need them.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Sparkles} onClick={() => setActiveDrawer("templates")}>
                Templates
              </ActionButton>
              <ActionButton icon={Link2} onClick={() => setActiveDrawer("tracking")}>
                Tracking
              </ActionButton>
              <ActionButton icon={Settings} onClick={() => setActiveDrawer("settings")}>
                Settings
              </ActionButton>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Inbox", stats.inbox, "Messages"],
              ["Sent", stats.sent, "Outbound"],
              ["Drafts", stats.drafts, "In progress"],
              ["Links", stats.tracking_links, "Tracked"],
              ["Clicks", stats.tracked_clicks, `Rate ${formatPercent(stats.click_rate)}`],
              ["Flows", stats.automations, "Automations"],
            ].map(([label, value, helper]) => (
              <div key={label} className="rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.6)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">{label}</div>
                <div className="mt-1 font-serif text-3xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
                <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">{helper}</div>
              </div>
            ))}
          </div>
        </section>

        {notice ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[rgba(175,0,42,0.22)] bg-[rgba(175,0,42,0.06)] px-4 py-3 text-sm font-semibold text-[var(--cth-admin-accent)]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 2xl:grid-cols-[320px_minmax(360px,0.95fr)_minmax(420px,1.05fr)]">
          <Panel
            title="Mailboxes"
            subtitle="Start here. Choose the signal you want to manage."
            action={
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={Plus} variant="primary" onClick={() => setComposeOpen(true)}>
                  Compose
                </ActionButton>
                <ActionButton icon={RefreshCw} onClick={loadMailSuite}>
                  Refresh
                </ActionButton>
              </div>
            }
            className="2xl:sticky 2xl:top-6 2xl:self-start"
          >
            <div className="grid gap-1">
              {MAILBOXES.map((item) => (
                <MailboxButton
                  key={item.id}
                  item={item}
                  active={activeBox === item.id}
                  count={mailboxCounts[item.id] || 0}
                  onClick={() => setActiveBox(item.id)}
                />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.56)] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--cth-admin-ink)]">
                <Tags size={16} className="text-[var(--cth-admin-accent)]" />
                Message labels
              </div>
              <div className="flex flex-wrap gap-2">
                {["Lead", "Client", "Campaign", "Follow-up"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            title="Message List"
            subtitle="Search and select a conversation."
            action={
              <div className="flex items-center gap-2 text-sm text-[var(--cth-admin-muted)]">
                <Clock size={15} />
                {loading ? "Loading..." : `${filteredMessages.length} visible`}
              </div>
            }
          >
            <div className="mb-5">
              <div className="relative w-full">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cth-admin-muted)]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search messages, links, or clicks"
                  className="w-full rounded-full border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] py-3 pl-11 pr-4 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
                />
              </div>
            </div>

            {filteredMessages.length ? (
              <div className="grid max-h-[680px] gap-3 overflow-y-auto pr-1">
                {filteredMessages.map((message) => {
                  const id = String(message.id || message.subject || message.preview);
                  return (
                    <MessageRow
                      key={id}
                      message={message}
                      active={String(selectedMessage?.id || selectedMessage?.subject || selectedMessage?.preview) === id}
                      onClick={() => setSelectedMessageId(id)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyMailbox activeBox={activeBox} />
            )}
          </Panel>

          <Panel
            title="Message Center"
            subtitle="Read, review, reply, and connect the conversation to the larger system."
          >
            <MessageDetail message={selectedMessage} activeBox={activeBox} />
          </Panel>
        </div>
      </div>

      <MailDrawer
        open={activeDrawer === "compose"}
        onOpenChange={(open) => setActiveDrawer(open ? "compose" : "")}
        title="Compose Message"
        description="Create a message without leaving the mailbox workspace."
      >
        <form className="grid gap-4">
          <input
            placeholder="To"
            className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <input
            placeholder="Subject"
            className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <textarea
            placeholder="Write the message..."
            className="min-h-[240px] w-full resize-y rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Send} variant="primary">Send</ActionButton>
            <ActionButton icon={Clock}>Schedule</ActionButton>
            <ActionButton icon={FileText}>Save draft</ActionButton>
          </div>
        </form>
      </MailDrawer>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />

      <MailDrawer
        open={activeDrawer === "templates"}
        onOpenChange={(open) => setActiveDrawer(open ? "templates" : "")}
        title="Templates and Automations"
        description="Use proven flows without crowding the main mailbox."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.length ? (
            templates.map((template) => (
              <AutomationTemplateCard
                key={template.id}
                template={template}
                creating={creatingTemplateId === template.id}
                onCreate={handleCreateAutomation}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--cth-admin-border)] p-6 text-sm text-[var(--cth-admin-muted)]">
              {loading ? "Loading automation templates..." : "No automation templates returned yet."}
            </div>
          )}
        </div>
      </MailDrawer>

      <MailDrawer
        open={activeDrawer === "tracking"}
        onOpenChange={(open) => setActiveDrawer(open ? "tracking" : "")}
        title="Tracking Links"
        description="Create and manage links used in emails, campaigns, and follow-up sequences."
      >
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Create Tracked Link" subtitle="Make a link measurable before placing it inside a message.">
            <form className="grid gap-4" onSubmit={handleCreateTrackingLink}>
              <input
                name="label"
                value={trackingForm.label}
                onChange={handleTrackingFormChange}
                placeholder="Example: Book the diagnostic"
                className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
              />
              <input
                name="target_url"
                value={trackingForm.target_url}
                onChange={handleTrackingFormChange}
                placeholder="https://coretruthhouse.com/brand-diagnostic"
                className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="campaign_id"
                  value={trackingForm.campaign_id}
                  onChange={handleTrackingFormChange}
                  placeholder="Campaign ID optional"
                  className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
                />
                <input
                  name="automation_id"
                  value={trackingForm.automation_id}
                  onChange={handleTrackingFormChange}
                  placeholder="Automation ID optional"
                  className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
                />
              </div>
              <ActionButton type="submit" icon={Plus} variant="primary" disabled={creatingLink}>
                {creatingLink ? "Creating..." : "Create Tracked Link"}
              </ActionButton>
              {copiedUrl ? (
                <p className="m-0 break-all rounded-2xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
                  Copied: {copiedUrl}
                </p>
              ) : null}
            </form>
          </Panel>

          <Panel
            title="Tracking Activity"
            subtitle="Links created for emails, automations, campaigns, and follow-up sequences."
            action={<ActionButton icon={RefreshCw} onClick={loadMailSuite}>Refresh</ActionButton>}
          >
            {filteredTrackingLinks.length ? (
              <div className="grid gap-3">
                {filteredTrackingLinks.map((link) => (
                  <TrackingLinkRow
                    key={link.id || link.tracking_id}
                    link={link}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            ) : (
              <div
                className="border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-panel-soft)] p-6 text-sm leading-6 text-[var(--cth-command-muted)]"
                style={{ borderRadius: 4 }}
              >
                No tracked links yet. Create one, then place it in an email, launch flow, or campaign.
              </div>
            )}
          </Panel>
        </div>
      </MailDrawer>

      <MailDrawer
        open={activeDrawer === "settings"}
        onOpenChange={(open) => setActiveDrawer(open ? "settings" : "")}
        title="Mail Settings"
        description="Connect providers and manage the communication layer."
      >
        <MailIntegrationsSettings />
      </MailDrawer>
    </DashboardLayout>
  );
}
