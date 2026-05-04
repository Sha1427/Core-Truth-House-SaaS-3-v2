import React, { useCallback, useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";
import { useWorkspace } from "../context/WorkspaceContext";
import API_PATHS from "../lib/apiPaths";
import PublishDrawer from "../components/content-studio/PublishDrawer";

const CONTENT_TYPES = [
  {
    id: "social-caption",
    label: "Social Caption",
    platforms: ["instagram", "facebook", "threads", "linkedin"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is this post about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. confident, warm, direct" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Any specific angle or hook to include?" },
    ],
  },
  {
    id: "short-form-hook",
    label: "Short Form Hook",
    platforms: ["instagram", "tiktok", "facebook"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the hook about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. punchy, dramatic, curious" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Any specific format or style?" },
    ],
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    platforms: ["linkedin"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What insight, story, or perspective are you sharing?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. thought leadership, personal story, direct" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Any specific format — e.g. short paragraphs, no bullet points?" },
    ],
  },
  {
    id: "twitter-thread",
    label: "Twitter / X Thread",
    platforms: ["twitter"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the thread about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. direct, educational, opinionated" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Number of tweets, specific structure, or angle?" },
    ],
  },
  {
    id: "tiktok-script",
    label: "TikTok Script",
    platforms: ["tiktok"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the video about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. energetic, educational, conversational" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Desired video length or any specific CTA?" },
    ],
  },
  {
    id: "pinterest-description",
    label: "Pinterest Description",
    platforms: ["pinterest"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is this pin about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. inspiring, helpful, aspirational" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Any keywords to include?" },
    ],
  },
  {
    id: "carousel-outline",
    label: "Carousel Outline",
    platforms: ["instagram", "linkedin"],
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the carousel teaching or showing?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. educational, step-by-step, bold" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Number of slides or specific structure?" },
    ],
  },
  {
    id: "email-newsletter",
    label: "Email Newsletter",
    platforms: [],
    destination: "mail",
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is this email about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. personal, educational, promotional" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Subject line direction, specific CTA, or audience segment?" },
    ],
  },
  {
    id: "sales-page",
    label: "Sales Page Copy",
    platforms: [],
    destination: "library-only",
    fields: [
      { id: "offer", label: "Offer name", type: "text", required: true, placeholder: "What are you selling?" },
      { id: "topic", label: "Target audience and pain point", type: "textarea", required: true, placeholder: "Who is this for and what problem does it solve?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "e.g. direct, premium, conversational" },
      { id: "custom_instruction", label: "Custom instruction", type: "textarea", required: false, placeholder: "Any specific sections, price points, or guarantees to include?" },
    ],
  },
];

const DEFAULT_FORM = {
  content_type: CONTENT_TYPES[0].id,
  topic: "",
  offer: "",
  tone: "",
  custom_instruction: "",
};

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.25,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-ink)",
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--cth-command-ink)",
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: "10px 12px",
  lineHeight: 1.55,
  resize: "vertical",
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 14px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const ERROR_CARD_STYLE = {
  ...CARD_STYLE,
  borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
  background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
  color: "var(--cth-danger)",
  fontFamily: SANS,
  fontSize: 13,
  padding: "10px 14px",
};

function FieldRenderer({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
        rows={4}
        placeholder={field.placeholder}
        style={TEXTAREA_STYLE}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(field.id, event.target.value)}
      placeholder={field.placeholder}
      style={INPUT_STYLE}
    />
  );
}

