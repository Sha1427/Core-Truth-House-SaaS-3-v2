import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUser } from "../../hooks/useAuth";
import { BookOpen, PlayCircle, ClipboardList, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { AdminTrainingVideos } from "../../components/admin/AdminTrainingVideos";

const API = import.meta.env.VITE_BACKEND_URL;

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

function SmallButton({ onClick, children, disabled = false, icon: Icon = null }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-surface-elevated-soft)] disabled:opacity-50"
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, tone = "rose", hint = "" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
    plum: "bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
    blue: "bg-[var(--cth-surface-info-soft)] text-[var(--cth-info-blue-deep)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{label}</div>
      {hint ? <div className="mt-2 text-xs text-[var(--cth-copy-muted)]">{hint}</div> : null}
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

function normalizeMilestones(progress) {
  if (!progress || typeof progress !== "object") return [];

  const milestoneValue = progress.milestones;

  if (Array.isArray(milestoneValue)) {
    return milestoneValue.map((m, index) => ({
      id: typeof m === "string" ? m : m?.id || `milestone-${index}`,
      label: typeof m === "string" ? m : m?.label || m?.name || `Milestone ${index + 1}`,
      complete: true,
    }));
  }

  if (milestoneValue && typeof milestoneValue === "object") {
    return Object.entries(milestoneValue).map(([key, value]) => ({
      id: key,
      label: key.replace(/_/g, " "),
      complete: Boolean(value),
    }));
  }

  const fallbackKeys = Object.entries(progress).filter(
    ([key, value]) =>
      typeof value === "boolean" &&
      !["success", "ok"].includes(String(key).toLowerCase())
  );

  return fallbackKeys.map(([key, value]) => ({
    id: key,
    label: key.replace(/_/g, " "),
    complete: Boolean(value),
  }));
}

function InsightCard({ title, body, tone = "neutral" }) {
  const tones = {
    neutral: "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)]",
    success: "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)]",
    warning: "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)]",
    danger: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)]",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.neutral}`}>
      <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
      <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">{body}</div>
    </div>
  );
}

export default function AdminOnboardingPage() {
  const { user } = useUser();
  const adminId = user?.id || "default";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [trainingVideos, setTrainingVideos] = useState([]);
  const [onboardingProgress, setOnboardingProgress] = useState(null);

  const fetchTrainingVideos = useCallback(async () => {
    if (!API) return;
    const res = await axios.get(`${API}/api/admin/training-videos?admin_id=${adminId}`);
    setTrainingVideos(res.data?.videos || []);
  }, [adminId]);

  const fetchOnboardingProgress = useCallback(async () => {
    if (!API) return;
    const params = new URLSearchParams();
    if (user?.id) params.set("user_id", user.id);
    const url = `${API}/api/onboarding/progress${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await axios.get(url);
    setOnboardingProgress(res.data || null);
  }, [user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTrainingVideos(), fetchOnboardingProgress()]);
    } catch (err) {
      console.error("Failed to load onboarding admin page:", err);
      setTrainingVideos([]);
      setOnboardingProgress(null);
    } finally {
      setLoading(false);
    }
  }, [fetchTrainingVideos, fetchOnboardingProgress]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const milestones = useMemo(
    () => normalizeMilestones(onboardingProgress),
    [onboardingProgress]
  );

  const completedMilestones = milestones.filter((m) => m.complete).length;
  const totalMilestones = milestones.length;
  const incompleteMilestones = milestones.filter((m) => !m.complete);
  const progressPct =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const onboardingStep =
    onboardingProgress?.current_step ||
    onboardingProgress?.step ||
    onboardingProgress?.currentStep ||
    "unknown";

  const tutorialCount = trainingVideos.length;
  const onboardingCategoryCount = trainingVideos.filter(
    (video) => String(video.category || "").toLowerCase() === "onboarding"
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
              <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Onboarding & Training</h2>
            </div>
          </div>

          <SmallButton onClick={handleRefresh} disabled={refreshing || loading} icon={RefreshCw}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </SmallButton>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          This page should help admin see where onboarding is moving, where people get stuck, and what training content exists to reduce friction.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Milestones Completed"
          value={`${completedMilestones}/${totalMilestones || 0}`}
          tone="rose"
          hint="Current onboarding milestone state"
        />
        <StatCard
          icon={ShieldCheck}
          label="Progress"
          value={`${progressPct}%`}
          tone="green"
          hint="Completion percentage"
        />
        <StatCard
          icon={PlayCircle}
          label="Training Videos"
          value={tutorialCount}
          tone="plum"
          hint="All admin-managed tutorials"
        />
        <StatCard
          icon={BookOpen}
          label="Onboarding Tutorials"
          value={onboardingCategoryCount}
          tone="gold"
          hint="Videos tagged for onboarding"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Onboarding Health"
          subtitle="Live progress from the onboarding backend"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Current Step</div>
                <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">{String(onboardingStep)}</div>
              </div>

              <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
                <div className="mb-3 text-sm font-semibold text-[var(--cth-admin-ink)]">Milestone Status</div>
                {milestones.length ? (
                  <div className="grid gap-2">
                    {milestones.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cth-surface-elevated-soft)] px-3 py-2">
                        <div className="text-sm capitalize text-[var(--cth-admin-ink)]">{m.label}</div>
                        <StatusPill label={m.complete ? "complete" : "incomplete"} tone={m.complete ? "success" : "warning"} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--cth-admin-muted)]">No milestone data found.</div>
                )}
              </div>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Friction Signals"
          subtitle="Where onboarding may need intervention"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-4">
              <InsightCard
                title="Current completion visibility is live"
                body={`The onboarding API is currently returning ${completedMilestones} completed milestone(s) out of ${totalMilestones || 0}.`}
                tone="success"
              />
              <InsightCard
                title="Incomplete steps should drive support intervention"
                body={
                  incompleteMilestones.length
                    ? `Incomplete milestone(s): ${incompleteMilestones.map((m) => m.label).join(", ")}.`
                    : "No incomplete milestones detected in the current progress payload."
                }
                tone={incompleteMilestones.length ? "warning" : "success"}
              />
              <InsightCard
                title="Training inventory is now visible"
                body={`There are ${tutorialCount} total training video(s), with ${onboardingCategoryCount} tagged specifically for onboarding.`}
                tone="neutral"
              />
              <InsightCard
                title="Next real instrumentation target"
                body="The next improvement is multi-user/workspace onboarding summaries so admin can see who is stuck across the platform, not just the current user context."
                tone="warning"
              />
            </div>
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Training Video Management"
        subtitle="Connected admin training surface"
      >
        {loading ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
        ) : (
          <AdminTrainingVideos
            trainingVideos={trainingVideos}
            fetchTrainingVideos={fetchTrainingVideos}
            adminId={adminId}
          />
        )}
      </PanelCard>

      <PanelCard
        title="Admin Follow-Up Priorities"
        subtitle="What should be connected next"
      >
        <div className="grid gap-3">
          <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-[var(--cth-status-warning-deep)]" size={16} />
              <div>
                <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Aggregate onboarding by workspace</div>
                <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">
                  The current connected view is useful, but the real admin version should summarize onboarding progress across all workspaces and users.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
            <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Tie friction to support actions</div>
            <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">
              Next step is linking stuck onboarding states to Help Desk, Knowledge Base, and Notifications.
            </div>
          </div>

          <div className="rounded-xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-4">
            <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Track training completion, not just training inventory</div>
            <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">
              The page now sees training content. Next it should track who completed which tutorial and where adoption drops.
            </div>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
