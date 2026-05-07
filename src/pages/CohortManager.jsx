import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
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
  fontSize: 26,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const SUBHEAD_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: "var(--cth-command-muted)",
  margin: "4px 0 0",
  lineHeight: 1.55,
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const ICON_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-muted)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const FIELD_LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  fontFamily: SANS,
  fontSize: 14,
  color: "var(--cth-command-ink)",
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  minHeight: 80,
  resize: "vertical",
  lineHeight: 1.55,
};

const PLATFORM_OPTIONS = ["Zoom", "Google Meet", "Other"];

const BRAND_OS_MODULES = [
  { id: "foundation", label: "Foundation", flag: "foundation_complete" },
  { id: "positioning", label: "Positioning", flag: "positioning_complete" },
  { id: "messaging", label: "Messaging", flag: "messaging_complete" },
  { id: "audience", label: "Audience", flag: "audience_complete" },
  { id: "identity", label: "Identity", flag: "identity_complete" },
  { id: "strategic_os", label: "Strategic OS", flag: "strategic_os_steps_complete" },
  { id: "offers", label: "Offers", flag: "offers_complete" },
];

function formatSessionDateTime(dateStr, timeStr) {
  if (!dateStr) return "";
  try {
    const iso = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!timeStr) return datePart;
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return dateStr;
  }
}

function deriveModuleStatus(progress, moduleId) {
  if (!progress) return "empty";
  switch (moduleId) {
    case "foundation":
      if (progress.foundation_complete) return "complete";
      if (progress.brand_memory_complete) return "draft";
      return "empty";
    case "positioning":
      if (progress.positioning_complete) return "complete";
      return "empty";
    case "messaging":
      if (progress.messaging_complete) return "complete";
      return "empty";
    case "audience":
      if (progress.audience_complete) return "complete";
      return "empty";
    case "identity":
      if (progress.identity_complete) return "complete";
      return "empty";
    case "strategic_os": {
      const steps = Number(progress.strategic_os_steps_complete || 0);
      if (steps >= 9) return "complete";
      if (steps >= 1 || progress.strategic_os_started) return "draft";
      return "empty";
    }
    case "offers":
      if (progress.offers_complete) return "complete";
      return "empty";
    default:
      return "empty";
  }
}

