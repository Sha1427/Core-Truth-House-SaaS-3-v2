import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../lib/apiClient";
import {
  BookOpen,
  Search,
  LifeBuoy,
  ArrowRight,
  Layers3,
  Compass,
  Building2,
  Crown,
  BellRing,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Heading,
  List,
  Bold,
  Minus,
  Pilcrow,
} from "lucide-react";

const DEFAULT_SECTIONS = {
  quickStart: {
    title: "Start Here",
    icon: "Compass",
    articles: [],
  },
  foundation: {
    title: "Foundation",
    icon: "Layers3",
    articles: [],
  },
  structure: {
    title: "Structure",
    icon: "Building2",
    articles: [],
  },
  house: {
    title: "House",
    icon: "BookOpen",
    articles: [],
  },
  estate: {
    title: "Estate",
    icon: "Crown",
    articles: [],
  },
};

const SECTION_META = {
  quickStart: { title: "Start Here", icon: Compass },
  foundation: { title: "Foundation", icon: Layers3 },
  structure: { title: "Structure", icon: Building2 },
  house: { title: "House", icon: BookOpen },
  estate: { title: "Estate", icon: Crown },
};

const TIER_OPTIONS = ["All", "Foundation", "Structure", "House", "Estate"];
const SECTION_OPTIONS = Object.entries(SECTION_META).map(([key, value]) => ({
  value: key,
  label: value.title,
}));
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const SORT_OPTIONS = [
  { value: "manual", label: "Manual Order" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

const SECTION_KEY_ALIASES = {
  "start-here": "quickStart",
  "quick-start": "quickStart",
  quickstart: "quickStart",
  quickStart: "quickStart",
  "foundation-tier": "foundation",
  foundation: "foundation",
  "structure-tier": "structure",
  structure: "structure",
  "house-tier": "house",
  house: "house",
  "estate-tier": "estate",
  estate: "estate",
};

function normalizeSectionKey(value) {
  const raw = String(value || "").trim();
  return SECTION_KEY_ALIASES[raw] || raw;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function SearchInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--cth-admin-border)] bg-white px-3 py-2">
      <Search size={15} className="text-[var(--cth-copy-muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search guides and docs..."
        className="w-full bg-transparent text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-copy-muted)]"
      />
    </div>
  );
}

