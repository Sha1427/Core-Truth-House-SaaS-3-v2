import React, { useEffect } from "react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Email",
  "Blog",
  "Threads",
  "X",
  "Pinterest",
  "Facebook",
];

const PHASES = ["Tease", "Reveal", "Proof", "Close", "After"];

const MIN_DURATION = 5;

function generateDefaultTimeline(duration) {
  if (!duration || duration < MIN_DURATION) return [];
  const baseLen = Math.floor(duration / PHASES.length);
  const remainder = duration % PHASES.length;
  let cursor = 1;
  return PHASES.map((phase, i) => {
    const len = baseLen + (i < remainder ? 1 : 0);
    const start_day = cursor;
    const end_day = cursor + len - 1;
    cursor = end_day + 1;
    return { phase, start_day, end_day };
  });
}

const SECTION_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
  fontFamily: SANS,
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const STEP_TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 28,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  margin: 0,
  lineHeight: 1.2,
};

const STEP_INTRO_STYLE = {
  fontFamily: SANS,
  fontSize: 14,
  color: "var(--cth-command-muted)",
  margin: 0,
  lineHeight: 1.6,
  maxWidth: 620,
};

const FIELD_GROUP_STYLE = {
  display: "flex",
  flexDirection: "column",
};

const FIELD_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  display: "inline-block",
};

const REQUIRED_MARK_STYLE = {
  color: "var(--cth-command-crimson)",
  marginLeft: 2,
};

const FIELD_HINT_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-command-muted)",
  margin: "4px 0 0 0",
  lineHeight: 1.5,
};

const FIELD_ERROR_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-danger)",
  margin: "6px 0 0 0",
  lineHeight: 1.5,
};

const INPUT_STYLE = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 4,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 14,
  marginTop: 8,
  outline: "none",
  boxSizing: "border-box",
};

const CHIP_GRID_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

const CHIP_STYLE = (selected) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 14px",
  borderRadius: 999,
  border: `1px solid ${
    selected ? "var(--cth-command-gold)" : "var(--cth-command-border)"
  }`,
  background: selected
    ? "color-mix(in srgb, var(--cth-command-gold) 15%, var(--cth-command-panel))"
    : "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: selected ? 600 : 500,
  cursor: "pointer",
  outline: "none",
  transition: "border-color 200ms ease, background-color 200ms ease",
});

const PHASE_HEADER_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 8,
  flexWrap: "wrap",
};

const RESUGGEST_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "7px 14px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const PHASE_LIST_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 12,
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 16,
};

const PHASE_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 4px",
  flexWrap: "wrap",
};

const PHASE_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "0.04em",
  minWidth: 64,
};

const PHASE_INPUT_GROUP_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const DAY_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-command-muted)",
};

const DAY_INPUT_STYLE = {
  width: 64,
  padding: "8px 10px",
  borderRadius: 4,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

const PHASE_EMPTY_HINT_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: "var(--cth-command-muted)",
  margin: 0,
  padding: "16px 4px",
  textAlign: "center",
  lineHeight: 1.55,
};

