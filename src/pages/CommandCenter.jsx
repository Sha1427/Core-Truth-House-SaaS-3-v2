import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 AlertCircle,
 ArrowUpRight,
 BarChart3,
 BookOpen,
 CalendarDays,
 Check,
 CheckCircle2,
 Compass,
 FileText,
 Grid2X2,
 Image,
 Layers3,
 Loader2,
 Megaphone,
 PenTool,
 ShieldCheck,
 Sparkles,
 Star,
 Target,
 TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const COMMAND_CENTER_CSS = `
.cth-command-page {
 --cc-night: #0d0010;
 --cc-purple: #33033c;
 --cc-purple-mid: #230029;
 --cc-ink: #2b1040;
 --cc-crimson: #af002a;
 --cc-cinnabar: #e04e35;
 --cc-gold: #c4a95b;
 --cc-ivory: #f8f4f2;
 --cc-blush: #efe7e3;
 --cc-panel: #fffaf7;
 --cc-panel-soft: #f5ece8;
 --cc-border: #d8c5c3;
 --cc-muted: #7c6576;
 min-height: 100%;
 background: var(--cc-blush);
 color: var(--cc-ink);
}

.cth-command-page * {
 box-sizing: border-box;
}

.cth-command-shell {
 width: 100%;
 min-height: 100%;
 background:
 radial-gradient(circle at 12% 10%, rgba(196,169,91,0.14), transparent 26%),
 linear-gradient(180deg, #f8f4f2 0%, #efe7e3 46%, #f8f4f2 100%);
}

.cth-command-topbar {
 min-height: 72px;
 background: #fffaf7;
 border-bottom: 1px solid rgba(216,197,195,0.92);
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 24px;
 padding: 0 clamp(24px, 4vw, 44px);
}

.cth-command-topbar h1 {
 margin: 0;
 color: var(--cc-ink);
 font-size: clamp(22px, 2.4vw, 30px);
 line-height: 1;
 font-weight: 900;
 letter-spacing: 0.02em;
 text-transform: uppercase;
}

.cth-command-date {
 display: inline-flex;
 align-items: center;
 gap: 10px;
 color: var(--cc-ink);
 font-size: 14px;
 font-weight: 650;
}

.cth-command-content {
 width: 100%;
}

.cth-command-hero {
 position: relative;
 overflow: hidden;
 min-height: clamp(270px, 25vw, 330px);
 background:
 linear-gradient(90deg, rgba(51,3,60,0.98) 0%, rgba(51,3,60,0.88) 42%, rgba(13,0,16,0.40) 66%, rgba(13,0,16,0.05) 100%),
 url('/command-center-assets/cth-command-center-hero-door-entrance.png') right center / auto 118% no-repeat,
 linear-gradient(135deg, #33033c 0%, #0d0010 100%);
 border-bottom: 1px solid rgba(216,197,195,0.65);
 isolation: isolate;
}

.cth-command-hero::before {
 content: "";
 position: absolute;
 inset: 0;
 background:
 linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px),
 linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px);
 background-size: 44px 44px;
 opacity: 0.28;
 pointer-events: none;
}

.cth-command-hero-inner {
 position: relative;
 z-index: 1;
 width: min(100%, 1480px);
 min-height: clamp(270px, 25vw, 330px);
 display: flex;
 align-items: center;
 padding: clamp(34px, 4.5vw, 64px) clamp(28px, 5vw, 64px);
}

.cth-command-hero-copy {
 max-width: 760px;
}

.cth-command-pill {
 display: inline-flex;
 align-items: center;
 gap: 9px;
 padding: 9px 15px;
 border-radius: 999px;
 background: rgba(255,255,255,0.10);
 color: var(--cc-gold);
 border: 1px solid rgba(255,255,255,0.12);
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.26em;
 text-transform: uppercase;
}

.cth-command-hero h2 {
 margin: 24px 0 0;
 max-width: 820px;
 color: #fff;
 font-family: "Playfair Display", Georgia, serif;
 font-size: clamp(42px, 5.4vw, 72px);
 line-height: 0.98;
 letter-spacing: -0.045em;
 font-weight: 650;
}

.cth-command-hero p {
 margin: 24px 0 0;
 max-width: 650px;
 color: rgba(255,255,255,0.82);
 font-size: clamp(15px, 1.25vw, 18px);
 line-height: 1.75;
}

.cth-command-main {
 width: 100%;
 padding: clamp(24px, 3vw, 36px) clamp(24px, 4vw, 44px) 48px;
}

.cth-command-grid {
 width: 100%;
 display: grid;
 grid-template-columns: 1fr;
 gap: 22px;
 align-items: start;
}

.cth-command-score-row {
 display: grid;
 grid-template-columns: minmax(320px, 1.4fr) repeat(4, minmax(150px, 1fr));
 gap: 0;
 overflow: hidden;
 border: 1px solid var(--cc-border);
 border-radius: 18px;
 background: rgba(255,250,247,0.82);
 box-shadow: 0 18px 50px rgba(51,3,60,0.06);
}

.cth-command-score-main,
.cth-command-metric {
 min-height: 212px;
 background: rgba(255,250,247,0.78);
 border-right: 1px solid rgba(216,197,195,0.75);
 padding: 28px 24px;
}

.cth-command-metric:last-child {
 border-right: none;
}

.cth-command-kicker {
 color: var(--cc-ink);
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.16em;
 text-transform: uppercase;
}

.cth-command-score-flex {
 margin-top: 25px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 22px;
}

.cth-command-score-number {
 color: var(--cc-ink);
 font-family: "Playfair Display", Georgia, serif;
 font-size: clamp(62px, 5vw, 88px);
 line-height: 0.88;
 letter-spacing: -0.05em;
}

.cth-command-score-number span {
 color: rgba(43,16,64,0.48);
 font-family: inherit;
 font-size: 28px;
 letter-spacing: -0.04em;
}

.cth-command-rating {
 margin-top: 15px;
 color: #a37328;
 font-weight: 700;
 font-size: 15px;
}

.cth-command-ring {
 position: relative;
 width: 112px;
 height: 112px;
 border-radius: 999px;
 background:
 conic-gradient(var(--cc-crimson) 0deg 255deg, rgba(196,169,91,0.76) 255deg 320deg, rgba(216,197,195,0.72) 320deg 360deg);
 display: grid;
 place-items: center;
}

.cth-command-ring::after {
 content: "";
 position: absolute;
 inset: 15px;
 border-radius: 999px;
 background: var(--cc-panel);
}

.cth-command-ring svg {
 position: relative;
 z-index: 1;
 color: var(--cc-ink);
}

.cth-command-metric {
 text-align: center;
}

.cth-command-metric-icon {
 width: 64px;
 height: 64px;
 margin: 0 auto 20px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 color: #fff;
 box-shadow: 0 14px 25px rgba(51,3,60,0.16);
}

.cth-command-metric h3 {
 margin: 0;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.14em;
 text-transform: uppercase;
 color: var(--cc-ink);
}

.cth-command-metric-value {
 margin-top: 20px;
 font-family: "Playfair Display", Georgia, serif;
 color: var(--cc-ink);
 font-size: 46px;
 line-height: 1;
}

.cth-command-metric-value span {
 color: rgba(43,16,64,0.50);
 font-size: 20px;
}

.cth-command-metric p {
 margin: 12px 0 0;
 color: var(--cc-muted);
 font-size: 13px;
}

.cth-command-best-move {
 min-height: 212px;
 border-radius: 4px;
 background:
 radial-gradient(circle at top right, rgba(196,169,91,0.20), transparent 34%),
 linear-gradient(135deg, #33033c 0%, #19051f 68%, #0d0010 100%);
 padding: 30px 28px;
 color: #fff;
 box-shadow: 0 20px 42px rgba(51,3,60,0.18);
}

.cth-command-best-move .label {
 display: inline-flex;
 align-items: center;
 gap: 9px;
 color: var(--cc-gold);
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.16em;
 text-transform: uppercase;
}

.cth-command-best-move h3 {
 margin: 22px 0 0;
 font-family: "Playfair Display", Georgia, serif;
 font-size: clamp(24px, 2vw, 32px);
 line-height: 1.05;
 color: #fff;
 font-weight: 600;
}

.cth-command-best-move p {
 margin: 15px 0 0;
 color: rgba(255,255,255,0.78);
 font-size: 14px;
 line-height: 1.65;
}

.cth-command-gold-button {
 margin-top: 25px;
 width: 100%;
 min-height: 46px;
 border: 0;
 border-radius: 8px;
 background: linear-gradient(135deg, #c4a95b, #b88d35);
 color: #fffaf7;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.13em;
 text-transform: uppercase;
 cursor: pointer;
}

.cth-command-lower-grid {
 margin-top: 22px;
 display: grid;
 grid-template-columns: minmax(280px, 0.85fr) minmax(300px, 1fr) minmax(300px, 1fr);
 gap: 22px;
}

.cth-command-panel {
 background: rgba(255,250,247,0.82);
 border: 1px solid var(--cc-border);
 border-radius: 4px;
 box-shadow: 0 18px 50px rgba(51,3,60,0.055);
 padding: 28px 26px;
}

.cth-command-panel-title {
 display: flex;
 align-items: center;
 gap: 14px;
 color: var(--cc-ink);
 font-size: 14px;
 font-weight: 900;
 letter-spacing: 0.14em;
 text-transform: uppercase;
 margin-bottom: 24px;
}

.cth-command-list {
 display: grid;
 gap: 16px;
}

.cth-command-check-row {
 display: grid;
 grid-template-columns: 24px 1fr auto;
 gap: 14px;
 align-items: center;
 font-size: 15px;
 color: var(--cc-ink);
}

.cth-command-check {
 width: 23px;
 height: 23px;
 border-radius: 999px;
 border: 1px solid rgba(43,16,64,0.35);
 display: grid;
 place-items: center;
 color: #fff;
}

.cth-command-check.done {
 background: #8a0924;
 border-color: #8a0924;
}

.cth-command-check-status {
 font-size: 12px;
 color: var(--cc-muted);
}

.cth-command-check-status.done {
 color: #4f7f5a;
}

.cth-command-rhythm-row,
.cth-command-memory-row {
 display: grid;
 grid-template-columns: 56px 1fr;
 gap: 14px;
 align-items: center;
 min-height: 64px;
 border: 1px solid rgba(216,197,195,0.76);
 border-radius: 8px;
 padding: 10px 12px;
 background: rgba(255,250,247,0.56);
}

.cth-command-letter {
 width: 48px;
 height: 48px;
 border-radius: 5px;
 display: grid;
 place-items: center;
 color: #fff;
 font-family: "Playfair Display", Georgia, serif;
 font-size: 25px;
}

.cth-command-row-label {
 color: #8a0924;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.14em;
 text-transform: uppercase;
}

.cth-command-row-body {
 margin-top: 3px;
 color: var(--cc-ink);
 font-size: 14px;
 line-height: 1.35;
}

.cth-command-memory-row {
 grid-template-columns: 54px 1fr;
}

.cth-command-memory-icon {
 width: 48px;
 height: 48px;
 border-radius: 6px;
 display: grid;
 place-items: center;
 color: #9f1731;
 border: 1px solid rgba(216,197,195,0.76);
 background: rgba(255,250,247,0.64);
}

.cth-command-link {
 margin-top: 24px;
 display: inline-flex;
 align-items: center;
 gap: 8px;
 color: #8a0924;
 font-size: 13px;
 font-weight: 900;
 letter-spacing: 0.12em;
 text-transform: uppercase;
 cursor: pointer;
 background: transparent;
 border: 0;
 padding: 0;
}

.cth-command-quote {
 margin-top: 28px;
 min-height: 76px;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: clamp(16px, 5vw, 54px);
 background:
 linear-gradient(90deg, #2a002f 0%, #33033c 50%, #250026 100%);
 color: var(--cc-gold);
 font-family: "Playfair Display", Georgia, serif;
 font-size: clamp(18px, 2vw, 26px);
 letter-spacing: 0.04em;
 text-align: center;
}

.cth-command-quote::before,
.cth-command-quote::after {
 content: "";
 width: min(12vw, 140px);
 height: 1px;
 background: rgba(196,169,91,0.55);
}

.cth-command-error {
 margin: 22px 44px 0;
 border: 1px solid rgba(175,0,42,0.25);
 background: rgba(175,0,42,0.08);
 color: #8a0924;
 padding: 14px 16px;
 border-radius: 12px;
 display: flex;
 gap: 8px;
 align-items: center;
 font-size: 14px;
}

@media (max-width: 1280px) {
 .cth-command-grid,
 .cth-command-lower-grid {
 grid-template-columns: 1fr;
 }

 .cth-command-score-row {
 grid-template-columns: repeat(2, minmax(0, 1fr));
 }

 .cth-command-score-main {
 grid-column: span 2;
 }
}

@media (max-width: 760px) {
 .cth-command-topbar {
 align-items: flex-start;
 flex-direction: column;
 padding: 22px;
 }

 .cth-command-hero {
 background:
 linear-gradient(90deg, rgba(51,3,60,0.97), rgba(13,0,16,0.72)),
 url('/command-center-assets/cth-command-center-hero-door-entrance.png') right bottom / auto 92% no-repeat,
 linear-gradient(135deg, #33033c 0%, #0d0010 100%);
 }

 .cth-command-main {
 padding: 20px;
 }

 .cth-command-score-row {
 grid-template-columns: 1fr;
 }

 .cth-command-score-main {
 grid-column: auto;
 }

 .cth-command-score-main,
 .cth-command-metric {
 border-right: 0;
 border-bottom: 1px solid rgba(216,197,195,0.75);
 }
}
`;


