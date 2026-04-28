import React, { useEffect, useMemo, useState } from "react";
import { LifeBuoy, Inbox, AlertCircle, MessageSquare } from "lucide-react";
import apiClient from "../../lib/apiClient";
import API_PATHS from "../../lib/apiPaths";

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

function ArticleCard({ article }) {
  return (
    <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{article.title || "Untitled article"}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--cth-admin-muted)]">
            <span>{article.duration || "Read time unavailable"}</span>
            <span>•</span>
            <span>{article.tier || "All"}</span>
            {article.slug ? (
              <>
                <span>•</span>
                <span className="truncate">/{article.slug}</span>
              </>
            ) : null}
          </div>
        </div>
        <StatusPill label={article.is_published ? "Published" : "Draft"} tone={article.is_published ? "success" : "warning"} />
      </div>

      {Array.isArray(article.body) && article.body.length > 0 ? (
        <div className="mt-3 text-sm text-[var(--cth-admin-muted)] line-clamp-3">
          {article.body[0]}
        </div>
      ) : (
        <div className="mt-3 text-sm text-[var(--cth-copy-muted)]">No preview content yet.</div>
      )}
    </div>
  );
}

export default function AdminHelpDeskPage() {
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadKnowledgeBaseArticles() {
      setLoadingArticles(true);
      setArticlesError("");

      try {
        const response = await apiClient.get(API_PATHS.admin.knowledgeBase({ limit: 200 }));
        const items = Array.isArray(response?.articles) ? response.articles : [];

        if (!isMounted) return;
        setArticles(items);
      } catch (error) {
        if (!isMounted) return;
        setArticlesError(error?.message || "Failed to load knowledge base articles.");
      } finally {
        if (isMounted) {
          setLoadingArticles(false);
        }
      }
    }

    loadKnowledgeBaseArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedArticles = useMemo(() => {
    const groups = {};

    for (const article of articles) {
      const key = article?.section || article?.section_key || "Uncategorized";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(article);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [articles]);

  const publishedCount = articles.filter((article) => article?.is_published).length;
  const sectionCount = groupedArticles.length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
            <LifeBuoy size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Help Desk</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-admin-muted)]">
          Centralize support intake, escalation flow, and help-content handoff inside the new separated admin shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label="Published Articles" value={loadingArticles ? "..." : String(publishedCount)} tone="rose" />
        <StatCard icon={MessageSquare} label="Knowledge Sections" value={loadingArticles ? "..." : String(sectionCount)} tone="plum" />
        <StatCard icon={AlertCircle} label="Escalation Logic" value="Next" tone="gold" />
        <StatCard icon={LifeBuoy} label="Admin Ownership" value="Active" tone="green" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard
          title="Help Desk Framework"
          subtitle="What this page will own in the new admin system"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Support Intake Layer</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Future home for user issues, support requests, and routed help signals.
                  </div>
                </div>
                <StatusPill label="Scaffolded" tone="success" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Knowledge Base Deflection</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Published help content is now connected here first, before ticketing and escalation are added.
                  </div>
                </div>
                <StatusPill label={loadingArticles ? "Loading" : publishedCount > 0 ? "Connected" : "Empty"} tone={loadingArticles ? "warning" : publishedCount > 0 ? "success" : "neutral"} />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Admin Escalation Workflow</div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Future path for unresolved issues, owner assignment, and priority handling.
                  </div>
                </div>
                <StatusPill label="Planned" tone="neutral" />
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Support Workspace"
          subtitle="Knowledge Base articles currently available for help deflection"
        >
          <div className="grid gap-4">
            {loadingArticles ? (
              <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Loading articles...</div>
                <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">
                  Pulling published Knowledge Base content from the admin API.
                </div>
              </div>
            ) : articlesError ? (
              <div className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(254,242,242,1)] p-4">
                <div className="text-sm font-semibold text-[var(--cth-error-deep)]">Could not load articles</div>
                <div className="mt-2 text-sm text-[var(--cth-error-copy)]">{articlesError}</div>
              </div>
            ) : groupedArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">No published articles yet</div>
                <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">
                  Publish Knowledge Base content to start using this page as a support deflection dashboard.
                </div>
              </div>
            ) : (
              groupedArticles.map(([sectionName, sectionArticles]) => (
                <div key={sectionName} className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{sectionName}</div>
                      <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                        {sectionArticles.length} article{sectionArticles.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <StatusPill label="Available" tone="success" />
                  </div>

                  <div className="mt-4 grid gap-3">
                    {sectionArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