function TextInput({ value, onChange, placeholder = "" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-sm text-[var(--cth-admin-ink)] outline-none"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-sm text-[var(--cth-admin-ink)] outline-none"
    >
      {options.map((option) => (
        <option key={option.value || option} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  );
}

function TextArea({ value, onChange, rows = 6, placeholder = "" }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-sm text-[var(--cth-admin-ink)] outline-none"
    />
  );
}

function TierBadge({ tier }) {
  const normalizedTier = String(tier || "All")
    .replace("Foundation+", "Foundation")
    .replace("Structure+", "Structure")
    .replace("House+", "House");

  const styles = {
    All: "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]",
    Foundation: "bg-[rgba(45,106,79,0.12)] text-[var(--cth-status-success)]",
    Structure: "bg-[var(--cth-kb-structure-bg)] text-[var(--cth-kb-structure-text)]",
    House: "bg-[rgba(118,59,91,0.12)] text-[var(--cth-admin-ruby)]",
    Estate: "bg-[var(--cth-kb-estate-bg)] text-[var(--cth-kb-estate-text)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${styles[normalizedTier] || styles.All}`}>
      {normalizedTier}
    </span>
  );
}

function PublishBadge({ published }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${
        published
          ? "bg-[var(--cth-status-success-soft-bg)] text-[var(--cth-status-success-deep)]"
          : "bg-[var(--cth-status-warning-soft-bg)] text-[var(--cth-status-warning-deep)]"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function SectionTab({ section, active, count = 0, onClick }) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active
          ? "bg-[var(--cth-admin-accent)]/15 text-[var(--cth-admin-accent)]"
          : "text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)] hover:text-[var(--cth-admin-ink)]"
      }`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon size={16} />
        <span>{section.title}</span>
      </span>

      <span
        className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          active
            ? "bg-[var(--cth-admin-accent)] text-white"
            : "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function QuickLinkCard({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4 transition hover:bg-[var(--cth-admin-panel)] hover:border-[var(--cth-admin-border)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]">
          <Icon size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
          <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{description}</div>
        </div>
      </div>
    </Link>
  );
}

function flattenSections(sections) {
  return Object.entries(sections).flatMap(([sectionKey, sectionValue]) =>
    sectionValue.articles.map((article) => ({
      ...article,
      sectionKey,
      section: sectionValue.title,
    }))
  );
}

export default function AdminKnowledgeBasePage() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("quickStart");
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("manual");
  const [form, setForm] = useState({
    id: "",
    title: "",
    slug: "",
    tier: "All",
    duration: "3 min read",
    sectionKey: "quickStart",
    bodyText: "",
    is_published: true,
  });

  const buildSectionsFromArticles = (articles = []) => {
    const next = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));

    Object.keys(next).forEach((key) => {
      next[key].articles = [];
    });

    articles.forEach((article) => {
      const rawSectionKey = article.section_key || article.sectionKey || "quickStart";
      const sectionKey = normalizeSectionKey(rawSectionKey);
      if (!next[sectionKey]) return;

      next[sectionKey].articles.push({
        id: article.id,
        title: article.title,
        tier: article.tier || "All",
        duration: article.duration || "3 min read",
        section: article.section || next[sectionKey].title,
        sectionKey,
        body: Array.isArray(article.body) ? article.body : [],
        is_published: Boolean(article.is_published),
        slug: article.slug || "",
        created_at: article.created_at || null,
        updated_at: article.updated_at || null,
        sort_order: Number.isFinite(article.sort_order) ? article.sort_order : 0,
      });
    });

    return next;
  };

  const loadKnowledgeBase = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter === "published") params.is_published = true;
      if (statusFilter === "draft") params.is_published = false;

      const res = await apiClient.request("GET", "/api/admin/knowledge-base/", {
        params,
      });

      const articles = Array.isArray(res?.articles) ? res.articles : [];
      setSections(buildSectionsFromArticles(articles));
    } catch (err) {
      console.error("Failed to load knowledge base from API:", err);
      setSections(DEFAULT_SECTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBase();
  }, [statusFilter]);

  const activeSectionMeta = SECTION_META[activeSection];

  const sortArticles = (items = []) => {
    const nextItems = [...items];

    nextItems.sort((a, b) => {
      if (sortOrder === "manual") {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }

      if (sortOrder === "title_asc") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }

      if (sortOrder === "title_desc") {
        return String(b.title || "").localeCompare(String(a.title || ""));
      }

      const aDate = new Date(
        sortOrder === "oldest"
          ? (a.created_at || a.updated_at || 0)
          : (a.updated_at || a.created_at || 0)
      ).getTime();

      const bDate = new Date(
        sortOrder === "oldest"
          ? (b.created_at || b.updated_at || 0)
          : (b.updated_at || b.created_at || 0)
      ).getTime();

      return sortOrder === "oldest" ? aDate - bDate : bDate - aDate;
    });

    return nextItems;
  };

  const totalArticleCount = useMemo(() => {
    return flattenSections(sections).length;
  }, [sections]);

  const sectionArticleCount = sections?.[activeSection]?.articles?.length || 0;

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    return sortArticles(
      flattenSections(sections).filter((article) => {
        const haystack = `${article.title} ${article.section} ${article.body.join(" ")}`.toLowerCase();
        return haystack.includes(q);
      })
    );
  }, [query, sections, sortOrder]);

  const visibleArticles =
    query.trim().length >= 2
      ? searchResults
      : sortArticles(
          flattenSections({
            [activeSection]: sections[activeSection],
          })
        );

  const activeArticle =
    visibleArticles.find((a) => a.id === selectedArticleId) ||
    visibleArticles[0] ||
    null;

  const openCreate = () => {
    setEditorMode("create");
    setForm({
      id: "",
      title: "",
      slug: "",
      tier: "All",
      duration: "3 min read",
      sectionKey: activeSection,
      bodyText: "",
      is_published: true,
    });
    setEditorOpen(true);
  };

  const openEdit = (article) => {
    setEditorMode("edit");
    setForm({
      id: article.id,
      title: article.title,
      slug: article.slug || "",
      tier: article.tier,
      duration: article.duration,
      sectionKey: article.sectionKey,
      bodyText: article.body.join("\n\n"),
      is_published: Boolean(article.is_published),
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    if (!title) {
      alert("Title is required.");
      return;
    }

    const sectionKey = form.sectionKey;
    const sectionTitle = SECTION_META[sectionKey]?.title || "Start Here";

    const payload = {
      title,
      slug: (form.slug || slugify(title)).trim(),
      tier: form.tier,
      duration: form.duration.trim() || "3 min read",
      section_key: sectionKey,
      section: sectionTitle,
      body: form.bodyText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
      is_published: Boolean(form.is_published),
    };

    try {
      if (editorMode === "edit" && form.id) {
        await apiClient.request("PUT", `/api/admin/knowledge-base/${form.id}`, {
          body: payload,
        });
      } else {
        await apiClient.request("POST", "/api/admin/knowledge-base/", {
          body: payload,
        });
      }

      await loadKnowledgeBase();
      setActiveSection(sectionKey);
      setSelectedArticleId(form.id || null);
      setEditorOpen(false);
    } catch (err) {
      console.error("Failed to save knowledge base article:", err);
      alert(err?.message || "Failed to save article");
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"?`)) return;

    try {
      await apiClient.request("DELETE", `/api/admin/knowledge-base/${article.id}`);

      await loadKnowledgeBase();

      if (selectedArticleId === article.id) {
        setSelectedArticleId(null);
      }
    } catch (err) {
      console.error("Failed to delete knowledge base article:", err);
      alert(err?.message || "Failed to delete article");
    }
  };

  const moveArticle = async (sectionKey, articleId, direction) => {
    const sectionArticles = [...(sections?.[sectionKey]?.articles || [])];
    const currentIndex = sectionArticles.findIndex((article) => article.id === articleId);

    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionArticles.length) return;

    const reordered = [...sectionArticles];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    try {
      await Promise.all(
        reordered.map((article, index) =>
          apiClient.request("PUT", `/api/admin/knowledge-base/${article.id}`, {
            body: { sort_order: index },
          })
        )
      );

      await loadKnowledgeBase();
      setActiveSection(sectionKey);
      setSelectedArticleId(articleId);
    } catch (err) {
      console.error("Failed to reorder articles:", err);
      alert(err?.message || "Failed to reorder articles");
    }
  };

  const insertIntoBody = (snippet) => {
    setForm((f) => {
      const current = f.bodyText || "";
      const needsSpacer = current.trim() ? "\n\n" : "";
      return {
        ...f,
        bodyText: `${current}${needsSpacer}${snippet}`,
      };
    });
  };

  const resetKnowledgeBase = () => {
    alert("Reset is disabled now that the Knowledge Base is backed by the admin API.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Market</p>
              <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Knowledge Base</h2>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--cth-admin-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus size={15} />
              Add Article
            </button>
            <button
              onClick={resetKnowledgeBase}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--cth-admin-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--cth-admin-muted)] transition hover:bg-[var(--cth-admin-panel)]"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          This Knowledge Base is now an admin-managed authoring surface with draft and published visibility controls.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-ruby)]">
            Total Articles: {totalArticleCount}
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
            This Section: {sectionArticleCount}
          </span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <PanelCard title="Help Navigation" subtitle="Searchable knowledge structure">
          <div className="space-y-4">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setSelectedArticleId(null);
              }}
            />

            <SelectInput
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />

            <SelectInput
              value={sortOrder}
              onChange={setSortOrder}
              options={SORT_OPTIONS}
            />

            <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs text-[var(--cth-admin-muted)]">
              {sortOrder === "manual"
                ? "Manual Order is active. Use ↑ and ↓ to control article order inside this section."
                : "List order is currently controlled by the selected sort mode."}
            </div>

            {query.trim().length < 2 ? (
              <div className="space-y-3">
                {Object.entries(SECTION_META).map(([sectionKey, sectionValue]) => {
                  const sectionArticles = sortArticles(sections?.[sectionKey]?.articles || []);
                  const isActiveSection = activeSection === sectionKey;
                  const sectionCount = sectionArticles.length;

                  return (
                    <div key={sectionKey} className="space-y-2">
                      <SectionTab
                        section={sectionValue}
                        active={isActiveSection}
                        count={sectionCount}
                        onClick={() => {
                          if (isActiveSection) {
                            setActiveSection(sectionKey);
                            setSelectedArticleId(null);
                            return;
                          }

                          setActiveSection(sectionKey);
                          setSelectedArticleId(null);
                        }}
                      />

                      {isActiveSection ? (
                        <div className="ml-2 space-y-1.5 border-l border-[var(--cth-admin-border)] pl-3">
                          {sectionArticles.length === 0 ? (
                            <div className="text-xs text-[var(--cth-copy-muted)]">No articles in this section.</div>
                          ) : (
                            sectionArticles.map((article, index) => {
                              const isFirst = index === 0;
                              const isLast = index === sectionArticles.length - 1;

                              return (
                                <div
                                  key={article.id}
                                  className={`rounded-lg border px-2.5 py-2 transition ${
                                    selectedArticleId === article.id || (!selectedArticleId && activeArticle?.id === article.id)
                                      ? "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)]"
                                      : "border-transparent bg-transparent hover:border-[var(--cth-admin-border)] hover:bg-[var(--cth-admin-panel)]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <button
                                      onClick={() => {
                                        setActiveSection(sectionKey);
                                        setSelectedArticleId(article.id);
                                      }}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <div className="text-[13px] font-medium leading-5 text-[var(--cth-admin-ink)] line-clamp-2">{article.title}</div>
                                      {sortOrder === "manual" ? (
                                        <div className="mt-0.5 text-[10px] text-[var(--cth-copy-muted)]">
                                          Position {index + 1}
                                        </div>
                                      ) : null}
                                    </button>

                                    <div className="flex items-center gap-1.5 self-center">
                                      <span className="inline-flex items-center rounded-full bg-[var(--cth-admin-panel-alt)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--cth-admin-muted)]">
                                        {article.is_published ? "Published" : "Draft"}
                                      </span>

                                      {sortOrder === "manual" ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => moveArticle(sectionKey, article.id, "up")}
                                            disabled={isFirst}
                                            className="rounded-md border border-[var(--cth-admin-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)] disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Move up"
                                          >
                                            ↑
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => moveArticle(sectionKey, article.id, "down")}
                                            disabled={isLast}
                                            className="rounded-md border border-[var(--cth-admin-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)] disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Move down"
                                          >
                                            ↓
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <div className="text-sm text-[var(--cth-admin-muted)]">No help articles found.</div>
                ) : (
                  searchResults.slice(0, 10).map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        setActiveSection(article.sectionKey);
                        setSelectedArticleId(article.id);
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-3 text-left hover:bg-[var(--cth-admin-panel)]"
                    >
                      <div>
                        <p className="text-sm text-[var(--cth-admin-ink)]">{article.title}</p>
                        <p className="text-xs text-[var(--cth-copy-muted)]">{article.section}</p>
                      </div>
                      <ArrowRight size={14} className="text-[var(--cth-copy-muted)]" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </PanelCard>

        <div className="space-y-4">
          <PanelCard
            title={activeArticle ? activeArticle.title : "Knowledge Article"}
            subtitle={activeArticle ? `${activeArticle.section} • ${activeArticle.duration}` : "Select an article"}
            actions={
              activeArticle ? (
                <div className="flex items-center gap-2">
                  <TierBadge tier={activeArticle.tier} />
                  <PublishBadge published={Boolean(activeArticle.is_published)} />
                  <button
                    onClick={() => openEdit(activeArticle)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(activeArticle)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[rgba(239,68,68,0.25)] bg-white px-3 py-1.5 text-xs text-[var(--cth-status-danger-deep)] hover:bg-[rgba(239,68,68,0.06)]"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              ) : null
            }
          >
            {loading ? (
              <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
            ) : !activeArticle ? (
              <div className="text-sm text-[var(--cth-admin-muted)]">No article selected.</div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">
                    Connected Help Center Mode
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--cth-copy-body-soft)]">
                    This article now lives inside the admin support flow. Read the documentation here first. If the issue needs triage or operational follow-up, move directly into Help Desk or Notifications from the actions below.
                  </p>
                </div>

                <div className="space-y-4">
                  {activeArticle.body.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-8 text-[var(--cth-copy-body-soft)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </PanelCard>

          <PanelCard title="Quick Actions" subtitle="Move from documentation into action">
            <div className="grid gap-3 md:grid-cols-2">
              <QuickLinkCard
                to="/admin/help-desk"
                icon={LifeBuoy}
                title="Open Help Desk"
                description="Go to the support inbox to triage or resolve a live issue."
              />
              <QuickLinkCard
                to="/admin/notifications"
                icon={BellRing}
                title="Open Notifications"
                description="Review operational signals and recent support activity."
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cth-copy-muted)]">
                Support escalation logic
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--cth-copy-body-soft)]">
                <li>• Stay in Knowledge Base when the answer is already documented</li>
                <li>• Move to Help Desk when there is a user issue or message that needs handling</li>
                <li>• Move to Notifications when the issue creates an operational signal that needs monitoring</li>
              </ul>
            </div>
          </PanelCard>
        </div>
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,8,40,0.55)] p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--cth-admin-border)] px-5 py-4">
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">
                    {editorMode === "create" ? "Add Knowledge Article" : "Edit Knowledge Article"}
                  </div>
                  <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                    Manage Knowledge Base content directly from the admin API.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setEditorOpen(false)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                  >
                    <ArrowRight size={13} className="rotate-180" />
                    Back to Article
                  </button>

                  <span className="inline-flex items-center rounded-full bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-ruby)]">
                    Edit Mode
                  </span>

                  <span className="inline-flex items-center rounded-full bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
                    Live Preview On
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-2 text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                aria-label="Close editor"
                title="Close editor"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Title</div>
                  <TextInput
                    value={form.title}
                    onChange={(value) =>
                      setForm((f) => ({
                        ...f,
                        title: value,
                        slug: editorMode === "create" && (!f.slug || f.slug === slugify(f.title))
                          ? slugify(value)
                          : f.slug,
                      }))
                    }
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Read Time</div>
                  <TextInput value={form.duration} onChange={(value) => setForm((f) => ({ ...f, duration: value }))} placeholder="e.g. 5 min read" />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Slug</div>
                <TextInput
                  value={form.slug}
                  onChange={(value) => setForm((f) => ({ ...f, slug: slugify(value) }))}
                  placeholder="article-url-slug"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Section</div>
                  <SelectInput value={form.sectionKey} onChange={(value) => setForm((f) => ({ ...f, sectionKey: value }))} options={SECTION_OPTIONS} />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Tier</div>
                  <SelectInput value={form.tier} onChange={(value) => setForm((f) => ({ ...f, tier: value }))} options={TIER_OPTIONS} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                <label className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Published</div>
                    <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                      Turn this off to keep the article in draft mode.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_published: !f.is_published }))}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                      form.is_published ? "bg-[var(--cth-status-success-deep)]" : "bg-[var(--cth-admin-border)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        form.is_published ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Article Body</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => insertIntoBody("## New Section Heading")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-2.5 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        title="Insert heading"
                      >
                        <Heading size={13} />
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertIntoBody("- First bullet\n- Second bullet\n- Third bullet")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-2.5 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        title="Insert bullet list"
                      >
                        <List size={13} />
                        List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertIntoBody("**Bold emphasis point**")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-2.5 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        title="Insert bold emphasis"
                      >
                        <Bold size={13} />
                        Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => insertIntoBody("---")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-2.5 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        title="Insert divider"
                      >
                        <Minus size={13} />
                        Divider
                      </button>
                      <button
                        type="button"
                        onClick={() => insertIntoBody("New paragraph text goes here.")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-2.5 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        title="Insert paragraph"
                      >
                        <Pilcrow size={13} />
                        Paragraph
                      </button>
                    </div>
                  </div>
                  <TextArea
                    value={form.bodyText}
                    onChange={(value) => setForm((f) => ({ ...f, bodyText: value }))}
                    rows={14}
                    placeholder="Write paragraphs separated by blank lines..."
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--cth-copy-muted)]">Live Preview</div>
                  <div className="min-h-[320px] rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                    <div className="text-lg font-semibold text-[var(--cth-admin-ink)]">
                      {form.title || "Untitled article"}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--cth-copy-muted)]">
                      <span>{SECTION_META[form.sectionKey]?.title || "Start Here"}</span>
                      <span>•</span>
                      <span>{form.duration || "3 min read"}</span>
                      <span>•</span>
                      <span>{form.tier || "All"}</span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--cth-copy-muted)]">/{form.slug || slugify(form.title)}</div>

                    <div className="mt-4 space-y-4">
                      {form.bodyText.trim() ? (
                        form.bodyText
                          .split(/\n{2,}/)
                          .map((paragraph, index) => paragraph.trim())
                          .filter(Boolean)
                          .map((paragraph, index) => (
                            <p key={index} className="text-sm leading-7 text-[var(--cth-copy-body-soft)]">
                              {paragraph}
                            </p>
                          ))
                      ) : (
                        <div className="text-sm text-[var(--cth-copy-muted)]">
                          Your article preview will appear here as you write.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cth-admin-border)] px-5 py-4">
              <div className="text-xs text-[var(--cth-copy-muted)]">
                Changes save directly to the admin Knowledge Base API.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--cth-admin-border)] bg-white px-4 py-2 text-sm text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                >
                  <X size={15} />
                  Close
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--cth-admin-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  <Save size={15} />
                  Save Article
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
