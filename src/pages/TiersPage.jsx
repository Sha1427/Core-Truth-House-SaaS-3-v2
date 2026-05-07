import React, { useEffect } from "react";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import "./TiersPage.css";

const tiers = [
  {
    name: "Foundation",
    price: "$47",
    period: "/month",
    label: "Start with clarity",
    icon: "/tiers-assets/cth-tier-card-foundation-column.png",
    description:
      "For founders who need brand truth, market positioning, audience clarity, and identity in place before they promote anything.",
    features: [
      "Brand Foundation Builder",
      "Brand Positioning Module",
      "Audience Clarity Tool",
      "Identity Studio",
      "Strategic OS — Foundation Steps",
      "Content Studio (5 generations/month)",
    ],
    cta: "Choose Foundation",
  },
  {
    name: "Structure",
    price: "$97",
    period: "/month",
    label: "Most Chosen",
    icon: "/tiers-assets/cth-tier-card-structure-building.png",
    description:
      "For founders ready to turn clarity into campaigns, offers, systems, and a full strategic OS.",
    features: [
      "Everything in Foundation",
      "Strategic OS — Full Access (all 9 steps)",
      "Campaign Builder",
      "Offer Builder",
      "Systems Builder",
      "Content Studio (20 generations/month)",
      "Saved Brand Memory",
    ],
    cta: "Choose Structure",
    featured: true,
  },
  {
    name: "House",
    price: "$197",
    period: "/month",
    label: "Build the system",
    icon: "/tiers-assets/cth-tier-card-house-building.png",
    description:
      "For founders who need visual identity exports, launch planning, CRM, and unlimited content.",
    features: [
      "Everything in Structure",
      "Visual Identity Exports",
      "Launch Planner",
      "Brand Kit Export",
      "Content Studio (unlimited)",
      "CRM Suite",
    ],
    cta: "Choose House",
  },
  {
    name: "Estate",
    price: "$397",
    period: "/month",
    label: "Scale the house",
    icon: "/tiers-assets/cth-tier-card-estate-mansion.png",
    description:
      "For founders scaling into teams, client delivery, and white-label brand infrastructure.",
    features: [
      "Everything in House",
      "Team Seats",
      "Client Brand Vaults",
      "White-Label Exports",
      "Agentic Workflows",
    ],
    cta: "Choose Estate",
  },
];

const COMPARISON_ICON_BASE = "/tiers-assets/cth-comparison-table-icons";

const comparisonRows = [
  { label: "Brand Foundation",            icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-brand-foundation.png`,     tiers: [true,  true,  true,  true] },
  { label: "Brand Positioning",           icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-strategic-direction.png`,  tiers: [true,  true,  true,  true] },
  { label: "Audience Clarity",            icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-content-support.png`,      tiers: [true,  true,  true,  true] },
  { label: "Identity Studio",             icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-identity-studio.png`,      tiers: [true,  true,  true,  true] },
  { label: "Strategic OS (Foundation Steps)", icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-strategic-direction.png`, tiers: [true,  true,  true,  true] },
  { label: "Content Studio",              icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-content-support.png`,      tiers: [true,  true,  true,  true] },
  { label: "Offer Structure",             icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-offer-structure.png`,      tiers: [false, true,  true,  true] },
  { label: "Campaign Builder",            icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-offer-structure.png`,      tiers: [false, true,  true,  true] },
  { label: "Brand Memory",                icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-brand-memory.png`,         tiers: [false, true,  true,  true] },
  { label: "Strategic OS (Full Access)",  icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-strategic-direction.png`,  tiers: [false, true,  true,  true] },
  { label: "Launch Planning",             icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-launch-planning.png`,      tiers: [false, false, true,  true] },
  { label: "Team Seats",                  icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-team-seats.png`,           tiers: [false, false, false, true] },
  { label: "Client Vaults",               icon: `${COMPARISON_ICON_BASE}/cth-capability-icon-client-vaults.png`,        tiers: [false, false, false, true] },
];