const COMMAND_CENTER_EXTENSION_CSS = `
.cth-command-kpi-strip {
 margin: 24px auto 0;
 display: grid;
 grid-template-columns: repeat(3, minmax(200px, 1fr));
 gap: 18px;
 width: min(100%, 920px);
}

.cth-command-kpi-card,
.cth-command-extra-panel {
 background: rgba(255,250,247,0.88);
 border: 1px solid var(--cc-border);
 box-shadow: 0 16px 44px rgba(51,3,60,0.055);
}

.cth-command-kpi-card {
 min-height: 116px;
 padding: 18px;
 display: grid;
 grid-template-columns: 58px 1fr;
 align-items: center;
 gap: 16px;
}

.cth-command-kpi-icon {
 width: 54px;
 height: 54px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 color: #9f1731;
 border: 1px solid rgba(196,169,91,0.38);
 background: rgba(196,169,91,0.10);
}

.cth-command-kpi-label {
 color: var(--cc-ink);
 font-size: 14px;
 font-weight: 850;
}

.cth-command-kpi-value {
 margin-top: 5px;
 color: var(--cc-ink);
 font-family: "Playfair Display", Georgia, serif;
 font-size: 36px;
 line-height: 1;
}

.cth-command-kpi-sub {
 margin-top: 7px;
 color: #0d7b55;
 font-size: 12px;
 font-weight: 800;
}

.cth-command-extra-grid {
 margin-top: 24px;
 display: grid;
 grid-template-columns: minmax(280px, .92fr) minmax(360px, 1.08fr) minmax(360px, 1.28fr);
 gap: 22px;
}

.cth-command-wide-grid {
 margin-top: 22px;
 display: grid;
 grid-template-columns: minmax(420px, 1.35fr) minmax(300px, .9fr) minmax(300px, .9fr);
 gap: 22px;
}

.cth-command-extra-panel {
 padding: 26px;
}

.cth-command-extra-title {
 display: flex;
 align-items: center;
 gap: 12px;
 color: var(--cc-ink);
 font-family: "Playfair Display", Georgia, serif;
 font-size: 24px;
 line-height: 1;
 font-weight: 650;
 padding-bottom: 16px;
 border-bottom: 1px solid rgba(216,197,195,.8);
 margin-bottom: 14px;
}

.cth-command-mini-list {
 display: grid;
 gap: 0;
}

.cth-command-mini-row {
 min-height: 50px;
 display: grid;
 grid-template-columns: 34px 1fr auto;
 gap: 12px;
 align-items: center;
 border-bottom: 1px solid rgba(216,197,195,.62);
 color: var(--cc-ink);
}

.cth-command-mini-number {
 width: 24px;
 height: 24px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 background: var(--cc-crimson);
 color: #fff;
 font-size: 12px;
 font-weight: 900;
}

.cth-command-mini-time {
 color: var(--cc-muted);
 font-size: 12px;
 white-space: nowrap;
}

.cth-command-insight-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 min-height: 150px;
}

.cth-command-insight-cell {
 display: flex;
 flex-direction: column;
 justify-content: center;
 text-align: center;
 border-right: 1px solid rgba(216,197,195,.74);
 padding: 16px;
}

.cth-command-insight-cell:last-child {
 border-right: 0;
}

.cth-command-insight-label {
 color: var(--cc-ink);
 font-size: 12px;
 font-weight: 850;
}

.cth-command-insight-value {
 margin-top: 14px;
 color: var(--cc-crimson);
 font-family: "Playfair Display", Georgia, serif;
 font-size: 36px;
 line-height: 1;
}

.cth-command-insight-sub {
 margin-top: 8px;
 color: var(--cc-muted);
 font-size: 12px;
}

.cth-command-roadmap {
 display: grid;
 gap: 14px;
 margin-top: 18px;
}

.cth-command-roadmap-stage {
 display: grid;
 grid-template-columns: 150px 1fr;
 gap: 14px;
 align-items: center;
}

.cth-command-roadmap-label {
 display: flex;
 align-items: center;
 gap: 9px;
 color: var(--cc-ink);
 font-size: 13px;
 font-weight: 750;
}

.cth-command-roadmap-track {
 height: 14px;
 border-radius: 999px;
 background: rgba(216,197,195,.48);
 overflow: hidden;
}

.cth-command-roadmap-fill {
 height: 100%;
 border-radius: inherit;
 background: linear-gradient(90deg, #8a0924, #af002a);
}

.cth-command-snapshot-grid {
 margin-top: 18px;
 display: grid;
 grid-template-columns: repeat(3, minmax(72px, 1fr));
 gap: 10px;
}

.cth-command-snapshot-button {
 min-height: 82px;
 border: 1px solid rgba(216,197,195,.82);
 background: rgba(255,250,247,.72);
 color: var(--cc-ink);
 display: grid;
 place-items: center;
 gap: 6px;
 cursor: pointer;
 font-size: 12px;
 font-weight: 750;
}

.cth-command-snapshot-button.active {
 color: var(--cc-crimson);
 background: rgba(175,0,42,.06);
 border-color: rgba(175,0,42,.30);
}

.cth-command-date-badge {
 width: 46px;
 min-height: 46px;
 border: 1px solid rgba(175,0,42,.25);
 background: rgba(175,0,42,.06);
 color: var(--cc-crimson);
 display: grid;
 place-items: center;
 text-align: center;
 font-weight: 900;
 font-size: 11px;
 line-height: 1.05;
 text-transform: uppercase;
}

.cth-command-founder-note {
 margin-top: 24px;
 display: grid;
 grid-template-columns: 76px 1fr auto;
 align-items: center;
 gap: 20px;
 background: rgba(255,250,247,.9);
 border: 1px solid var(--cc-border);
 box-shadow: 0 18px 50px rgba(51,3,60,.055);
 padding: 24px 28px;
}

.cth-command-founder-seal {
 width: 68px;
 height: 68px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 background: linear-gradient(135deg, #c4a95b, #b88d35);
 color: #fff;
}

.cth-command-founder-note h3 {
 margin: 0;
 color: var(--cc-ink);
 font-family: "Playfair Display", Georgia, serif;
 font-size: 24px;
}

.cth-command-founder-note p {
 margin: 8px 0 0;
 color: #4d3852;
 line-height: 1.55;
}

.cth-command-founder-quote {
 color: var(--cc-gold);
 font-family: "Playfair Display", Georgia, serif;
 font-size: 70px;
 line-height: 1;
 opacity: .78;
}

@media (max-width: 1280px) {
 .cth-command-kpi-strip,
 .cth-command-extra-grid,
 .cth-command-wide-grid {
 grid-template-columns: 1fr 1fr;
 }

 .cth-command-wide-grid > :first-child,
 .cth-command-extra-grid > :last-child {
 grid-column: 1 / -1;
 }
}

@media (max-width: 760px) {
 .cth-command-kpi-strip,
 .cth-command-extra-grid,
 .cth-command-wide-grid,
 .cth-command-insight-grid,
 .cth-command-founder-note {
 grid-template-columns: 1fr;
 }

 .cth-command-insight-cell {
 border-right: 0;
 border-bottom: 1px solid rgba(216,197,195,.74);
 }

 .cth-command-roadmap-stage {
 grid-template-columns: 1fr;
 }

 .cth-command-founder-quote {
 display: none;
 }
}
`;