export default function ContentStudio() {
  const location = useLocation();
  const navigate = useNavigate();
  const campaignId = location.state?.campaignId || "";
  const contentItemId = location.state?.contentItemId || "";
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { activeWorkspaceId } = useWorkspace();
  const [library, setLibrary] = useState([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [currentItemId, setCurrentItemId] = useState("");
  const [publishDrawerItem, setPublishDrawerItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const selectedType = useMemo(() => {
    return CONTENT_TYPES.find((item) => item.id === form.content_type) || CONTENT_TYPES[0];
  }, [form.content_type]);

  const renderedHtml = useMemo(() => {
    if (!generatedContent) return "";
    return DOMPurify.sanitize(marked.parse(generatedContent));
  }, [generatedContent]);

  useEffect(() => {
    const state = location.state || {};
    if (!state || Object.keys(state).length === 0) return;

    setForm((prev) => ({
      ...prev,
      content_type:
        state.format === "Sales Page"
          ? "sales-page"
          : state.format === "Blog Post"
          ? "email-newsletter"
          : prev.content_type,
      topic: state.topic || prev.topic,
      offer: state.offer || prev.offer,
    }));
  }, [location.state]);

  const loadLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    setLibraryError("");

    try {
      const res = await apiClient.get(API_PATHS.persist.contentLibrary, {
        params: {
          workspace_id: activeWorkspaceId,
        },
      });
      setLibrary(res?.assets || []);
    } catch (error) {
      console.error("Failed to load content library", error);
      setLibraryError(error?.message || "Failed to load content library.");
    } finally {
      setLoadingLibrary(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const updateField = (fieldId, value) => {
    setForm((current) => ({
      ...current,
      [fieldId]: value,
    }));
  };

  const validate = () => {
    const missing = selectedType.fields.find(
      (field) => field.required && !String(form[field.id] || "").trim()
    );

    if (missing) {
      throw new Error(`${missing.label} is required.`);
    }
  };

  const handleGenerate = async () => {
    setGenerateError("");
    setSaveError("");
    setGeneratedContent("");

    try {
      validate();
      setGenerating(true);

      const payload = {
        content_type: form.content_type,
        topic: form.topic || undefined,
        offer: form.offer || undefined,
        tone: form.tone || undefined,
        custom_instruction: form.custom_instruction || undefined,
      };

      const res = await apiClient.post(API_PATHS.persist.contentGenerate, payload);
      const content = res?.content || "";

      setGeneratedContent(content);
      setGeneratedTitle(
        `${selectedType.label} · ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      );
    } catch (error) {
      console.error("Failed to generate content", error);
      setGenerateError(error?.message || "Failed to generate content.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent.trim()) return;

    setSaveError("");
    try {
      setSaving(true);

      await apiClient.post(API_PATHS.persist.contentSave, {
        id: currentItemId || undefined,
        campaign_id: campaignId || undefined,
        content_item_id: contentItemId || undefined,
        content_type: form.content_type,
        title: generatedTitle || selectedType.label,
        content: generatedContent,
        metadata: {
          topic: form.topic,
          offer: form.offer,
          tone: form.tone,
          custom_instruction: form.custom_instruction,
          campaign_id: campaignId,
          content_item_id: contentItemId,
        },
      });

      await loadLibrary();
    } catch (error) {
      console.error("Failed to save content", error);
      setSaveError(error?.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
    } catch (error) {
      console.error("Failed to copy content", error);
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Content Studio"
        subtitle="Generate, refine, and save content using your current brand system."
      />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="content-studio-page"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[420px_1fr]">
          {/* Left: form */}
          <div style={{ ...CARD_STYLE, padding: 20 }}>
            <div className="mb-4">
              <label style={FIELD_LABEL_STYLE}>Content type</label>
              <select
                value={form.content_type}
                onChange={(event) => updateField("content_type", event.target.value)}
                style={INPUT_STYLE}
              >
                {CONTENT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="mb-4"
              style={{
                ...CARD_STYLE,
                background: "var(--cth-command-panel-soft)",
                padding: 14,
              }}
            >
              <div style={{ ...BODY_STYLE, fontWeight: 600 }}>{selectedType.label}</div>
              <div style={{ ...MUTED_STYLE, marginTop: 4 }}>{selectedType.description}</div>
            </div>

            <div className="grid gap-3">
              {selectedType.fields.map((field) => (
                <div key={field.id}>
                  <label style={FIELD_LABEL_STYLE}>
                    {field.label}
                    {field.required ? (
                      <span style={{ color: "var(--cth-command-crimson)", marginLeft: 4 }}>*</span>
                    ) : null}
                  </label>
                  <FieldRenderer
                    field={field}
                    value={form[field.id] || ""}
                    onChange={updateField}
                  />
                </div>
              ))}
            </div>

            {generateError ? (
              <div className="mt-4" style={ERROR_CARD_STYLE}>
                {generateError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="mt-4 w-full"
              style={{
                ...PRIMARY_CTA_STYLE,
                width: "100%",
                opacity: generating ? 0.65 : 1,
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generating ? "Generating..." : "Generate Content"}
            </button>
          </div>

          {/* Right: output + library */}
          <div className="grid gap-5">
            {/* Generated Output */}
            <div style={{ ...CARD_STYLE, padding: 20 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 style={SECTION_HEADING_STYLE}>Generated Output</h3>
                  <p style={{ ...MUTED_STYLE, marginTop: 6 }}>
                    Generate content, then save it to your workspace library.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!generatedContent}
                    onClick={handleCopy}
                    style={{
                      ...SECONDARY_BUTTON_STYLE,
                      opacity: !generatedContent ? 0.55 : 1,
                      cursor: !generatedContent ? "not-allowed" : "pointer",
                    }}
                  >
                    <Copy size={14} />
                    Copy
                  </button>

                  <button
                    type="button"
                    disabled={!generatedContent || saving}
                    onClick={handleSave}
                    style={{
                      ...SECONDARY_BUTTON_STYLE,
                      opacity: !generatedContent || saving ? 0.55 : 1,
                      cursor: !generatedContent || saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              </div>

              {saveError ? (
                <div className="mb-4" style={ERROR_CARD_STYLE}>
                  {saveError}
                </div>
              ) : null}

              {!generatedContent ? (
                <div
                  style={{
                    ...CARD_STYLE,
                    background: "var(--cth-command-panel-soft)",
                    padding: 28,
                    textAlign: "center",
                    fontFamily: SANS,
                    fontSize: 13,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  <Sparkles
                    size={20}
                    style={{ display: "block", margin: "0 auto 10px", color: "var(--cth-command-crimson)" }}
                  />
                  Your generated content will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={generatedContent}
                    onChange={(event) => setGeneratedContent(event.target.value)}
                    style={{ ...TEXTAREA_STYLE, minHeight: 320 }}
                  />
                  <div
                    style={{
                      ...CARD_STYLE,
                      background: "var(--cth-command-panel-soft)",
                      padding: 16,
                      fontFamily: SANS,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: "var(--cth-command-ink)",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              )}
            </div>

            {/* Content Library */}
            <div style={{ ...CARD_STYLE, padding: 20 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 style={SECTION_HEADING_STYLE}>Content Library</h3>
                  <p style={{ ...MUTED_STYLE, marginTop: 6 }}>
                    Saved content assets for this workspace.
                  </p>
                </div>

                <button type="button" onClick={loadLibrary} style={SECONDARY_BUTTON_STYLE}>
                  {loadingLibrary ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Refresh
                </button>
              </div>

              {libraryError ? (
                <div className="mb-4" style={ERROR_CARD_STYLE}>
                  {libraryError}
                </div>
              ) : null}

              {loadingLibrary ? (
                <div className="flex min-h-[140px] items-center justify-center">
                  <Loader2
                    size={20}
                    className="animate-spin"
                    style={{ color: "var(--cth-command-crimson)" }}
                  />
                </div>
              ) : library.length === 0 ? (
                <div
                  style={{
                    ...CARD_STYLE,
                    background: "var(--cth-command-panel-soft)",
                    padding: "64px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  <FileText size={40} strokeWidth={1.2} />
                  <p style={{
                    margin: 0,
                    fontSize: 15,
                    fontFamily: '"Playfair Display", serif',
                    color: "var(--cth-command-ink)",
                  }}>
                    No content saved yet
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    fontFamily: SANS,
                  }}>
                    Generate your first piece of content above and save it to your library.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {library.map((item) => (
                    <div
                      key={item.id || item.asset_id}
                      style={{
                        ...CARD_STYLE,
                        background: "var(--cth-command-panel-soft)",
                        padding: 16,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentItemId(item.id || item.asset_id || "");
                            setGeneratedTitle(item.title || "");
                            setGeneratedContent(item.content || "");
                            setForm((prev) => ({
                              ...prev,
                              content_type: item.content_type || prev.content_type,
                              topic: item.metadata?.topic || prev.topic,
                              offer: item.metadata?.offer || prev.offer,
                              tone: item.metadata?.tone || prev.tone,
                              custom_instruction: item.metadata?.custom_instruction || prev.custom_instruction,
                            }));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="flex-1 text-left"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: SERIF,
                              fontSize: 16,
                              fontWeight: 600,
                              color: "var(--cth-command-ink)",
                              letterSpacing: "-0.005em",
                              marginBottom: 4,
                            }}
                          >
                            {item.title || item.content_type || "Untitled"}
                          </div>
                          <div
                            style={{
                              ...SECTION_LABEL_STYLE,
                              fontSize: 10,
                              marginBottom: 8,
                            }}
                          >
                            {item.content_type || "generated"}
                          </div>
                          <div
                            className="line-clamp-3"
                            style={{
                              fontFamily: SANS,
                              fontSize: 13,
                              lineHeight: 1.55,
                              color: "var(--cth-command-muted)",
                            }}
                          >
                            {item.content || ""}
                          </div>
                        </button>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {(item.content_type === "email-newsletter" || item.format === "Email Newsletter") ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate("/mail", {
                                  state: {
                                    prefillContent: item.content || "",
                                    prefillSubject: item.title || "",
                                    contentItemId: item.id || item.asset_id || null,
                                  },
                                });
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: '"DM Sans", system-ui, sans-serif',
                                background: "none",
                                border: "1px solid var(--cth-command-border)",
                                color: "var(--cth-command-muted)",
                              }}
                            >
                              <Share2 size={13} /> Open in Mail
                            </button>
                          ) : (item.content_type === "sales-page" || item.format === "Sales Page Copy") ? (
                            <span style={{
                              fontSize: 11,
                              fontFamily: '"DM Sans", system-ui, sans-serif',
                              color: "var(--cth-command-muted)",
                              fontStyle: "italic",
                              padding: "6px 0",
                            }}>
                              Saved to library. Use this copy in your offer builder or sales page.
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPublishDrawerItem(item);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 10px",
                                border: "1px solid var(--cth-command-border, rgba(216,197,195,0.6))",
                                borderRadius: 4,
                                background: "transparent",
                                color: "var(--cth-command-muted, #7a6a72)",
                                fontFamily: '"DM Sans", system-ui, sans-serif',
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                              title="Schedule this content as a social post"
                            >
                              <Share2 size={12} /> Add to Social
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(item);
                            }}
                            style={SECONDARY_BUTTON_STYLE}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(13,0,16,0.45)",
          zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}>
          <div style={{
            background: "var(--cth-command-panel)",
            border: "1px solid var(--cth-command-border)",
            borderRadius: 4,
            padding: "32px",
            width: "min(420px, 100%)",
          }}>
            <h3 style={{
              margin: "0 0 8px",
              fontFamily: '"Playfair Display", serif',
              fontSize: 20,
              color: "var(--cth-command-ink)",
            }}>
              Delete this content?
            </h3>
            <p style={{
              margin: "0 0 24px", fontSize: 14,
              color: "var(--cth-command-muted)",
              fontFamily: '"DM Sans", system-ui, sans-serif',
            }}>
              "{deleteTarget.title || "This item"}" will be permanently removed
              from your library.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "9px 18px", borderRadius: 4,
                  border: "1px solid var(--cth-command-border)",
                  background: "none", color: "var(--cth-command-muted)",
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const itemId = deleteTarget.id || deleteTarget.asset_id;
                  if (!itemId) {
                    setDeleteTarget(null);
                    return;
                  }
                  try {
                    await apiClient.delete(`${API_PATHS.persist.contentLibrary.replace('/library', '')}/${itemId}`);
                    if (currentItemId === itemId) {
                      setCurrentItemId("");
                      setGeneratedTitle("");
                      setGeneratedContent("");
                    }
                    await loadLibrary();
                  } catch (error) {
                    console.error("Failed to delete content", error);
                    setSaveError(error?.message || "Failed to delete content.");
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
                style={{
                  padding: "9px 18px", borderRadius: 4, border: "none",
                  background: "var(--cth-crimson)", color: "#fff",
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13, cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <PublishDrawer
        item={publishDrawerItem}
        onClose={() => setPublishDrawerItem(null)}
      />
    </DashboardLayout>
  );
}