const valueCards = [
  {
    title: "A Clear Path Forward",
    copy: "Every tier gives you a proven framework so you always know what to build next.",
    icon: "✧",
  },
  {
    title: "Cumulative Growth",
    copy: "Your work, assets, and systems carry upward, never starting over.",
    icon: "◈",
  },
  {
    title: "Strategic Depth",
    copy: "Each level adds the clarity, systems, and execution support your brand is ready to hold.",
    icon: "◎",
  },
  {
    title: "Scalable Infrastructure",
    copy: "Designed to support you now and expand as your team, offers, and clients grow.",
    icon: "⌂",
  },
];

const faqs = [
  {
    q: "Are the tiers cumulative?",
    a: "Yes. Each tier builds on the last so your brand foundation, systems, assets, and strategic memory continue moving forward.",
  },
  {
    q: "Which tier is best to start with?",
    a: "Start with the Brand Diagnostic. It identifies the structural gaps in your brand and recommends the best starting tier.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. The tier system is designed to grow with your brand, your offers, and your operating needs.",
  },
  {
    q: "Is the Brand Diagnostic free?",
    a: "Yes. The diagnostic is the fastest way to understand where your brand structure is strong and where it needs support.",
  },
  {
    q: "What happens to my saved work when I upgrade?",
    a: "Your saved brand work moves with you. The goal is to deepen your system, not restart it.",
  },
];