const MILESTONE_LABELS = {
 audit_complete: "Complete Brand Diagnostic",
 brand_memory_complete: "Define Core Messaging Pillars",
 foundation_complete: "Audit Website Copy & SEO",
 strategic_os_started: "Build Content Strategy Map",
 first_campaign_created: "Review Offer Architecture",
};

const METRIC_FALLBACKS = [
 {
 title: "Clarity",
 score: 82,
 label: "Clear Direction",
 note: "Brand truth and messaging center are becoming easier to explain.",
 Icon: Sparkles,
 color: "#8a0924",
 },
 {
 title: "Structure",
 score: 74,
 label: "Solid Systems",
 note: "Your offers, rooms, and rules need cleaner connection.",
 Icon: Grid2X2,
 color: "#33033c",
 },
 {
 title: "Execution",
 score: 71,
 label: "On Track",
 note: "Campaign movement is active and ready for stronger rhythm.",
 Icon: Target,
 color: "#b93222",
 },
 {
 title: "Optimization",
 score: 76,
 label: "Room to Elevate",
 note: "Insights are present and should drive your next decisions.",
 Icon: BarChart3,
 color: "#c4a95b",
 },
];


function clampCommandScore(value, fallback = 0) {
 const numeric = Number(value);
 if (!Number.isFinite(numeric)) return fallback;
 return Math.max(0, Math.min(100, Math.round(numeric)));
}

function firstAuditScore(scoreBag, keys) {
 for (const key of keys) {
 const value = scoreBag?.[key];
 if (value !== undefined && value !== null && value !== "") {
 return clampCommandScore(value, null);
 }
 }
 return null;
}

function averageAuditScores(values) {
 const valid = values.filter((value) => Number.isFinite(Number(value)));
 if (!valid.length) return null;
 return clampCommandScore(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length, null);
}

function buildHealthMetricsFromAudit(audit) {
 const scoreBag = audit?.module_scores || audit?.scores || {};
 const overall = clampCommandScore(
 audit?.overall_score ?? audit?.overallScore ?? audit?.score ?? scoreBag?.overall,
 null
 );

 const clarity = averageAuditScores([
 firstAuditScore(scoreBag, ["brand_foundation", "foundation"]),
 firstAuditScore(scoreBag, ["visual_identity", "identity"]),
 ]);

 const structure = averageAuditScores([
 firstAuditScore(scoreBag, ["offer_suite", "offers"]),
 firstAuditScore(scoreBag, ["systems_and_sops", "systems"]),
 ]);

 const execution = averageAuditScores([
 firstAuditScore(scoreBag, ["content_library", "content"]),
 firstAuditScore(scoreBag, ["launch_readiness", "launch"]),
 ]);

 const optimization = overall;

 const liveScores = {
 Clarity: clarity,
 Structure: structure,
 Execution: execution,
 Optimization: optimization,
 };

 return METRIC_FALLBACKS.map((metric) => {
 const liveScore = liveScores[metric.title];
 const hasLiveScore = Number.isFinite(Number(liveScore));

 return {
 ...metric,
 score: hasLiveScore ? clampCommandScore(liveScore, metric.score) : metric.score,
 label: hasLiveScore ? "Live Audit Score" : metric.label,
 note: hasLiveScore ? "Pulled from the latest Brand Audit." : metric.note,
 };
 });
}

function ScoreRing() {
 return (
 <div className="cth-command-ring">
 <ShieldCheck size={34} />
 </div>
 );
}

function ScorePanel({ score, rating }) {
 return (
 <div className="cth-command-score-main">
 <div className="cth-command-kicker">Brand Health Score</div>
 <div className="cth-command-score-flex">
 <div>
 <div className="cth-command-score-number">
 {score}<span>/100</span>
 </div>
 <div className="cth-command-rating">{rating}</div>
 </div>
 <ScoreRing />
 </div>
 </div>
 );
}

function MetricTile({ metric }) {
 const Icon = metric.Icon;
 return (
 <div className="cth-command-metric">
 <div className="cth-command-metric-icon" style={{ background: metric.color }}>
 <Icon size={25} />
 </div>
 <h3>{metric.title}</h3>
 <div className="cth-command-metric-value">
 {metric.score}<span>/100</span>
 </div>
 <p>{metric.label}</p>
 </div>
 );
}


function cthBestMoveClamp(value, fallback = null) {
 const numeric = Number(value);
 if (!Number.isFinite(numeric)) return fallback;
 return Math.max(0, Math.min(100, Math.round(numeric)));
}

function cthBestMoveFirstScore(scoreBag, keys) {
 for (const key of keys) {
 const value = scoreBag?.[key];
 if (value !== undefined && value !== null && value !== "") {
 return cthBestMoveClamp(value, null);
 }
 }
 return null;
}

function cthBestMoveAverage(values) {
 const valid = values.filter((value) => Number.isFinite(Number(value)));
 if (!valid.length) return null;
 return cthBestMoveClamp(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length, null);
}

function cthBestMoveDayIndex(length) {
 if (!length) return 0;
 const now = new Date();
 const start = new Date(now.getFullYear(), 0, 0);
 const day = Math.floor((now - start) / 86400000);
 return day % length;
}

