import React, { useEffect } from "react";
import SelectionCard from "./SelectionCard";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const URGENCY_OPTIONS = [
  { value: "", label: "None" },
  { value: "Scarcity", label: "Scarcity" },
  { value: "Deadline", label: "Deadline" },
  { value: "Bonus stack", label: "Bonus stack" },
];

const FUNNEL_OPTIONS = [
  { value: "landing_page", label: "Landing Page URL" },
  { value: "dm_trigger", label: "DM Trigger" },
  { value: "opt_in_form", label: "Opt-in Form" },
  { value: "sales_page", label: "Sales Page" },
  { value: "external_link", label: "External Link" },
];

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

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  minHeight: 84,
  resize: "vertical",
  lineHeight: 1.55,
};

const SELECT_STYLE = {
  ...INPUT_STYLE,
  appearance: "none",
  cursor: "pointer",
  paddingRight: 36,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%237a6a72' d='M6 8 0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const SELECTION_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
  marginTop: 8,
};

const CONDITIONAL_BLOCK_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
  paddingLeft: 16,
  borderLeft: "2px solid var(--cth-command-gold)",
  marginTop: 4,
};

export default function StructureStep({ value, onChange, onValidityChange }) {
  const isOffer = value.campaign_kind === "offer";
  const isNoSide =
    value.campaign_kind === "no_pending" ||
    value.campaign_kind === "lead_magnet" ||
    value.campaign_kind === "content_only";
  const subKind =
    value.campaign_kind === "lead_magnet" || value.campaign_kind === "content_only"
      ? value.campaign_kind
      : null;

  const isValid = Boolean(
    value.cta_primary &&
      value.cta_primary.trim() &&
      value.funnel_destination &&
      (isOffer
        ? value.offer_name &&
          value.offer_name.trim() &&
          value.offer_description &&
          value.offer_description.trim()
        : value.campaign_kind === "lead_magnet"
        ? value.lead_magnet_name &&
          value.lead_magnet_name.trim() &&
          value.lead_magnet_description &&
          value.lead_magnet_description.trim()
        : value.campaign_kind === "content_only"
        ? true
        : false)
  );

  useEffect(() => {
    if (typeof onValidityChange === "function") onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  const handleField = (key) => (e) => onChange({ [key]: e.target.value });

  const handlePriceChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange({ price: null });
      return;
    }
    const parsed = Number(raw);
    onChange({ price: Number.isFinite(parsed) ? parsed : null });
  };

  const pickKind = (kind) => {
    if (kind === "offer") {
      onChange({
        campaign_kind: "offer",
        lead_magnet_name: "",
        lead_magnet_description: "",
      });
    } else if (kind === "no_pending") {
      onChange({
        campaign_kind: "no_pending",
        offer_name: "",
        offer_description: "",
        transformation: "",
        price: null,
        urgency_trigger: "",
      });
    } else if (kind === "lead_magnet") {
      onChange({
        campaign_kind: "lead_magnet",
        offer_name: "",
        offer_description: "",
        transformation: "",
        price: null,
        urgency_trigger: "",
      });
    } else if (kind === "content_only") {
      onChange({
        campaign_kind: "content_only",
        offer_name: "",
        offer_description: "",
        transformation: "",
        price: null,
        urgency_trigger: "",
        lead_magnet_name: "",
        lead_magnet_description: "",
      });
    }
  };

  return (
    <section style={SECTION_STYLE}>
      <header style={SECTION_HEADER_STYLE}>
        <p style={EYEBROW_STYLE}>Step 2 — Structure</p>
        <h2 style={STEP_TITLE_STYLE}>What is this campaign moving?</h2>
        <p style={STEP_INTRO_STYLE}>
          Decide whether this campaign sells something or builds the audience,
          then specify the action you want people to take and where it points.
        </p>
      </header>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE}>
          Does this campaign have an offer?
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <div style={SELECTION_GRID_STYLE}>
          <SelectionCard
            selected={isOffer}
            title="Yes — there's an offer"
            description="This campaign sells a product, service, or program."
            onClick={() => pickKind("offer")}
          />
          <SelectionCard
            selected={isNoSide}
            title="No — awareness or list-building"
            description="Lead magnet, free content, or pure brand presence."
            onClick={() => pickKind("no_pending")}
          />
        </div>
      </div>

      {isOffer && (
        <div style={CONDITIONAL_BLOCK_STYLE}>
          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="offer-name">
              Offer name
              <span style={REQUIRED_MARK_STYLE}>*</span>
            </label>
            <input
              id="offer-name"
              type="text"
              value={value.offer_name || ""}
              onChange={handleField("offer_name")}
              placeholder="e.g. The Brand Operating System"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="offer-description">
              Offer description
              <span style={REQUIRED_MARK_STYLE}>*</span>
            </label>
            <textarea
              id="offer-description"
              value={value.offer_description || ""}
              onChange={handleField("offer_description")}
              placeholder="What's included? What's the format? Who it's for."
              style={TEXTAREA_STYLE}
              rows={3}
            />
          </div>

          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="offer-transformation">
              Transformation
            </label>
            <p style={FIELD_HINT_STYLE}>
              What changes for the buyer between Day 1 and the end?
            </p>
            <textarea
              id="offer-transformation"
              value={value.transformation || ""}
              onChange={handleField("transformation")}
              placeholder="e.g. From scattered messaging to a documented brand operating system."
              style={TEXTAREA_STYLE}
              rows={2}
            />
          </div>

          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="offer-price">
              Price
            </label>
            <p style={FIELD_HINT_STYLE}>USD. Leave blank if undecided.</p>
            <input
              id="offer-price"
              type="number"
              min="0"
              step="any"
              value={value.price ?? ""}
              onChange={handlePriceChange}
              placeholder="e.g. 497"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="offer-urgency">
              Urgency type
            </label>
            <select
              id="offer-urgency"
              value={value.urgency_trigger || ""}
              onChange={handleField("urgency_trigger")}
              style={SELECT_STYLE}
            >
              {URGENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isNoSide && (
        <div style={FIELD_GROUP_STYLE}>
          <label style={FIELD_LABEL_STYLE}>
            What's the role of this campaign?
            <span style={REQUIRED_MARK_STYLE}>*</span>
          </label>
          <div style={SELECTION_GRID_STYLE}>
            <SelectionCard
              selected={subKind === "lead_magnet"}
              title="Lead magnet"
              description="A free resource that captures emails."
              onClick={() => pickKind("lead_magnet")}
            />
            <SelectionCard
              selected={subKind === "content_only"}
              title="Content only"
              description="No conversion mechanic — pure brand presence."
              onClick={() => pickKind("content_only")}
            />
          </div>
        </div>
      )}

      {value.campaign_kind === "lead_magnet" && (
        <div style={CONDITIONAL_BLOCK_STYLE}>
          <div style={FIELD_GROUP_STYLE}>
            <label style={FIELD_LABEL_STYLE} htmlFor="lead-magnet-name">
              Lead magnet name
              <span style={REQUIRED_MARK_STYLE}>*</span>
            </label>
            <input
              id="lead-magnet-name"
              type="text"
              value={value.lead_magnet_name || ""}
              onChange={handleField("lead_magnet_name")}
              placeholder="e.g. The 5-Day Brand Audit Workbook"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_GROUP_STYLE}>
            <label
              style={FIELD_LABEL_STYLE}
              htmlFor="lead-magnet-description"
            >
              Lead magnet description
              <span style={REQUIRED_MARK_STYLE}>*</span>
            </label>
            <textarea
              id="lead-magnet-description"
              value={value.lead_magnet_description || ""}
              onChange={handleField("lead_magnet_description")}
              placeholder="What's in it. Who it's for. Why it's worth the email address."
              style={TEXTAREA_STYLE}
              rows={3}
            />
          </div>
        </div>
      )}

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="primary-cta">
          Primary CTA
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          One action the audience should take. Not three. Not "and also".
        </p>
        <input
          id="primary-cta"
          type="text"
          value={value.cta_primary || ""}
          onChange={handleField("cta_primary")}
          placeholder="e.g. Apply for the Estate cohort"
          style={INPUT_STYLE}
        />
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="funnel-destination">
          Funnel destination
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          Where does the CTA point? You'll fill the actual URL on the
          campaign detail page.
        </p>
        <select
          id="funnel-destination"
          value={value.funnel_destination || ""}
          onChange={handleField("funnel_destination")}
          style={SELECT_STYLE}
        >
          <option value="">Choose a destination…</option>
          {FUNNEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
