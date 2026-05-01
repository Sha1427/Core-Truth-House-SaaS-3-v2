# Core Truth House — App Page Visual Standard

This is the canonical visual specification for every authenticated page in the
Core Truth House app. New pages MUST conform to it; existing pages should be
brought into conformance when touched.

The standard is derived from the Command Center reference implementation and
applied across:

- `src/pages/CommandCenter.jsx` (visual reference)
- `src/pages/BrandAudit.jsx`
- `src/pages/BrandFoundation.jsx`
- `src/pages/IdentityStudio.jsx`
- `src/components/Brand/BrandAuditResults.jsx` (`AuditNextSteps`)

If you are unsure how a section should look, open one of the files above first.

---

## Tokens

All 13 palette tokens are defined in `src/styles/cth-tokens.css` and are
globally available on `:root`. **Always reference them via `var(--cth-command-*)`
— never hard-code hex values in component code.**

| Token | Hex | Use |
| --- | --- | --- |
| `--cth-command-night` | `#0d0010` | Deepest dark surface. Reserved for Command Center hero / dark panels. |
| `--cth-command-purple` | `#33033c` | Primary CTA background. Dark CTA pattern (gold text on purple). Sidebar. |
| `--cth-command-purple-mid` | `#230029` | Mid purple. Hover/pressed states on dark CTAs. |
| `--cth-command-ink` | `#2b1040` | Body and heading text color on light backgrounds. |
| `--cth-command-crimson` | `#af002a` | Active accent. Score-ring fill. Save button. Active card border. AI Draft accent. |
| `--cth-command-cinnabar` | `#e04e35` | Warm secondary accent. Use sparingly (e.g. one of six module colored dots). |
| `--cth-command-gold` | `#c4a95b` | Gold text on dark CTAs. Eyebrow/badge accents. Status callouts. |
| `--cth-command-ivory` | `#f8f4f2` | Light ivory surface. Alternate to `panel` when extra warmth is wanted. |
| `--cth-command-blush` | `#efe7e3` | **Page background.** The default behind every authenticated page. |
| `--cth-command-panel` | `#fffaf7` | **Default card background.** All content cards use this. |
| `--cth-command-panel-soft` | `#f5ece8` | Sub-card / nested-panel background (e.g. preview blocks inside a card). |
| `--cth-command-border` | `#d8c5c3` | All card borders, divider lines, input borders. |
| `--cth-command-muted` | `#7c6576` | Section labels, secondary copy, disabled text, placeholder text. |

---

## Layout primitives

### Page wrapper

Every authenticated page's outermost content `div` (the one immediately inside
`<DashboardLayout>`, sibling-or-wrapping the `<TopBar>`) MUST set the page
background and a viewport-height floor. The `100vh` floor is required because
`.cth-app-body` (the wrapper supplied by `DashboardLayout`) is `display: block`
with `min-height` only — `flex-1` on a child is a no-op and `min-height: 100%`
resolves to `0`. Without `100vh`, the parent's white-ish admin background
shows through below the content.

```js
const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};
```

```jsx
<DashboardLayout>
  <TopBar title="..." subtitle="..." action={...} />

  <div className="flex-1 overflow-auto px-4 py-7 md:px-8" style={PAGE_STYLE}>
    {/* page content */}
  </div>
</DashboardLayout>
```

### Card

The standard card. Use it for every content panel, every nav item, every
sub-block. Borders are 1px, radius is 4px (sharper than generic SaaS), padding
is `28` for top-level cards, `16–24` for nested cards.

```js
const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
};
```

```jsx
<div style={{ ...CARD_STYLE, padding: 28 }}>
  {/* card content */}
</div>
```

**Active state.** When a card represents an active selection (e.g. the chosen
field in a sidebar nav), keep the same `panel` background and 4px radius — only
swap the border color to crimson:

```jsx
<div
  style={{
    ...CARD_STYLE,
    borderColor: isActive
      ? 'var(--cth-command-crimson)'
      : 'var(--cth-command-border)',
  }}
>
```

### Section label (eyebrow)

Uppercase, letter-spaced, muted. Use this for every "AI ANALYSIS",
"AUDIT SUMMARY", "WHY THIS MATTERS", "TIP 1", "NEXT STEP", "OVERALL SCORE",
"ROLE", "FONT FAMILY", etc. label across the app.

```js
const SECTION_LABEL_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};
```

For tighter inline labels (e.g. dotted module score tiles), drop to `fontSize: 10`
with `letterSpacing: '0.2em'`.

### Section heading

Playfair Display, in ink color. Always paired below a section label. Use 24–26px
for in-card section heads and the page-level h1; up to 28px for hero or
prominent summaries.

```js
const SECTION_HEADING_STYLE = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 26,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: '8px 0 0',
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
};
```

```jsx
<p style={SECTION_LABEL_STYLE}>AI Analysis</p>
<h2 style={SECTION_HEADING_STYLE}>Brand Audit Results</h2>
```

### Section subtext

Body copy directly below a heading. DM Sans, muted.