function buildDailyBestMove({ latestAudit, progress }) {
 const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};
 const overall = cthBestMoveClamp(
 latestAudit?.overall_score ??
 latestAudit?.overallScore ??
 latestAudit?.score ??
 scoreBag?.overall,
 null
 );

 const clarity = cthBestMoveAverage([
 cthBestMoveFirstScore(scoreBag, ["brand_foundation", "foundation"]),
 cthBestMoveFirstScore(scoreBag, ["visual_identity", "identity"]),
 ]);

 const structure = cthBestMoveAverage([
 cthBestMoveFirstScore(scoreBag, ["offer_suite", "offers"]),
 cthBestMoveFirstScore(scoreBag, ["systems_and_sops", "systems"]),
 ]);

 const execution = cthBestMoveAverage([
 cthBestMoveFirstScore(scoreBag, ["content_library", "content"]),
 cthBestMoveFirstScore(scoreBag, ["launch_readiness", "launch"]),
 ]);

 const candidates = [];

 if (!overall || overall <= 0) {
 candidates.push({
 key: "complete-diagnostic",
 priority: 100,
 label: "Today’s Best Move",
 title: "Complete your Brand Diagnostic",
 body: "The system needs a current score before it can recommend the most accurate next move.",
 cta: "Start diagnostic",
 route: "/brand-audit",
 });
 }

 if (Number.isFinite(clarity) && clarity < 75) {
 candidates.push({
 key: "strengthen-clarity",
 priority: 100 - clarity,
 label: "Today’s Best Move",
 title: "Strengthen your Brand Foundation",
 body: "Your clarity layer is asking for attention. Tighten the truth, audience, promise, and voice before adding more execution.",
 cta: "Open Brand Foundation",
 route: "/brand-foundation",
 });
 }

 if (Number.isFinite(structure) && structure < 75) {
 candidates.push({
 key: "review-structure",
 priority: 100 - structure,
 label: "Today’s Best Move",
 title: "Review your Offer and System Structure",
 body: "The brand has momentum, but the structure needs stronger rules. Clarify the path between offers, systems, and decisions.",
 cta: "Open Offer Builder",
 route: "/offer-builder",
 });
 }

 if (Number.isFinite(execution) && execution < 75) {
 const launchScore = cthBestMoveFirstScore(scoreBag, ["launch_readiness", "launch"]);
 candidates.push({
 key: "tighten-execution",
 priority: 100 - execution,
 label: "Today’s Best Move",
 title: launchScore !== null && launchScore < 70
 ? "Clarify your next campaign path"
 : "Build one aligned content pillar",
 body: launchScore !== null && launchScore < 70
 ? "Your launch readiness is the pressure point. Define the campaign direction before creating more disconnected content."
 : "Execution gets easier when content has a clear job. Choose one pillar and turn it into a focused content direction.",
 cta: launchScore !== null && launchScore < 70 ? "Open Campaign Builder" : "Open Content Studio",
 route: launchScore !== null && launchScore < 70 ? "/campaign-builder" : "/content-studio",
 });
 }

 if (progress && !progress.strategic_os_started) {
 candidates.push({
 key: "start-strategic-os",
 priority: 32,
 label: "Today’s Best Move",
 title: "Turn your strategy into an operating system",
 body: "Your brand needs a decision layer. Use Strategic OS to connect positioning, offers, content, and execution.",
 cta: "Open Strategic OS",
 route: "/strategic-os",
 });
 }

 if (progress && !progress.first_campaign_created) {
 candidates.push({
 key: "create-first-campaign",
 priority: 26,
 label: "Today’s Best Move",
 title: "Create your next aligned campaign",
 body: "A clear campaign turns brand truth into visible movement. Build one campaign that connects message, offer, and action.",
 cta: "Open Campaign Builder",
 route: "/campaign-builder",
 });
 }

 if (!candidates.length) {
 candidates.push({
 key: "optimize-conversion-path",
 priority: 20,
 label: "Today’s Best Move",
 title: "Optimize one conversion path",
 body: "Your foundation is strong enough to refine the path from attention to action. Choose one page, offer, or funnel to sharpen today.",
 cta: "Open Insights",
 route: "/analytics",
 });
 }

 const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
 const urgent = sorted.filter((item) => item.priority >= 35);
 const pool = urgent.length > 1 ? urgent.slice(0, 2) : sorted.slice(0, 1);

 return pool[cthBestMoveDayIndex(pool.length)] || sorted[0];
}

function BestMove({ navigate, bestMove }) {
 const move = bestMove || {
 label: "Today’s Best Move",
 title: "Complete your Brand Diagnostic",
 body: "The system needs a current score before it can recommend the most accurate next move.",
 cta: "Start diagnostic",
 route: "/brand-audit",
 };

 return (
 <aside className="cth-command-best-move">
 <div className="label">
 <Star size={16} fill="currentColor" />
 {move.label}
 </div>
 <h3>{move.title}</h3>
 <p>{move.body}</p>
 <button
 type="button"
 className="cth-command-gold-button"
 onClick={() => navigate(move.route || "/brand-audit")}
 >
 {move.cta || "Start this action"} →
 </button>
 </aside>
 );
}

function getPriorityScore(scoreBag, keys) {
 for (const key of keys) {
 const value = scoreBag?.[key];
 const numeric = Number(value);
 if (Number.isFinite(numeric)) {
 return Math.max(0, Math.min(100, Math.round(numeric)));
 }
 }
 return null;
}

function buildPriorityActions({ latestAudit, milestones }) {
 const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};
 const overall = getPriorityScore(scoreBag, ["overall"]) ??
 (Number.isFinite(Number(latestAudit?.overall_score)) ? Math.round(Number(latestAudit.overall_score)) : null);

 const actions = [];

 if (!overall || overall <= 0) {
 actions.push({
 key: "brand-audit",
 title: "Complete Brand Diagnostic",
 status: "Start here",
 route: "/brand-audit",
 urgency: 100,
 done: false,
 });
 }

 const scoreActions = [
 {
 key: "brand-foundation",
 title: "Strengthen Brand Foundation",
 score: getPriorityScore(scoreBag, ["brand_foundation", "foundation"]),
 route: "/brand-foundation",
 },
 {
 key: "visual-identity",
 title: "Review Identity Studio",
 score: getPriorityScore(scoreBag, ["visual_identity", "identity"]),
 route: "/identity-studio",
 },
 {
 key: "offer-suite",
 title: "Clarify Offer Architecture",
 score: getPriorityScore(scoreBag, ["offer_suite", "offers"]),
 route: "/offer-builder",
 },
 {
 key: "systems",
 title: "Build One Repeatable System",
 score: getPriorityScore(scoreBag, ["systems_and_sops", "systems"]),
 route: "/systems-builder",
 },
 {
 key: "content-library",
 title: "Create One Aligned Content Pillar",
 score: getPriorityScore(scoreBag, ["content_library", "content"]),
 route: "/content-studio",
 },
 {
 key: "launch-readiness",
 title: "Clarify Your Next Campaign Path",
 score: getPriorityScore(scoreBag, ["launch_readiness", "launch"]),
 route: "/campaign-builder",
 },
 ];

 scoreActions.forEach((item) => {
 if (!Number.isFinite(Number(item.score))) return;

 if (item.score < 70) {
 actions.push({
 ...item,
 status: `${item.score}/100`,
 urgency: 100 - item.score,
 done: false,
 });
 } else if (item.score < 85) {
 actions.push({
 ...item,
 status: `${item.score}/100`,
 urgency: 85 - item.score,
 done: false,
 });
 }
 });

 if (milestones && !milestones.strategic_os_started) {
 actions.push({
 key: "strategic-os",
 title: "Start Strategic OS",
 status: "Next layer",
 route: "/strategic-os",
 urgency: 34,
 done: false,
 });
 }

 if (milestones && !milestones.first_campaign_created) {
 actions.push({
 key: "first-campaign",
 title: "Create First Campaign",
 status: "Growth move",
 route: "/campaign-builder",
 urgency: 28,
 done: false,
 });
 }

 if (!actions.length) {
 actions.push(
 {
 key: "optimize-path",
 title: "Optimize One Conversion Path",
 status: "Ready",
 route: "/analytics",
 urgency: 20,
 done: false,
 },
 {
 key: "review-library",
 title: "Review Workspace Library",
 status: "Maintain",
 route: "/workspace-library",
 urgency: 12,
 done: false,
 }
 );
 }

 return actions
 .sort((a, b) => b.urgency - a.urgency)
 .slice(0, 5);
}

function PriorityActions({ milestones, latestAudit, navigate }) {
 const actions = useMemo(
 () => buildPriorityActions({ latestAudit, milestones }),
 [latestAudit, milestones]
 );

 return (
 <section className="cth-command-panel">
 <div className="cth-command-panel-title">
 <FileText size={22} color="#9f1731" />
 Priority Actions
 </div>

 <div className="cth-command-list">
 {actions.map((action, index) => {
 const done = Boolean(action.done);
 const status = action.status || (index === 0 ? "Priority" : "Next");

 return (
 <button
 key={action.key}
 type="button"
 className="cth-command-check-row"
 onClick={() => navigate(action.route || "/command-center")}
 style={{
 width: "100%",
 textAlign: "left",
 background: "transparent",
 border: 0,
 padding: 0,
 cursor: "pointer",
 }}
 >
 <div className={`cth-command-check ${done ? "done" : ""}`}>
 {done ? <Check size={14} /> : index + 1}
 </div>
 <div>{action.title}</div>
 <div className={`cth-command-check-status ${done ? "done" : ""}`}>{status}</div>
 </button>
 );
 })}
 </div>

 <button className="cth-command-link" type="button" onClick={() => navigate("/brand-audit")}>
 View audit actions <ArrowUpRight size={15} />
 </button>
 </section>
 );
}