function moduleDotColor(status) {
  if (status === "complete") return "var(--cth-status-success-bright, #2f8a4a)";
  if (status === "draft") return "var(--cth-command-gold)";
  return "var(--cth-command-border)";
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function LockedOverlay() {
  return (
    <DashboardLayout>
      <TopBar
        title="Cohort Manager"
        subtitle="Schedule weekly calls and track Brand OS progress across your cohort."
      />
      <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
          <div
            style={{
              ...CARD_STYLE,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center"
              style={{
                borderRadius: 4,
                background: "color-mix(in srgb, var(--cth-command-purple) 12%, transparent)",
                color: "var(--cth-command-purple)",
                marginBottom: 16,
              }}
            >
              <Lock size={22} />
            </div>
            <p style={{ ...SECTION_LABEL_STYLE, color: "var(--cth-command-purple)" }}>
              Estate Plan Required
            </p>
            <h1
              style={{
                ...SECTION_HEADING_STYLE,
                fontSize: 32,
                margin: "12px 0 16px",
              }}
            >
              Cohort Manager
            </h1>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                lineHeight: 1.65,
                color: "var(--cth-command-ink)",
                margin: "0 auto 24px",
                maxWidth: 540,
              }}
            >
              The Cohort Manager is available exclusively on The Estate plan. Manage up to 8 cohort
              members, schedule weekly calls, and track Brand OS progress across your entire cohort.
            </p>
            <a href="/billing" style={PRIMARY_CTA_STYLE}>
              Upgrade to Estate
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const EMPTY_SESSION_FORM = {
  title: "",
  date: "",
  time: "",
  platform: "Zoom",
  link: "",
  topic: "",
};

const EMPTY_MEMBER_FORM = {
  name: "",
  email: "",
  notes: "",
  member_workspace_id: "",
};

const EMPTY_NOTE_FORM = {
  member_id: "",
  session_id: "",
  note_text: "",
};

export default function CohortManager() {
  const { plan, isSuperAdmin } = usePlan();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";

  const planNormalized = String(plan || "foundation").toLowerCase();
  const hasAccess = isSuperAdmin || planNormalized === "estate";

  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memberProgress, setMemberProgress] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const memberById = useMemo(() => {
    const map = {};
    for (const m of members) map[m.id] = m;
    return map;
  }, [members]);

  const sessionById = useMemo(() => {
    const map = {};
    for (const s of sessions) map[s.id] = s;
    return map;
  }, [sessions]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "completed") return 1;
        if (b.status === "completed") return -1;
      }
      const ad = `${a.date || ""}T${a.time || "00:00"}`;
      const bd = `${b.date || ""}T${b.time || "00:00"}`;
      return ad.localeCompare(bd);
    });
  }, [sessions]);

  const loadAll = useCallback(async () => {
    if (!hasAccess) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError("");
    try {
      const [sRes, mRes, nRes] = await Promise.all([
        apiClient.get("/api/cohort/sessions"),
        apiClient.get("/api/cohort/members"),
        apiClient.get("/api/cohort/notes"),
      ]);
      setSessions(Array.isArray(sRes?.sessions) ? sRes.sessions : []);
      setMembers(Array.isArray(mRes?.members) ? mRes.members : []);
      setNotes(Array.isArray(nRes?.notes) ? nRes.notes : []);
    } catch (error) {
      console.error("Cohort load failed:", error);
      setLoadError(getErrorMessage(error, "Failed to load Cohort Manager."));
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    loadAll();
  }, [loadAll, workspaceId]);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      const next = {};
      for (const member of members) {
        const memberWs = (member.member_workspace_id || "").trim();
        if (!memberWs) {
          next[member.id] = null;
          continue;
        }
        try {
          const res = await apiClient.get(
            `/api/onboarding/progress?workspace_id=${encodeURIComponent(memberWs)}`,
          );
          next[member.id] = res || null;
        } catch (error) {
          console.warn("Member progress fetch failed:", member.id, error);
          next[member.id] = null;
        }
      }
      if (!cancelled) setMemberProgress(next);
    }
    if (members.length > 0) loadProgress();
    return () => {
      cancelled = true;
    };
  }, [members]);

  const handleAddSession = async (event) => {
    event.preventDefault();
    setActionError("");
    if (!sessionForm.title.trim() || !sessionForm.date) {
      setActionError("Title and date are required.");
      return;
    }
    try {
      const res = await apiClient.post("/api/cohort/sessions", sessionForm);
      const newSession = res?.session;
      if (newSession) setSessions((prev) => [...prev, newSession]);
      setSessionForm(EMPTY_SESSION_FORM);
      setShowSessionForm(false);
    } catch (error) {
      console.error("Add session failed:", error);
      setActionError(getErrorMessage(error, "Failed to add session."));
    }
  };

  const handleCompleteSession = async (sessionId) => {
    setActionError("");
    try {
      await apiClient.patch(`/api/cohort/sessions/${sessionId}/complete`);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: "completed", completed_at: new Date().toISOString() } : s,
        ),
      );
    } catch (error) {
      console.error("Complete session failed:", error);
      setActionError(getErrorMessage(error, "Failed to mark session complete."));
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session? This cannot be undone.")) return;
    setActionError("");
    try {
      await apiClient.delete(`/api/cohort/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Delete session failed:", error);
      setActionError(getErrorMessage(error, "Failed to delete session."));
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setActionError("");
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setActionError("Name and email are required.");
      return;
    }
    try {
      const res = await apiClient.post("/api/cohort/members", memberForm);
      const newMember = res?.member;
      if (newMember) setMembers((prev) => [...prev, newMember]);
      setMemberForm(EMPTY_MEMBER_FORM);
      setShowMemberForm(false);
    } catch (error) {
      console.error("Add member failed:", error);
      setActionError(getErrorMessage(error, "Failed to add member."));
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Remove this member and their notes? This cannot be undone.")) return;
    setActionError("");
    try {
      await apiClient.delete(`/api/cohort/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setNotes((prev) => prev.filter((n) => n.member_id !== memberId));
    } catch (error) {
      console.error("Delete member failed:", error);
      setActionError(getErrorMessage(error, "Failed to remove member."));
    }
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    setActionError("");
    if (!noteForm.member_id || !noteForm.note_text.trim()) {
      setActionError("Member and note text are required.");
      return;
    }
    try {
      const res = await apiClient.post("/api/cohort/notes", noteForm);
      const newNote = res?.note;
      if (newNote) setNotes((prev) => [newNote, ...prev]);
      setNoteForm(EMPTY_NOTE_FORM);
      setShowNoteForm(false);
    } catch (error) {
      console.error("Add note failed:", error);
      setActionError(getErrorMessage(error, "Failed to save note."));
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note_text);
  };

  const handleSaveEditNote = async () => {
    if (!editingNoteId) return;
    setActionError("");
    try {
      await apiClient.put(`/api/cohort/notes/${editingNoteId}`, {
        note_text: editingNoteText,
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNoteId ? { ...n, note_text: editingNoteText } : n)),
      );
      setEditingNoteId(null);
      setEditingNoteText("");
    } catch (error) {
      console.error("Update note failed:", error);
      setActionError(getErrorMessage(error, "Failed to update note."));
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setActionError("");
    try {
      await apiClient.delete(`/api/cohort/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Delete note failed:", error);
      setActionError(getErrorMessage(error, "Failed to delete note."));
    }
  };

  if (!hasAccess) {
    return <LockedOverlay />;
  }

  const memberCount = members.length;
  const cohortFull = memberCount >= 8;

  return (
    <DashboardLayout>
      <TopBar
        title="Cohort Manager"
        subtitle="Schedule weekly calls, track Brand OS progress, and log check-in notes for up to 8 members."
      />

      <div className="flex-1 overflow-auto" style={PAGE_STYLE} data-testid="cohort-manager-page">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8 space-y-6">
          {loadError ? (
            <div
              style={{
                ...CARD_STYLE,
                padding: "12px 16px",
                fontFamily: SANS,
                fontSize: 13,
                color: "var(--cth-danger)",
                borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
              }}
            >
              {loadError}
            </div>
          ) : null}

          {actionError ? (
            <div
              style={{
                ...CARD_STYLE,
                padding: "12px 16px",
                fontFamily: SANS,
                fontSize: 13,
                color: "var(--cth-danger)",
                borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
              }}
            >
              {actionError}
            </div>
          ) : null}

          {isLoading ? (
            <div
              className="flex items-center justify-center"
              style={{ ...CARD_STYLE, padding: "60px 24px" }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  color: "var(--cth-command-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Loader2 size={18} className="animate-spin" />
                Loading Cohort Manager...
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: Sessions */}
              <section style={{ ...CARD_STYLE, padding: 24 }} data-testid="cohort-sessions-section">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Section 1</p>
                    <h2 style={SECTION_HEADING_STYLE}>Cohort Sessions</h2>
                    <p style={SUBHEAD_STYLE}>Schedule weekly calls and track attendance</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSessionForm((v) => !v)}
                    data-testid="add-session-toggle"
                    style={SECONDARY_BUTTON_STYLE}
                  >
                    {showSessionForm ? <X size={14} /> : <Plus size={14} />}
                    {showSessionForm ? "Cancel" : "Add Session"}
                  </button>
                </div>

                {showSessionForm ? (
                  <form
                    onSubmit={handleAddSession}
                    data-testid="add-session-form"
                    style={{
                      ...CARD_STYLE,
                      padding: 20,
                      marginTop: 16,
                      background: "var(--cth-command-panel-soft)",
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>Session title</label>
                        <input
                          type="text"
                          value={sessionForm.title}
                          onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                          placeholder="Week 1 — Foundation deep dive"
                          style={INPUT_STYLE}
                          required
                        />
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Date</label>
                        <input
                          type="date"
                          value={sessionForm.date}
                          onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                          style={INPUT_STYLE}
                          required
                        />
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Time</label>
                        <input
                          type="time"
                          value={sessionForm.time}
                          onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                          style={INPUT_STYLE}
                        />
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Platform</label>
                        <select
                          value={sessionForm.platform}
                          onChange={(e) => setSessionForm({ ...sessionForm, platform: e.target.value })}
                          style={INPUT_STYLE}
                        >
                          {PLATFORM_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Meeting link</label>
                        <input
                          type="url"
                          value={sessionForm.link}
                          onChange={(e) => setSessionForm({ ...sessionForm, link: e.target.value })}
                          placeholder="https://..."
                          style={INPUT_STYLE}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>Topic / agenda (optional)</label>
                        <textarea
                          value={sessionForm.topic}
                          onChange={(e) =>
                            setSessionForm({ ...sessionForm, topic: e.target.value.slice(0, 500) })
                          }
                          placeholder="What you'll cover on this call..."
                          maxLength={500}
                          style={TEXTAREA_STYLE}
                        />
                        <p style={{ ...SUBHEAD_STYLE, fontSize: 11, marginTop: 6 }}>
                          {sessionForm.topic.length}/500
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionForm(false);
                          setSessionForm(EMPTY_SESSION_FORM);
                        }}
                        style={SECONDARY_BUTTON_STYLE}
                      >
                        Cancel
                      </button>
                      <button type="submit" data-testid="save-session-btn" style={PRIMARY_CTA_STYLE}>
                        <Save size={14} /> Save Session
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-5 space-y-3">
                  {sortedSessions.length === 0 ? (
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: "var(--cth-command-muted)",
                        padding: "12px 0",
                      }}
                    >
                      No sessions scheduled yet. Add your first cohort session above.
                    </p>
                  ) : (
                    sortedSessions.map((session) => {
                      const isComplete = session.status === "completed";
                      return (
                        <div
                          key={session.id}
                          data-testid={`session-card-${session.id}`}
                          style={{ ...CARD_STYLE, padding: 18 }}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3
                                  style={{
                                    fontFamily: SERIF,
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: "var(--cth-command-ink)",
                                    margin: 0,
                                  }}
                                >
                                  {session.title}
                                </h3>
                                <span
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    background: "var(--cth-command-panel-soft)",
                                    color: "var(--cth-command-ink)",
                                    border: "1px solid var(--cth-command-border)",
                                  }}
                                >
                                  {session.platform || "Other"}
                                </span>
                                <span
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    background: isComplete
                                      ? "color-mix(in srgb, var(--cth-command-muted) 12%, transparent)"
                                      : "color-mix(in srgb, var(--cth-command-gold) 18%, transparent)",
                                    color: isComplete
                                      ? "var(--cth-command-muted)"
                                      : "var(--cth-command-gold)",
                                  }}
                                >
                                  {isComplete ? "Completed" : "Upcoming"}
                                </span>
                              </div>
                              <p
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 12,
                                  color: "var(--cth-command-muted)",
                                  margin: "0 0 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <CalendarDays size={12} />
                                {formatSessionDateTime(session.date, session.time)}
                              </p>
                              {session.topic ? (
                                <p
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: 13,
                                    color: "var(--cth-command-ink)",
                                    margin: 0,
                                    lineHeight: 1.55,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {session.topic}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {session.link ? (
                                <a
                                  href={session.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={PRIMARY_CTA_STYLE}
                                >
                                  Join Call <ChevronRight size={14} />
                                </a>
                              ) : null}
                              {!isComplete ? (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteSession(session.id)}
                                  data-testid={`complete-session-${session.id}`}
                                  style={SECONDARY_BUTTON_STYLE}
                                >
                                  <CheckCircle2 size={14} /> Mark Complete
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNoteForm(true);
                                  setNoteForm({
                                    member_id: "",
                                    session_id: session.id,
                                    note_text: "",
                                  });
                                  if (typeof window !== "undefined") {
                                    setTimeout(() => {
                                      const el = document.getElementById("cohort-notes-section");
                                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }, 50);
                                  }
                                }}
                                style={SECONDARY_BUTTON_STYLE}
                              >
                                Add Notes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(session.id)}
                                aria-label="Delete session"
                                style={ICON_BUTTON_STYLE}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* SECTION 2: Member Roster */}
              <section style={{ ...CARD_STYLE, padding: 24 }} data-testid="cohort-members-section">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Section 2</p>
                    <h2 style={SECTION_HEADING_STYLE}>Cohort Members</h2>
                    <p style={SUBHEAD_STYLE}>
                      Track each member's Brand OS progress · {memberCount}/8 members
                    </p>
                  </div>
                  {cohortFull ? (
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        color: "var(--cth-command-muted)",
                        padding: "10px 14px",
                        border: "1px solid var(--cth-command-border)",
                        borderRadius: 4,
                      }}
                    >
                      Cohort is full (8/8 members)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMemberForm((v) => !v)}
                      data-testid="add-member-toggle"
                      style={SECONDARY_BUTTON_STYLE}
                    >
                      {showMemberForm ? <X size={14} /> : <Plus size={14} />}
                      {showMemberForm ? "Cancel" : "Add Member"}
                    </button>
                  )}
                </div>

                {showMemberForm && !cohortFull ? (
                  <form
                    onSubmit={handleAddMember}
                    data-testid="add-member-form"
                    style={{
                      ...CARD_STYLE,
                      padding: 20,
                      marginTop: 16,
                      background: "var(--cth-command-panel-soft)",
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Name</label>
                        <input
                          type="text"
                          value={memberForm.name}
                          onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                          style={INPUT_STYLE}
                          required
                        />
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Email</label>
                        <input
                          type="email"
                          value={memberForm.email}
                          onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                          style={INPUT_STYLE}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>
                          Member workspace ID (optional, enables progress tracking)
                        </label>
                        <input
                          type="text"
                          value={memberForm.member_workspace_id}
                          onChange={(e) =>
                            setMemberForm({ ...memberForm, member_workspace_id: e.target.value })
                          }
                          placeholder="ws_..."
                          style={INPUT_STYLE}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>Notes (optional)</label>
                        <textarea
                          value={memberForm.notes}
                          onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                          style={TEXTAREA_STYLE}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMemberForm(false);
                          setMemberForm(EMPTY_MEMBER_FORM);
                        }}
                        style={SECONDARY_BUTTON_STYLE}
                      >
                        Cancel
                      </button>
                      <button type="submit" data-testid="save-member-btn" style={PRIMARY_CTA_STYLE}>
                        <Save size={14} /> Add Member
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.length === 0 ? (
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: "var(--cth-command-muted)",
                        padding: "12px 0",
                      }}
                    >
                      No members added yet.
                    </p>
                  ) : (
                    members.map((member) => {
                      const progress = memberProgress[member.id];
                      const statuses = BRAND_OS_MODULES.map((mod) => ({
                        ...mod,
                        status: deriveModuleStatus(progress, mod.id),
                      }));
                      const completedCount = statuses.filter((s) => s.status === "complete").length;
                      const pct = Math.round((completedCount / BRAND_OS_MODULES.length) * 100);
                      return (
                        <div
                          key={member.id}
                          data-testid={`member-card-${member.id}`}
                          style={{ ...CARD_STYLE, padding: 18 }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3
                                style={{
                                  fontFamily: SERIF,
                                  fontSize: 17,
                                  fontWeight: 600,
                                  color: "var(--cth-command-ink)",
                                  margin: 0,
                                }}
                              >
                                {member.name}
                              </h3>
                              <p
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 12,
                                  color: "var(--cth-command-muted)",
                                  margin: "2px 0 0",
                                }}
                              >
                                {member.email}
                              </p>
                              {member.created_at ? (
                                <p
                                  style={{
                                    fontFamily: SANS,
                                    fontSize: 11,
                                    color: "var(--cth-command-muted)",
                                    margin: "4px 0 0",
                                  }}
                                >
                                  Joined{" "}
                                  {new Date(member.created_at).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id)}
                              aria-label="Remove member"
                              style={ICON_BUTTON_STYLE}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10 }}>Brand OS Progress</p>
                            <p
                              style={{
                                fontFamily: SANS,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--cth-command-ink)",
                              }}
                            >
                              {pct}%
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {statuses.map((mod) => (
                              <div
                                key={mod.id}
                                title={`${mod.label} — ${mod.status === "complete" ? "Complete" : mod.status === "draft" ? "In progress" : "Not started"}`}
                                className="flex items-center gap-1.5"
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 10,
                                  color: "var(--cth-command-muted)",
                                  padding: "4px 8px",
                                  border: "1px solid var(--cth-command-border)",
                                  borderRadius: 999,
                                  background: "var(--cth-command-panel-soft)",
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  style={{
                                    display: "inline-block",
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    background: moduleDotColor(mod.status),
                                  }}
                                />
                                {mod.label}
                              </div>
                            ))}
                          </div>
                          {!member.member_workspace_id ? (
                            <p
                              style={{
                                fontFamily: SANS,
                                fontSize: 11,
                                color: "var(--cth-command-muted)",
                                margin: "10px 0 0",
                                fontStyle: "italic",
                              }}
                            >
                              Add a member workspace ID to track live Brand OS progress.
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* SECTION 3: Check-in Notes */}
              <section
                id="cohort-notes-section"
                style={{ ...CARD_STYLE, padding: 24 }}
                data-testid="cohort-notes-section"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Section 3</p>
                    <h2 style={SECTION_HEADING_STYLE}>Check-in Notes</h2>
                    <p style={SUBHEAD_STYLE}>Log notes after each session</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteForm((v) => !v);
                      if (!showNoteForm) setNoteForm(EMPTY_NOTE_FORM);
                    }}
                    data-testid="add-note-toggle"
                    style={SECONDARY_BUTTON_STYLE}
                    disabled={members.length === 0}
                  >
                    {showNoteForm ? <X size={14} /> : <Plus size={14} />}
                    {showNoteForm ? "Cancel" : "Add Note"}
                  </button>
                </div>

                {members.length === 0 ? (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      color: "var(--cth-command-muted)",
                      marginTop: 12,
                      fontStyle: "italic",
                    }}
                  >
                    Add cohort members first to log check-in notes.
                  </p>
                ) : null}

                {showNoteForm && members.length > 0 ? (
                  <form
                    onSubmit={handleAddNote}
                    data-testid="add-note-form"
                    style={{
                      ...CARD_STYLE,
                      padding: 20,
                      marginTop: 16,
                      background: "var(--cth-command-panel-soft)",
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Member</label>
                        <select
                          value={noteForm.member_id}
                          onChange={(e) => setNoteForm({ ...noteForm, member_id: e.target.value })}
                          style={INPUT_STYLE}
                          required
                        >
                          <option value="">Select member…</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Session (optional)</label>
                        <select
                          value={noteForm.session_id}
                          onChange={(e) => setNoteForm({ ...noteForm, session_id: e.target.value })}
                          style={INPUT_STYLE}
                        >
                          <option value="">No session</option>
                          {sessions.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>Note</label>
                        <textarea
                          value={noteForm.note_text}
                          onChange={(e) => setNoteForm({ ...noteForm, note_text: e.target.value })}
                          placeholder="What stood out about this member's progress, blockers, or wins…"
                          style={{ ...TEXTAREA_STYLE, minHeight: 110 }}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNoteForm(false);
                          setNoteForm(EMPTY_NOTE_FORM);
                        }}
                        style={SECONDARY_BUTTON_STYLE}
                      >
                        Cancel
                      </button>
                      <button type="submit" data-testid="save-note-btn" style={PRIMARY_CTA_STYLE}>
                        <Save size={14} /> Save Note
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-5 space-y-3">
                  {notes.length === 0 ? (
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: "var(--cth-command-muted)",
                        padding: "12px 0",
                      }}
                    >
                      No check-in notes yet.
                    </p>
                  ) : (
                    notes.map((note) => {
                      const member = memberById[note.member_id];
                      const session = note.session_id ? sessionById[note.session_id] : null;
                      const isEditing = editingNoteId === note.id;
                      return (
                        <div
                          key={note.id}
                          data-testid={`note-card-${note.id}`}
                          style={{ ...CARD_STYLE, padding: 18 }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3
                                style={{
                                  fontFamily: SERIF,
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: "var(--cth-command-ink)",
                                  margin: 0,
                                }}
                              >
                                {member?.name || "Removed member"}
                              </h3>
                              <p
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  color: "var(--cth-command-muted)",
                                  margin: "2px 0 0",
                                }}
                              >
                                {session ? `Session: ${session.title} · ` : ""}
                                {note.created_at
                                  ? new Date(note.created_at).toLocaleString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNote(note)}
                                  style={SECONDARY_BUTTON_STYLE}
                                >
                                  Edit
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                aria-label="Delete note"
                                style={ICON_BUTTON_STYLE}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <>
                              <textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                style={{ ...TEXTAREA_STYLE, minHeight: 100 }}
                              />
                              <div className="flex justify-end gap-3 mt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteText("");
                                  }}
                                  style={SECONDARY_BUTTON_STYLE}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditNote}
                                  style={PRIMARY_CTA_STYLE}
                                >
                                  <Save size={14} /> Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <p
                              style={{
                                fontFamily: SANS,
                                fontSize: 14,
                                lineHeight: 1.65,
                                color: "var(--cth-command-ink)",
                                margin: 0,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {note.note_text}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