```js
const SECTION_SUBTEXT_STYLE = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: 'var(--cth-command-muted)',
  margin: '4px 0 0',
  lineHeight: 1.55,
};
```

For body paragraphs inside cards (not directly subtext), step up to `fontSize: 14`
and `color: 'var(--cth-command-ink)'` for legibility.

### Field label (small uppercase)

For form-field labels above an input. Same look as `SECTION_LABEL_STYLE` but
slightly smaller and with bottom margin instead of top.

```js
const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  marginBottom: 6,
};
```

### Input / select

All form inputs — text, number, select — use the same shape. Panel background,
command border, 4px radius. Width fills container by default.

```js
const INPUT_STYLE = {
  width: '100%',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '8px 12px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  outline: 'none',
};
```

For long-form `<textarea>`, omit the border on the textarea itself and instead
wrap it in a `CARD_STYLE` div — see Identity Studio's preview-text pattern or
Brand Foundation's editor.

### Score progress bar

Track is `--cth-command-blush`, fill is `--cth-command-crimson`, height 6px,
fully rounded. Same width-percentage pattern across the app.

```jsx
<div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--cth-command-blush)' }}>
  <div
    className="h-full rounded-full transition-all duration-700"
    style={{ width: `${score}%`, background: 'var(--cth-command-crimson)' }}
  />
</div>
```

---

## Buttons

### Primary CTA — gold text on purple

The marquee CTA. Used for "Open Brand Foundation", "Open Strategic OS", "Open
Content Studio", "Generate with AI", "Export Report", and any action that
moves the user forward. Pill-shaped (border-radius `999`); 4px radius is also
acceptable when the button sits in a topbar that's already pill-free.

```js
const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 999,
  padding: '12px 22px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};
```

### Save / destructive — crimson background

Reserved for the topbar Save button (and other one-shot commit actions). Panel-
colored text on a crimson background, 4px radius.

```js
const SAVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-panel)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};

const SAVE_BUTTON_DISABLED_STYLE = {
  ...SAVE_BUTTON_STYLE,
  background: 'var(--cth-command-panel-soft)',
  color: 'var(--cth-command-muted)',
  cursor: 'not-allowed',
};
```

### Secondary / outline

For "Clear field", "Regenerate", "Cancel". Outline pill — transparent
background, command border, ink text.

```js
const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 999,
  padding: '11px 20px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
```

### Ghost / text-only

For "Discard" and other low-priority dismiss actions. Same shape as secondary
but no border and muted color.

```jsx
<button
  style={{
    background: 'transparent',
    color: 'var(--cth-command-muted)',
    border: 'none',
    borderRadius: 999,
    padding: '10px 18px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  }}
>
  Discard
</button>
```

### In-context primary — crimson background

For smaller in-card primary actions (e.g. "Accept" on an AI draft). Pill, but
with a crimson fill instead of gold-on-purple. Use sparingly — gold-on-purple
is the dominant primary; crimson-fill is only for second-tier primaries that
need visual differentiation from the topbar Save.

```js
const ACCEPT_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-panel)',
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};
```

---

## Common composite patterns

### "Next Step" banner

Every page that has a clear next destination ends with this banner — panel card,
4px radius, uppercase muted "NEXT STEP" eyebrow, ink-color body, and a primary
CTA pill on the right. Already present on Brand Audit, Brand Foundation, and
Identity Studio.

```jsx
<div
  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  style={{ ...CARD_STYLE, padding: 24 }}
>
  <div>
    <p style={SECTION_LABEL_STYLE}>Next Step</p>
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      lineHeight: 1.65,
      color: 'var(--cth-command-ink)',
      margin: '8px 0 0',
      maxWidth: 620,
    }}>
      Move into Strategic OS and turn your foundation into positioning, content pillars, offers, and execution.
    </p>
  </div>
  <a href="/strategic-os" className="shrink-0" style={PRIMARY_CTA_STYLE}>
    Open Strategic OS
  </a>
</div>
```

### Score anchor (large display)

For "this number is the page" anchors (e.g. Brand Audit overall score). 220px
conic-gradient ring on a panel card, Playfair 72px number inside.

```jsx
const sweep = Math.max(0, Math.min(360, score * 3.6));

<div style={{ ...CARD_STYLE, padding: '44px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
  <p style={SECTION_LABEL_STYLE}>Overall Score</p>

  <div style={{
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: `conic-gradient(var(--cth-command-crimson) ${sweep}deg, var(--cth-command-blush) ${sweep}deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  }}>
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'var(--cth-command-panel)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 72,
        fontWeight: 600,
        color: 'var(--cth-command-ink)',
        lineHeight: 1,
      }}>
        {score}
      </span>
    </div>
  </div>