function getRhythmScore(scoreBag, keys) {
 for (const key of keys) {
 const numeric = Number(scoreBag?.[key]);
 if (Number.isFinite(numeric)) {
 return Math.max(0, Math.min(100, Math.round(numeric)));
 }
 }
 return null;
}

function buildOperatingRhythm({ latestAudit, progress, bestMove }) {
 const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};
 const overall = getRhythmScore(scoreBag, ["overall"]) ??
 (Number.isFinite(Number(latestAudit?.overall_score)) ? Math.round(Number(latestAudit.overall_score)) : null);

 const offerScore = getRhythmScore(scoreBag, ["offer_suite", "offers"]);
 const systemsScore = getRhythmScore(scoreBag, ["systems_and_sops", "systems"]);
 const contentScore = getRhythmScore(scoreBag, ["content_library", "content"]);
 const launchScore = getRhythmScore(scoreBag, ["launch_readiness", "launch"]);
 const foundationScore = getRhythmScore(scoreBag, ["brand_foundation", "foundation"]);

 let weekly = "Review metrics and brand movement";
 if (Number.isFinite(contentScore) && contentScore < 70) {
 weekly = "Build one aligned content pillar";
 } else if (Number.isFinite(systemsScore) && systemsScore < 70) {
 weekly = "Strengthen one repeatable workflow";
 } else if (Number.isFinite(offerScore) && offerScore < 70) {
 weekly = "Clarify one offer pathway";
 } else if (Number.isFinite(launchScore) && launchScore < 70) {
 weekly = "Shape the next campaign path";
 }

 let monthly = "Deep strategy, offers, and content";
 if (progress && !progress.strategic_os_started) {
 monthly = "Finish the Strategic OS layer";
 } else if (progress && !progress.first_campaign_created) {
 monthly = "Build the next aligned campaign";
 } else if (Number.isFinite(launchScore) && launchScore < 75) {
 monthly = "Plan the next launch direction";
 } else if (Number.isFinite(offerScore) && offerScore < 75) {
 monthly = "Review offer architecture";
 }

 let quarterly = "Evaluate, elevate, and expand";
 if (Number.isFinite(overall) && overall < 70) {
 quarterly = "Review the brand foundation before scaling";
 } else if (Number.isFinite(overall) && overall < 85) {
 quarterly = "Optimize one conversion path";
 } else if (Number.isFinite(foundationScore) && foundationScore >= 85) {
 quarterly = "Scale the strongest operating system";
 }

 return [
 ["D", "Daily", bestMove?.title || "Focus on one high-impact action", "#8a0924"],
 ["W", "Weekly", weekly, "#33033c"],
 ["M", "Monthly", monthly, "#b93222"],
 ["Q", "Quarterly", quarterly, "#c4a95b"],
 ];
}

function OperatingRhythm({ latestAudit, progress, bestMove, navigate }) {
 const rows = useMemo(
 () => buildOperatingRhythm({ latestAudit, progress, bestMove }),
 [latestAudit, progress, bestMove]
 );

 return (
 <section className="cth-command-panel">
 <div className="cth-command-panel-title">
 <CalendarDays size={22} color="#9f1731" />
 Operating Rhythm
 </div>
 <div className="cth-command-list">
 {rows.map(([letter, label, body, color]) => (
 <div className="cth-command-rhythm-row" key={label}>
 <div className="cth-command-letter" style={{ background: color }}>{letter}</div>
 <div>
 <div className="cth-command-row-label">{label}</div>
 <div className="cth-command-row-body">{body}</div>
 </div>
 </div>
 ))}
 </div>
 <button className="cth-command-link" type="button" onClick={() => navigate("/calendar")}>
 View full rhythm <ArrowUpRight size={15} />
 </button>
 </section>
 );
}

function BrandMemory({ navigate }) {
 const rows = [
 ["Brand Line", "Uncover the truth. Build the brand.", BookOpen],
 ["Belief", "The strongest brands are uncovered, not invented.", Star],
 ["Core Promise", "We help founders uncover what is true and build from there.", CheckCircle2],
 ["Positioning", "A brand operating system for serious founders ready to move beyond scattered tools.", Target],
 ];

 return (
 <section className="cth-command-panel">
 <div className="cth-command-panel-title">
 <BookOpen size={22} color="#9f1731" />
 Brand Memory
 </div>
 <div className="cth-command-list">
 {rows.map(([label, body, Icon]) => (
 <div className="cth-command-memory-row" key={label}>
 <div className="cth-command-memory-icon">
 <Icon size={23} />
 </div>
 <div>
 <div className="cth-command-row-label" style={{ color: "#2b1040" }}>{label}</div>
 <div className="cth-command-row-body" style={{ color: "#4d3852" }}>{body}</div>
 </div>
 </div>
 ))}
 </div>
 <button
 className="cth-command-link"
 type="button"
 onClick={() => navigate("/brand-foundation")}
 >
 View brand foundation <ArrowUpRight size={15} />
 </button>
 </section>
 );
}


function getCommandMetricScore(metrics, title, fallback = 0) {
 const match = metrics?.find((item) => item.title === title);
 const numeric = Number(match?.score);
 return Number.isFinite(numeric) ? numeric : fallback;
}

function KpiStrip({ overallScore, workspaceStats, progress, healthMetrics }) {
 const activeProjects =
 Number(workspaceStats?.active_projects) ||
 Number(workspaceStats?.activeProjects) ||
 Number(workspaceStats?.campaigns) ||
 Number(workspaceStats?.campaign_count) ||
 0;

 const tasksCompleted = [
 progress?.audit_complete,
 progress?.brand_memory_complete,
 progress?.foundation_complete,
 progress?.strategic_os_started,
 progress?.first_campaign_created,
 ].filter(Boolean).length;

 const executionScore = getCommandMetricScore(healthMetrics, "Execution", 71);
 const optimizationScore = getCommandMetricScore(healthMetrics, "Optimization", overallScore || 78);
 const momentumScore = Math.round((executionScore + optimizationScore) / 2);

 const cards = [
 { label: "Active Projects", value: activeProjects, suffix: "", sub: activeProjects > 0 ? "On Track" : "Ready to Start", Icon: FileText },
 { label: "Tasks Completed", value: tasksCompleted, suffix: "", sub: "Workspace Progress", Icon: CheckCircle2 },
 { label: "Momentum Score", value: momentumScore, suffix: "", sub: momentumScore >= 80 ? "High" : momentumScore >= 65 ? "Building" : "Needs Push", Icon: Star },
 ];

 return (
 <div className="cth-command-kpi-strip">
 {cards.map(({ label, value, suffix, sub, Icon }) => (
 <article className="cth-command-kpi-card" key={label}>
 <div className="cth-command-kpi-icon"><Icon size={25} /></div>
 <div>
 <div className="cth-command-kpi-label">{label}</div>
 <div className="cth-command-kpi-value">{value}<span style={{ fontSize: 18 }}>{suffix}</span></div>
 <div className="cth-command-kpi-sub">{sub}</div>
 </div>
 </article>
 ))}
 </div>
 );
}

function TodayFocusPanel({ priorityActions, navigate }) {
 const focusItems = priorityActions.slice(0, 4);

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><Target size={22} color="#9f1731" />Today’s Focus</div>
 <div className="cth-command-mini-list">
 {focusItems.map((item, index) => (
 <button
 key={item.key || item.title}
 className="cth-command-mini-row"
 type="button"
 onClick={() => navigate(item.route || "/brand-audit")}
 style={{ background: "transparent", borderLeft: 0, borderRight: 0, borderTop: 0, cursor: "pointer", textAlign: "left" }}
 >
 <div className="cth-command-mini-number">{index + 1}</div>
 <div>{item.title}</div>
 <ArrowUpRight size={15} />
 </button>
 ))}
 </div>
 </section>
 );
}

function RecentActivityPanel({ latestAudit, progress }) {
 const activity = [
 { label: latestAudit ? "Brand Audit score refreshed" : "Brand Audit waiting for completion", time: "Now", Icon: ShieldCheck },
 { label: progress?.foundation_complete ? "Brand Foundation updated" : "Brand Foundation needs review", time: progress?.foundation_complete ? "Active" : "Next", Icon: BookOpen },
 { label: progress?.strategic_os_started ? "Strategic OS in motion" : "Strategic OS not started", time: progress?.strategic_os_started ? "Active" : "Pending", Icon: Layers3 },
 { label: progress?.first_campaign_created ? "Campaign Builder activated" : "Campaign path ready to define", time: progress?.first_campaign_created ? "Active" : "Pending", Icon: Megaphone },
 ];

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><TrendingUp size={22} color="#9f1731" />Recent Activity</div>
 <div className="cth-command-mini-list">
 {activity.map(({ label, time, Icon }) => (
 <div className="cth-command-mini-row" key={label}>
 <Icon size={18} color="#9f1731" />
 <div>{label}</div>
 <div className="cth-command-mini-time">{time}</div>
 </div>
 ))}
 </div>
 </section>
 );
}