function CheckMark({ active }) {
  if (active) {
    return (
      <span className="cth-tiers-check-mark cth-tiers-check-mark--active" aria-label="Included">
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="9" cy="9" r="9" fill="#c4a95b" />
          <path d="M5 9.4 L8 12.4 L13.5 6.4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="cth-tiers-check-mark cth-tiers-check-mark--inactive" aria-label="Not included">
      —
    </span>
  );
}

export default function TiersPage() {
  useEffect(() => {
    document.title = "Tiers | Core Truth House";

    const meta = {
      description:
        "Compare Core Truth House tiers and choose the level of brand clarity, structure, execution, and infrastructure your brand is ready for.",
      "og:title": "Core Truth House Tiers",
      "og:description":
        "Choose the house your brand is ready for. Compare Foundation, Structure, House, and Estate.",
      "og:image": "https://coretruthhouse.com/tiers-assets/cth-tiers-social-card.png",
      "og:url": "https://coretruthhouse.com/tiers",
      "twitter:card": "summary_large_image",
    };

    Object.entries(meta).forEach(([name, content]) => {
      const attr = name.startsWith("og:") ? "property" : "name";
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://coretruthhouse.com/tiers");
  }, []);

  return (
    <main className="cth-tiers-page">
      <PublicHeader active="tiers" />

      <section className="cth-tiers-hero">
        <div className="cth-tiers-hero__copy">
          <p className="cth-tiers-eyebrow">Tiers</p>
          <h1>
            Choose the House Your Brand Is <em>Ready For.</em>
          </h1>
          <p>
            Each Core Truth House tier gives founders more clarity, more structure, and more execution power so your brand can grow with precision and lead with impact.
          </p>
          <div className="cth-tiers-actions">
            <a className="cth-tiers-button primary" href="/brand-diagnostic">
              Start the Brand Diagnostic
            </a>
            <a className="cth-tiers-button secondary" href="#compare">
              How It Works
            </a>
          </div>
        </div>

        <div className="cth-tiers-hero__visual" aria-hidden="true">
          <img
            className="cth-tiers-hero__progression"
            src="/tiers-assets/cth-tiers-hero-progression-no-logo.png"
            alt=""
          />
        </div>
      </section>

      <section className="cth-tiers-cumulative">
        <span>✧</span>
        <p>All tiers are cumulative. Each level builds on the last so you always move forward.</p>
      </section>

      <section className="cth-tiers-pricing" aria-labelledby="tiers-pricing-heading">
        <div className="cth-tiers-section-heading">
          <p className="cth-tiers-section-kicker">Core Truth House Tiers</p>
          <h2 id="tiers-pricing-heading">Built for how serious brands grow.</h2>
        </div>

        <div className="cth-tier-grid">
          {tiers.map((tier) => (
            <article key={tier.name} className={tier.featured ? "cth-tier-card is-featured" : "cth-tier-card"}>
              {tier.featured ? <div className="cth-tier-ribbon">Most Chosen</div> : null}
              <div className="cth-tier-card-topline">{tier.label}</div>
              <div className="cth-tier-icon">
                <img src={tier.icon} alt="" />
              </div>
              <h3>{tier.name}</h3>
              <div className="cth-tier-price">
                <span>{tier.price}</span>
                <small>{tier.period}</small>
              </div>
              <p>{tier.description}</p>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className={tier.featured ? "cth-tier-choose filled" : "cth-tier-choose"} href="/brand-diagnostic">
                {tier.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="compare" className="cth-tiers-comparison">
        <div className="cth-tiers-section-heading">
          <p className="cth-tiers-section-kicker">What expands at each tier</p>
          <h2>Your brand does not need more noise. It needs the right structure at the right stage.</h2>
        </div>

        <div className="cth-comparison-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Core Capabilities</th>
                <th>Foundation<br /><small>$47/mo</small></th>
                <th className="is-featured-col">Structure<br /><small>$97/mo</small></th>
                <th>House<br /><small>$197/mo</small></th>
                <th>Estate<br /><small>$397/mo</small></th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <td className="cth-comparison-feature-cell">
                    <img className="cth-comparison-feature-icon" src={row.icon} alt="" aria-hidden="true" />
                    <span>{row.label}</span>
                  </td>
                  <td><CheckMark active={row.tiers[0]} /></td>
                  <td className="is-featured-col"><CheckMark active={row.tiers[1]} /></td>
                  <td><CheckMark active={row.tiers[2]} /></td>
                  <td><CheckMark active={row.tiers[3]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cth-tiers-diagnostic">
        <div className="cth-tiers-diagnostic__copy">
          <p className="cth-tiers-eyebrow">Not sure where you belong?</p>
          <h2>Find Your Best Starting Point With the Brand Diagnostic.</h2>
          <p>
            The diagnostic reads the structure behind your brand, then points you toward the tier that closes the right gap first.
          </p>
          <div className="cth-tiers-actions">
            <a className="cth-tiers-button primary" href="/brand-diagnostic">
              Start the Brand Diagnostic
            </a>
            <a className="cth-tiers-button secondary" href="/brand-diagnostic">
              See How It Works
            </a>
          </div>
        </div>

        <div className="cth-tiers-score-card">
          <div className="cth-score-panel">
            <p>Sample Diagnostic Score</p>
            {[
              ["Clarity", "62", "62%"],
              ["Structure", "48", "48%"],
              ["Execution", "39", "39%"],
              ["Optimization", "33", "33%"],
            ].map(([label, score, width]) => (
              <div key={label} className="cth-score-group">
                <div className="cth-score-row">
                  <span>{label}</span>
                  <strong>{score}/100</strong>
                </div>
                <div className="cth-score-bar">
                  <i style={{ width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="cth-tiers-recommendation">
            <img src="/tiers-assets/cth-tier-card-structure-building.png" alt="" />
            <p>Recommended Starting Tier</p>
            <h3>Structure</h3>
            <span>Build the systems that turn your strategy into execution.</span>
          </div>
        </div>
      </section>

      <section className="cth-tiers-value">
        <div className="cth-tiers-section-heading">
          <p className="cth-tiers-section-kicker">Built for serious founders</p>
          <h2>The path is structured so your brand can hold the next level.</h2>
        </div>

        <div className="cth-tiers-value-grid">
          {valueCards.map((card) => (
            <article key={card.title}>
              <div>{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cth-tiers-faq">
        <div className="cth-tiers-section-heading">
          <p className="cth-tiers-section-kicker">Frequently Asked Questions</p>
          <h2>Clear answers before you choose.</h2>
        </div>

        <div className="cth-tiers-faq-list">
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>
                {faq.q}
                <span>+</span>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cth-tiers-final">
        <div className="cth-tiers-final__seal">
          <img src="/brand-assets/logo/cth-logo-seal.png" alt="" />
        </div>
        <div>
          <p>Ready to choose your next level?</p>
          <h2>Start With Clarity. Build With Structure.</h2>
          <span>Discover the right tier for your brand and start building a business that leads.</span>
        </div>
        <div className="cth-tiers-final-actions">
          <a className="cth-tiers-button primary" href="/brand-diagnostic">
            Start the Brand Diagnostic
          </a>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