</div>
```

### Metric tile (small score card)

Six-up grid of small score cards, e.g. Brand Audit module scores. Card style,
14px radius (the one place we use radius > 4 — softer than CARD_STYLE because
the small format reads tight at 4px), small uppercase label with a colored dot,
Playfair 44px number.

```jsx
<div style={{
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 14,
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: accent,
      display: 'inline-block',
    }} />
    <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10, letterSpacing: '0.2em' }}>
      {label}
    </p>
  </div>
  <p style={{
    fontFamily: "'Playfair Display', serif",
    fontSize: 44,
    fontWeight: 600,
    color: 'var(--cth-command-ink)',
    lineHeight: 1,
    margin: 0,
  }}>
    {value}
    <span style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--cth-command-muted)',
      marginLeft: 6,
    }}>
      /100
    </span>
  </p>
</div>
```

### Status icon (16px)

Inline SVG, no icon-library dependency. Use for compact list/nav indicators
where a text pill would be too heavy.

```jsx
function StatusIcon({ status }) {
  if (status === 'complete') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Complete" role="img">
        <path d="M3 8.5 L6.5 12 L13 5"
              stroke="var(--cth-command-crimson)" strokeWidth="2" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'draft') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="In progress" role="img">
        <circle cx="8" cy="8" r="6" stroke="var(--cth-command-gold)" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2.5" fill="var(--cth-command-gold)" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Not started" role="img">
      <circle cx="8" cy="8" r="6" stroke="var(--cth-command-muted)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
```

---

## Copy-paste header

Drop this block at the top of any new page module to get every reusable style
in one go.

```js
const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 26,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: '8px 0 0',
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
};

const SECTION_SUBTEXT_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: 'var(--cth-command-muted)',
  margin: '4px 0 0',
  lineHeight: 1.55,
};

const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '8px 12px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
};

const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 999,
  padding: '12px 22px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 999,
  padding: '11px 20px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const SAVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-panel)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};
```

---

## What NOT to do

These are non-negotiable. PRs that violate any of these should be rejected.

- **No white page backgrounds.** The page is always `var(--cth-command-blush)`.
  If you find yourself reaching for `bg-white`, `#ffffff`, or
  `var(--cth-app-bg)`, stop.
- **No large border-radius on cards.** Standard is 4px. The single allowed
  exception is small score tiles at 14px (Brand Audit MetricTile). Never
  `rounded-2xl` (16px), never `rounded-3xl` (24px), never `borderRadius: 12+`.
- **No Inter font.** Anywhere. Headlines are Playfair Display, body is DM Sans,
  hex/code is DM Mono (or system monospace stack). If you see Inter sneaking in
  via a shadcn or Tailwind default, override it explicitly with `fontFamily: SANS`.
- **No pure black (`#000000`).** Use `--cth-command-night` (`#0d0010`) or
  `--cth-command-ink` (`#2b1040`) instead.
- **No generic shadcn defaults.** If you import a shadcn `Button`, `Card`, or
  `Input`, you must override its visual styling to match this standard. Better:
  use the inline-style pattern documented above and avoid the component entirely.
- **No em-dashes (`—`) in copy.** Replace with commas, periods, or rewrite. UI
  separator glyphs in tables are the only exception.
- **No crimson left borders on content cards.** The old admin-system pattern
  used `borderLeft: 3px solid var(--cth-admin-accent)` to mark section headings.
  Remove these on sight. Section emphasis is communicated by uppercase muted
  labels, not colored side rails.
- **No neon glow effects, no heavy box-shadows.** A single subtle border is
  sufficient. The look is editorial, not gamified.
- **No `cth-card`, `cth-card-muted`, `cth-page`, `cth-button-primary`,
  `cth-button-secondary`, `cth-kicker`, `cth-heading`, `cth-muted`, `cth-body`,
  `cth-textarea` classes** in new code. Those are the legacy admin design
  system. Use the inline-style objects above instead.
- **No `var(--cth-admin-*)` tokens** in new code, for the same reason. They
  resolve to a different palette and will look wrong in this system.
- **No hard-coded hex values in component code.** Always go through
  `var(--cth-command-*)`. If you need a color that isn't in the 13-token palette,
  raise the question — don't invent.
- **Never override `--cth-command-*` token values locally.** They are defined
  exactly once in `src/styles/cth-tokens.css`. Re-aliasing them in another
  stylesheet (e.g. with `--cth-command-purple: var(--cc-purple);`) is the bug
  pattern that the token-file extraction was created to eliminate.

---

## Pre-merge checklist

Before merging a new page, verify:

1. Page background is `var(--cth-command-blush)` and the wrapper has
   `minHeight: 100vh`.
2. Every card uses `CARD_STYLE` (panel + border + 4px radius).
3. Every section has a `SECTION_LABEL_STYLE` eyebrow and (if applicable) a
   `SECTION_HEADING_STYLE` heading directly below.
4. Every primary CTA is gold-on-purple.
5. Save / destructive button (if present) is crimson-fill, not orange or admin-accent.
6. No `cth-page` / `cth-card` / `cth-admin-*` references remain.
7. No `rounded-2xl` / `rounded-3xl` on cards.
8. No em-dashes in copy.
9. No console errors and no broken layout when the page is opened in the
   authenticated dashboard.
10. Build passes.