function firstNumber(...values) {
 for (const value of values) {
 const numeric = Number(value);
 if (Number.isFinite(numeric)) return numeric;
 }
 return null;
}

function clampPercent(value, fallback = 0) {
 const numeric = Number(value);
 if (!Number.isFinite(numeric)) return fallback;
 return Math.max(0, Math.min(100, Math.round(numeric)));
}

function scoreFromCompletion(done, total) {
 const safeTotal = Number(total);
 if (!Number.isFinite(safeTotal) || safeTotal <= 0) return null;
 return clampPercent((Number(done || 0) / safeTotal) * 100, 0);
}

function buildRealInsightsOverview({ latestAudit, progress, workspaceStats, healthMetrics }) {
 const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};

 const clarityScore = firstNumber(
 scoreBag?.brand_foundation,
 scoreBag?.foundation,
 getCommandMetricScore(healthMetrics, "Clarity", null)
 );

 const executionScore = firstNumber(
 scoreBag?.content_library,
 scoreBag?.content,
 scoreBag?.launch_readiness,
 scoreBag?.launch,
 getCommandMetricScore(healthMetrics, "Execution", null)
 );

 const optimizationScore = firstNumber(
 getCommandMetricScore(healthMetrics, "Optimization", null),
 latestAudit?.overall_score,
 scoreBag?.overall
 );

 const contentOutputCount = firstNumber(
 workspaceStats?.content_generated,
 workspaceStats?.contentGenerated,
 workspaceStats?.content_count,
 workspaceStats?.contents_count,
 workspaceStats?.documents_count,
 workspaceStats?.document_count,
 workspaceStats?.outputs_count
 );

 const campaignsActive = firstNumber(
 workspaceStats?.active_campaigns,
 workspaceStats?.activeCampaigns,
 workspaceStats?.campaigns_active,
 workspaceStats?.campaign_count,
 workspaceStats?.campaigns
 );

 const socialPlannerActivity = firstNumber(
 workspaceStats?.social_posts,
 workspaceStats?.socialPosts,
 workspaceStats?.scheduled_posts,
 workspaceStats?.scheduledPosts,
 workspaceStats?.planner_items,
 workspaceStats?.plannerItems
 );

 const seoTraffic = firstNumber(
 workspaceStats?.seo_traffic,
 workspaceStats?.seoTraffic,
 workspaceStats?.website_visits,
 workspaceStats?.websiteVisits,
 workspaceStats?.traffic,
 workspaceStats?.visits
 );

 const postEngagement = firstNumber(
 workspaceStats?.post_engagement_rate,
 workspaceStats?.postEngagementRate,
 workspaceStats?.engagement_rate,
 workspaceStats?.engagementRate
 );

 const emailClicks = firstNumber(
 workspaceStats?.email_click_rate,
 workspaceStats?.emailClickRate,
 workspaceStats?.email_clicks,
 workspaceStats?.emailClicks
 );

 const crmMovement = firstNumber(
 workspaceStats?.crm_activity,
 workspaceStats?.crmActivity,
 workspaceStats?.crm_count,
 workspaceStats?.contacts_count,
 workspaceStats?.contact_count,
 workspaceStats?.leads_count,
 workspaceStats?.lead_count
 );

 const audienceFieldsDone = [
 latestAudit?.intake_answers?.audience,
 latestAudit?.intake_answers?.ideal_customer,
 latestAudit?.intake_answers?.customer,
 latestAudit?.answers?.audience,
 latestAudit?.answers?.ideal_customer,
 progress?.audience_complete,
 progress?.brand_foundation_complete,
 progress?.foundation_complete,
 ].filter(Boolean).length;

 const offerMessageSignals = [
 scoreBag?.offer_suite,
 scoreBag?.offers,
 workspaceStats?.offer_count,
 workspaceStats?.offers_count,
 progress?.first_campaign_created,
 ].filter((value) => value !== undefined && value !== null && value !== false).length;

 const campaignAudienceSignals = [
 campaignsActive,
 socialPlannerActivity,
 progress?.first_campaign_created,
 ].filter((value) => Number(value) > 0 || value === true).length;

 const visibilitySignals = [
 contentOutputCount !== null ? Math.min(35, contentOutputCount * 5) : null,
 campaignsActive !== null ? Math.min(30, campaignsActive * 15) : null,
 socialPlannerActivity !== null ? Math.min(20, socialPlannerActivity * 3) : null,
 seoTraffic !== null ? Math.min(15, seoTraffic > 0 ? 15 : 0) : null,
 executionScore !== null ? Math.round(executionScore * 0.35) : null,
 ].filter((value) => Number.isFinite(Number(value)));

 const visibilityScore = visibilitySignals.length
 ? clampPercent(visibilitySignals.reduce((sum, value) => sum + Number(value), 0))
 : clampPercent(executionScore, 0);

 const engagementSignals = [
 postEngagement !== null ? postEngagement : null,
 emailClicks !== null ? Math.min(100, emailClicks) : null,
 crmMovement !== null ? Math.min(100, crmMovement * 10) : null,
 campaignsActive !== null ? Math.min(100, campaignsActive * 20) : null,
 optimizationScore !== null ? optimizationScore : null,
 ].filter((value) => Number.isFinite(Number(value)));

 const engagementScore = engagementSignals.length
 ? clampPercent(engagementSignals.reduce((sum, value) => sum + Number(value), 0) / engagementSignals.length)
 : clampPercent(optimizationScore, 0);

 const alignmentSignals = [
 clarityScore,
 scoreFromCompletion(audienceFieldsDone, 4),
 scoreFromCompletion(offerMessageSignals, 4),
 scoreFromCompletion(campaignAudienceSignals, 3),
 ].filter((value) => Number.isFinite(Number(value)));

 const alignmentScore = alignmentSignals.length
 ? clampPercent(alignmentSignals.reduce((sum, value) => sum + Number(value), 0) / alignmentSignals.length)
 : clampPercent(clarityScore, 0);

 return [
 {
 label: "Brand Visibility",
 value: `${visibilityScore}%`,
 sub: contentOutputCount || campaignsActive || socialPlannerActivity || seoTraffic
 ? "content, campaigns, planner, traffic"
 : "audit-derived until activity connects",
 score: visibilityScore,
 },
 {
 label: "Engagement Quality",
 value: `${engagementScore}%`,
 sub: postEngagement || emailClicks || crmMovement
 ? "engagement, clicks, CRM movement"
 : "optimization-derived until channels connect",
 score: engagementScore,
 },
 {
 label: "Audience Alignment",
 value: `${alignmentScore}%`,
 sub: "clarity, audience, offer-message fit",
 score: alignmentScore,
 },
 ];
}

function InsightsOverviewPanel({ insights }) {
 const items = Array.isArray(insights) && insights.length
 ? insights
 : [
 { label: "Brand Visibility", value: "0%", sub: "waiting on workspace activity" },
 { label: "Engagement Quality", value: "0%", sub: "waiting on channel activity" },
 { label: "Audience Alignment", value: "0%", sub: "waiting on brand audit" },
 ];

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><BarChart3 size={22} color="#9f1731" />Insights Overview</div>
 <div className="cth-command-insight-grid">
 {items.map(({ label, value, sub }) => (
 <div className="cth-command-insight-cell" key={label}>
 <div className="cth-command-insight-label">{label}</div>
 <div className="cth-command-insight-value">{value}</div>
 <div className="cth-command-insight-sub">{sub}</div>
 </div>
 ))}
 </div>
 </section>
 );
}


function StrategyRoadmapPanel({ healthMetrics }) {
 const rows = [
 ["Brand Positioning", getCommandMetricScore(healthMetrics, "Clarity", 82), Target],
 ["Offer Architecture", getCommandMetricScore(healthMetrics, "Structure", 74), FileText],
 ["Content Ecosystem", getCommandMetricScore(healthMetrics, "Execution", 71), PenTool],
 ["Launch Authority", Math.round((getCommandMetricScore(healthMetrics, "Execution", 71) + getCommandMetricScore(healthMetrics, "Optimization", 76)) / 2), Megaphone],
 ["Measure & Optimize", getCommandMetricScore(healthMetrics, "Optimization", 76), BarChart3],
 ];

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><Compass size={22} color="#9f1731" />Strategy Roadmap</div>
 <div className="cth-command-roadmap">
 {rows.map(([label, score, Icon]) => (
 <div className="cth-command-roadmap-stage" key={label}>
 <div className="cth-command-roadmap-label"><Icon size={16} color="#9f1731" />{label}</div>
 <div className="cth-command-roadmap-track" title={`${score}/100`}>
 <div className="cth-command-roadmap-fill" style={{ width: `${Math.max(8, Math.min(100, score))}%` }} />
 </div>
 </div>
 ))}
 </div>
 </section>
 );
}