export default function DistributionStep({ value, onChange, onValidityChange }) {
  const platforms = Array.isArray(value.platforms) ? value.platforms : [];
  const phaseTimeline = Array.isArray(value.phase_timeline)
    ? value.phase_timeline
    : [];
  const durationBelowMin =
    typeof value.duration_days === "number" &&
    value.duration_days > 0 &&
    value.duration_days < MIN_DURATION;

  const isValid = Boolean(
    platforms.length > 0 &&
      typeof value.duration_days === "number" &&
      value.duration_days >= MIN_DURATION &&
      value.start_date &&
      phaseTimeline.length > 0 &&
      phaseTimeline.every(
        (p) =>
          typeof p.start_day === "number" &&
          typeof p.end_day === "number" &&
          p.start_day >= 1 &&
          p.start_day <= p.end_day
      )
  );

  useEffect(() => {
    if (typeof onValidityChange === "function") onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  useEffect(() => {
    if (!value.duration_days || value.duration_days < MIN_DURATION) return;
    if (phaseTimeline.length > 0) return;
    onChange({ phase_timeline: generateDefaultTimeline(value.duration_days) });
  }, [value.duration_days, phaseTimeline.length, onChange]);

  const handlePlatformToggle = (platform) => {
    const next = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform];
    onChange({ platforms: next });
  };

  const handleDurationChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange({ duration_days: null });
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange({ duration_days: Math.floor(parsed) });
  };

  const handleDateChange = (e) => onChange({ start_date: e.target.value });

  const handleResuggest = () => {
    if (!value.duration_days || value.duration_days < MIN_DURATION) return;
    onChange({ phase_timeline: generateDefaultTimeline(value.duration_days) });
  };

  const updatePhase = (index, key, raw) => {
    const parsed = raw === "" ? null : Number(raw);
    if (raw !== "" && !Number.isFinite(parsed)) return;
    const next = phaseTimeline.map((p, i) =>
      i === index ? { ...p, [key]: parsed } : p
    );
    onChange({ phase_timeline: next });
  };

  return (
    <section style={SECTION_STYLE}>
      <header style={SECTION_HEADER_STYLE}>
        <p style={EYEBROW_STYLE}>Step 3 — Distribution</p>
        <h2 style={STEP_TITLE_STYLE}>Where it runs and how long</h2>
        <p style={STEP_INTRO_STYLE}>
          Pick the platforms, set the duration, and shape the phase timeline.
          We auto-suggest a five-phase split — adjust any phase's day range as
          needed.
        </p>
      </header>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE}>
          Platforms
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          Where the campaign shows up. Pick all that apply.
        </p>
        <div style={CHIP_GRID_STYLE} role="group" aria-label="Platforms">
          {PLATFORMS.map((platform) => {
            const selected = platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => handlePlatformToggle(platform)}
                style={CHIP_STYLE(selected)}
                aria-pressed={selected}
              >
                {platform}
              </button>
            );
          })}
        </div>
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-duration">
          Campaign duration
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          Total days from launch through the After phase. Minimum {MIN_DURATION}{" "}
          days.
        </p>
        <input
          id="campaign-duration"
          type="number"
          min={MIN_DURATION}
          step={1}
          value={value.duration_days ?? ""}
          onChange={handleDurationChange}
          placeholder="e.g. 14"
          style={INPUT_STYLE}
        />
        {durationBelowMin && (
          <p style={FIELD_ERROR_STYLE}>
            Campaigns must be at least {MIN_DURATION} days.
          </p>
        )}
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-start-date">
          Launch date
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          Day 1 of the timeline. Past dates are allowed.
        </p>
        <input
          id="campaign-start-date"
          type="date"
          value={value.start_date || ""}
          onChange={handleDateChange}
          style={INPUT_STYLE}
        />
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <div style={PHASE_HEADER_ROW_STYLE}>
          <div>
            <label style={FIELD_LABEL_STYLE}>
              Phase timeline
              <span style={REQUIRED_MARK_STYLE}>*</span>
            </label>
            <p style={FIELD_HINT_STYLE}>
              Day ranges relative to launch. Day 1 is the launch day.
            </p>
          </div>
          {value.duration_days >= MIN_DURATION && phaseTimeline.length > 0 && (
            <button
              type="button"
              onClick={handleResuggest}
              style={RESUGGEST_BUTTON_STYLE}
            >
              Re-suggest from duration
            </button>
          )}
        </div>

        {phaseTimeline.length === 0 ? (
          <div style={PHASE_LIST_STYLE}>
            <p style={PHASE_EMPTY_HINT_STYLE}>
              Set a campaign duration of at least {MIN_DURATION} days to
              generate the phase timeline.
            </p>
          </div>
        ) : (
          <div style={PHASE_LIST_STYLE}>
            {phaseTimeline.map((p, i) => (
              <div key={p.phase} style={PHASE_ROW_STYLE}>
                <span style={PHASE_LABEL_STYLE}>{p.phase}</span>
                <div style={PHASE_INPUT_GROUP_STYLE}>
                  <span style={DAY_LABEL_STYLE}>Day</span>
                  <input
                    type="number"
                    min={1}
                    max={value.duration_days || undefined}
                    value={p.start_day ?? ""}
                    onChange={(e) => updatePhase(i, "start_day", e.target.value)}
                    style={DAY_INPUT_STYLE}
                    aria-label={`${p.phase} start day`}
                  />
                  <span style={DAY_LABEL_STYLE}>–</span>
                  <span style={DAY_LABEL_STYLE}>Day</span>
                  <input
                    type="number"
                    min={p.start_day || 1}
                    max={value.duration_days || undefined}
                    value={p.end_day ?? ""}
                    onChange={(e) => updatePhase(i, "end_day", e.target.value)}
                    style={DAY_INPUT_STYLE}
                    aria-label={`${p.phase} end day`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