function WorkspaceSnapshotPanel({ navigate }) {
 const items = [
 ["Command Center", "/command-center", ShieldCheck, true],
 ["Foundation", "/brand-foundation", BookOpen],
 ["Structure", "/systems-builder", Layers3],
 ["Execution", "/content-studio", PenTool],
 ["Insights", "/brand-audit", BarChart3],
 ["Library", "/workspace-library", FileText],
 ["Help", "/tutorials", Compass],
 ];

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><Grid2X2 size={22} color="#9f1731" />Workspace Snapshot</div>
 <div className="cth-command-snapshot-grid">
 {items.map(([label, route, Icon, active]) => (
 <button key={label} type="button" className={`cth-command-snapshot-button ${active ? "active" : ""}`} onClick={() => navigate(route)}>
 <Icon size={22} />
 <span>{label}</span>
 </button>
 ))}
 </div>
 </section>
 );
}

function UpcomingMilestonesPanel({ navigate }) {
 const now = new Date();
 const makeDate = (days) => {
 const date = new Date(now);
 date.setDate(now.getDate() + days);
 return date;
 };

 const milestones = [
 ["Positioning Statement Final", makeDate(3)],
 ["Offer Framework Approval", makeDate(7)],
 ["Content Ecosystem Launch", makeDate(14)],
 ];

 return (
 <section className="cth-command-extra-panel">
 <div className="cth-command-extra-title"><CalendarDays size={22} color="#9f1731" />Upcoming Milestones</div>
 <div className="cth-command-mini-list">
 {milestones.map(([label, date]) => (
 <div className="cth-command-mini-row" key={label}>
 <div className="cth-command-date-badge">
 <span>{date.toLocaleDateString(undefined, { month: "short" })}</span>
 <span>{date.getDate()}</span>
 </div>
 <div>{label}</div>
 <div className="cth-command-mini-time">{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
 </div>
 ))}
 </div>
 <button className="cth-command-link" type="button" onClick={() => navigate("/calendar")}>
 View full calendar <ArrowUpRight size={15} />
 </button>
 </section>
 );
}

function FounderNotesPanel({ bestMove }) {
 return (
 <section className="cth-command-founder-note">
 <div className="cth-command-founder-seal"><PenTool size={32} /></div>
 <div>
 <h3>Founder Notes</h3>
 <p>
 Clarity compounds. Today’s strongest move is <strong>{bestMove?.title || "one focused brand decision"}</strong>.
 Stay focused on one strategic win at a time.
 </p>
 </div>
 <div className="cth-command-founder-quote">“</div>
 </section>
 );
}

function BrandOSPipeline({ progress, workspaceStats, latestAudit, navigate }) {
 void latestAudit;
 const safeProgress = progress || {};
 const safeStats = workspaceStats || {};

 const stages = [
   {
     id: "brand_core",
     number: 1,
     label: "Brand Core",
     icon: ShieldCheck,
     requiredPlan: "foundation",
     modules: [
       {
         id: "brand_foundation",
         label: "Brand Foundation",
         route: "/brand-foundation",
         isComplete: () => Boolean(safeProgress.foundation_complete),
       },
       {
         id: "brand_positioning",
         label: "Brand Positioning",
         route: "/brand-positioning",
         isComplete: () =>
           Boolean(safeStats.has_positioning || safeProgress.positioning_complete),
       },
       {
         id: "messaging_structure",
         label: "Messaging Structure",
         route: "/messaging-structure",
         isComplete: () =>
           Boolean(safeStats.has_messaging || safeProgress.messaging_complete),
       },
       {
         id: "audience",
         label: "Audience",
         route: "/audience",
         isComplete: () =>
           Boolean(Number(safeStats.total_avatars) > 0 || safeProgress.audience_complete),
       },
       {
         id: "identity_studio",
         label: "Identity Studio",
         route: "/identity-studio",
         isComplete: () =>
           Boolean(safeStats.has_identity || safeProgress.identity_complete),
       },
     ],
   },
   {
     id: "strategy",
     number: 2,
     label: "Strategy",
     icon: Compass,
     requiredPlan: "foundation",
     modules: [
       {
         id: "strategic_os",
         label: "Strategic OS",
         route: "/strategic-os",
         isComplete: () => Boolean(safeProgress.strategic_os_started),
       },
       {
         id: "customer_journey",
         label: "Customer Journey",
         route: "/customer-journey",
         isComplete: () =>
           Boolean(safeStats.has_customer_journey || safeProgress.customer_journey_complete),
       },
     ],
   },
   {
     id: "systems",
     number: 3,
     label: "Systems",
     icon: Layers3,
     requiredPlan: "structure",
     modules: [
       {
         id: "campaign_builder",
         label: "Campaign Builder",
         route: "/campaign-builder",
         isComplete: () =>
           Boolean(Number(safeStats.total_campaigns) > 0 || safeProgress.first_campaign_created),
       },
       {
         id: "offer_builder",
         label: "Offer Builder",
         route: "/offer-builder",
         isComplete: () => Boolean(Number(safeStats.total_offers) > 0),
       },
       {
         id: "systems_builder",
         label: "Systems Builder",
         route: "/systems-builder",
         isComplete: () =>
           Boolean(Number(safeStats.total_systems) > 0 || safeProgress.systems_complete),
       },
     ],
   },
   {
     id: "content",
     number: 4,
     label: "Content",
     icon: PenTool,
     requiredPlan: "structure",
     modules: [
       {
         id: "content_studio",
         label: "Content Studio",
         route: "/content-studio",
         isComplete: () => Boolean(Number(safeStats.total_content) > 0),
       },
       {
         id: "prompt_generator",
         label: "Prompt Generator",
         route: "/prompt-generator",
         isComplete: () =>
           Boolean(safeStats.has_prompts || safeProgress.prompt_generator_used),
       },
       {
         id: "media_studio",
         label: "Media Studio",
         route: "/media-studio",
         isComplete: () => Boolean(Number(safeStats.total_media) > 0),
       },
     ],
   },
   {
     id: "launch",
     number: 5,
     label: "Launch",
     icon: Megaphone,
     requiredPlan: "house",
     modules: [
       {
         id: "social_planner",
         label: "Social Planner",
         route: "/social-media-manager",
         isComplete: () =>
           Boolean(safeStats.has_social_planner || safeProgress.social_planner_used),
       },
       {
         id: "crm",
         label: "CRM",
         route: "/crm",
         isComplete: () => Boolean(Number(safeStats.total_crm_contacts) > 0),
       },
       {
         id: "analytics",
         label: "Analytics",
         route: "/analytics",
         isComplete: () =>
           Boolean(safeProgress.analytics_viewed || safeStats.analytics_active),
       },
     ],
   },
 ];

 const enriched = stages.map((stage) => {
   const moduleStatuses = stage.modules.map((mod) => ({
     ...mod,
     complete: Boolean(mod.isComplete(safeProgress, safeStats, latestAudit)),
   }));
   const completedCount = moduleStatuses.filter((mod) => mod.complete).length;
   const totalCount = moduleStatuses.length;
   const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
   let stageStatus = "not_started";
   if (pct === 100) stageStatus = "complete";
   else if (pct > 0) stageStatus = "active";

   let primaryRoute;
   if (stage.id === "strategy") {
     primaryRoute = !safeProgress.strategic_os_started ? "/strategic-os" : "/customer-journey";
   } else {
     const firstIncomplete = moduleStatuses.find((mod) => !mod.complete);
     if (firstIncomplete) {
       primaryRoute = firstIncomplete.route;
     } else if (stage.id === "brand_core") {
       primaryRoute = "/strategic-os";
     } else {
       primaryRoute = stage.modules[stage.modules.length - 1].route;
     }
   }

   return {
     ...stage,
     moduleStatuses,
     completedCount,
     totalCount,
     pct,
     stageStatus,
     primaryRoute,
   };
 });

 const COLOR_COMPLETE = "#c4a95b";
 const COLOR_ACTIVE = "#af0024";
 const COLOR_MUTED = "var(--cc-muted)";

 const cardStyle = {
   background: "var(--cc-panel)",
   border: "1px solid var(--cc-border)",
   borderRadius: 4,
   padding: 16,
   display: "flex",
   flexDirection: "column",
   gap: 12,
   minWidth: 180,
 };

 return (
   <div>
     <div
       style={{
         fontSize: 10,
         fontWeight: 700,
         letterSpacing: "0.18em",
         textTransform: "uppercase",
         color: "var(--cc-muted)",
         marginBottom: 12,
       }}
     >
       Brand OS Pipeline
     </div>

     <div
       style={{
         display: "grid",
         gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
         gap: 12,
         overflowX: "auto",
       }}
     >
       {enriched.map((stage) => {
         const Icon = stage.icon;
         let iconColor = COLOR_MUTED;
         let barColor = "transparent";
         if (stage.stageStatus === "complete") {
           iconColor = COLOR_COMPLETE;
           barColor = COLOR_COMPLETE;
         } else if (stage.stageStatus === "active") {
           iconColor = COLOR_ACTIVE;
           barColor = COLOR_ACTIVE;
         }

         return (
           <div key={stage.id} style={cardStyle}>
             <div
               style={{
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "space-between",
                 gap: 8,
               }}
             >
               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                 <Icon size={16} color={iconColor} />
                 <span
                   style={{
                     fontSize: 11,
                     fontWeight: 700,
                     letterSpacing: "0.16em",
                     textTransform: "uppercase",
                     color: "var(--cc-muted)",
                   }}
                 >
                   {stage.label}
                 </span>
               </div>
               <span
                 style={{
                   fontSize: 10,
                   fontWeight: 700,
                   color: "var(--cc-muted)",
                 }}
               >
                 0{stage.number}
               </span>
             </div>

             <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
               {stage.moduleStatuses.map((mod) => {
                 const dotBg = mod.complete ? COLOR_COMPLETE : "transparent";
                 const dotBorder = mod.complete ? COLOR_COMPLETE : "var(--cc-border)";
                 return (
                   <span
                     key={mod.id}
                     title={mod.label}
                     aria-label={`${mod.label}: ${mod.complete ? "complete" : "not complete"}`}
                     style={{
                       width: 8,
                       height: 8,
                       borderRadius: 999,
                       background: dotBg,
                       border: `1px solid ${dotBorder}`,
                       display: "inline-block",
                     }}
                   />
                 );
               })}
             </div>

             <div
               style={{
                 height: 2,
                 width: "100%",
                 background: "var(--cc-border)",
                 borderRadius: 2,
                 overflow: "hidden",
               }}
             >
               <div
                 style={{
                   height: "100%",
                   width: `${stage.pct}%`,
                   background: barColor,
                   transition: "width 240ms ease",
                 }}
               />
             </div>

             <div style={{ fontSize: 11, color: "var(--cc-muted)" }}>
               {stage.completedCount}/{stage.totalCount} complete
             </div>

             {stage.stageStatus !== "complete" ? (
               <button
                 type="button"
                 onClick={() => navigate(stage.primaryRoute)}
                 style={{
                   alignSelf: "flex-start",
                   fontSize: 11,
                   background: "var(--cc-purple)",
                   color: "var(--cc-gold)",
                   border: "none",
                   borderRadius: 3,
                   padding: "6px 10px",
                   cursor: "pointer",
                   fontWeight: 600,
                   letterSpacing: "0.04em",
                 }}
               >
                 {stage.stageStatus === "active" ? "Continue →" : "Start →"}
               </button>
             ) : null}
           </div>
         );
       })}
     </div>
   </div>
 );
}

export default function CommandCenter() {
 const navigate = useNavigate();
 const { user } = useUser();
 const { activeWorkspaceId, activeWorkspace } = useWorkspace();

 const [loading, setLoading] = useState(true);
 const [progress, setProgress] = useState({});
 const [latestAudit, setLatestAudit] = useState(null);
 const [workspaceStats, setWorkspaceStats] = useState(null);
 const [error, setError] = useState("");

 const displayName = useMemo(() => {
 return user?.fullName || user?.firstName || user?.name || activeWorkspace?.name || "there";
 }, [activeWorkspace?.name, user?.fullName, user?.firstName, user?.name]);

 const loadCommandCenter = useCallback(async () => {
 if (!activeWorkspaceId) {
 setLoading(false);
 setError("");
 return;
 }

 setLoading(true);
 setError("");

 const results = await Promise.allSettled([
 apiClient.get(API_PATHS.onboarding.progress, {
 params: {
 user_id: user?.id,
 workspace_id: activeWorkspaceId,
 },
 }),
 apiClient.get(API_PATHS.audit.latest, {
 params: {
 workspace_id: activeWorkspaceId,
 user_id: user?.id,
 _t: Date.now(),
 },
 }),
 apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
 ]);

 const [progressResult, auditResult, statsResult] = results;

 if (progressResult.status === "fulfilled") {
 setProgress(progressResult.value || {});
 }

 if (auditResult.status === "fulfilled") {
 const auditPayload =
 auditResult.value?.audit ||
 auditResult.value?.data?.audit ||
 auditResult.value ||
 null;
 setLatestAudit(auditPayload);
 }

 if (statsResult.status === "fulfilled") {
 setWorkspaceStats(statsResult.value || null);
 }

 const failedAll = results.every((item) => item.status === "rejected");
 if (failedAll) {
 setError("Some workspace data could not load, but the Command Center is still available.");
 }

 setLoading(false);
 }, [activeWorkspaceId, user?.id]);

 useEffect(() => {
 loadCommandCenter();
 }, [loadCommandCenter]);

 const overallScore = latestAudit?.overall_score ?? latestAudit?.scores?.overall ?? 78;
 const rating = latestAudit?.brand_health_rating || latestAudit?.rating || "Strong Foundation";
 const bestMove = useMemo(
 () => buildDailyBestMove({ latestAudit, progress }),
 [latestAudit, progress]
 );
 const healthMetrics = useMemo(() => buildHealthMetricsFromAudit(latestAudit), [latestAudit]);
 const realInsights = useMemo(
 () => buildRealInsightsOverview({ latestAudit, progress, workspaceStats, healthMetrics }),
 [latestAudit, progress, workspaceStats, healthMetrics]
 );
 const priorityActions = useMemo(
 () => buildPriorityActions({ latestAudit, milestones: progress }),
 [latestAudit, progress]
 );

 return (
 <DashboardLayout>
 <style>{COMMAND_CENTER_CSS}{COMMAND_CENTER_EXTENSION_CSS}</style>

 <main className="cth-command-page">
 <div className="cth-command-shell">
 <header className="cth-command-topbar">
 <h1>Command Center</h1>
 <div className="cth-command-date">
 <CalendarDays size={20} />
 <span>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
 </div>
 </header>

 {error ? (
 <div className="cth-command-error">
 <AlertCircle size={16} />
 <span>{error}</span>
 </div>
 ) : null}

 {loading ? (
 <div className="flex min-h-[420px] items-center justify-center">
 <Loader2 className="animate-spin" size={28} color="#af002a" />
 </div>
 ) : (
 <>
 <section className="cth-command-hero">
 <div className="cth-command-hero-inner">
 <div className="cth-command-hero-copy">
 <div className="cth-command-pill">
 <ShieldCheck size={14} />
 Strategy. Clarity. Execution. Growth.
 </div>
 <h2>Welcome to Your Command Center</h2>
 <p>
 Everything you need to lead your brand with truth, build with intention, and scale with structure.
 </p>
 </div>
 </div>
 </section>

 <section className="cth-command-main">
 <KpiStrip
 overallScore={overallScore}
 workspaceStats={workspaceStats}
 progress={progress}
 healthMetrics={healthMetrics}
 />
 <div style={{ padding: "0 clamp(16px, 4vw, 48px)", marginBottom: 22 }}>
 <BrandOSPipeline
 progress={progress}
 workspaceStats={workspaceStats}
 latestAudit={latestAudit}
 navigate={navigate}
 />
 </div>
 <div className="cth-command-grid">
 <div className="cth-command-score-row">
 <ScorePanel score={overallScore} rating={rating} />
 {healthMetrics.map((metric) => (
 <MetricTile key={metric.title} metric={metric} />
 ))}
 </div>

 </div>

 <div className="cth-command-extra-grid">
 <TodayFocusPanel priorityActions={priorityActions} navigate={navigate} />
 <RecentActivityPanel latestAudit={latestAudit} progress={progress} />
 <BestMove navigate={navigate} bestMove={bestMove} />
 </div>

 <div className="cth-command-wide-grid">
 <StrategyRoadmapPanel healthMetrics={healthMetrics} />
 <OperatingRhythm
 latestAudit={latestAudit}
 progress={progress}
 bestMove={bestMove}
 navigate={navigate}
 />
 <UpcomingMilestonesPanel navigate={navigate} />
 </div>

 <div className="cth-command-extra-grid" style={{ gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)" }}>
 <InsightsOverviewPanel insights={realInsights} />
 <WorkspaceSnapshotPanel navigate={navigate} />
 </div>

 </section>

 <div className="cth-command-quote">
 “The strongest brands are uncovered, not invented.”
 </div>
 </>
 )}
 </div>
 </main>
 </DashboardLayout>
 );
}
