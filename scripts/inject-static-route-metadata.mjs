import fs from "fs";
import path from "path";

const distDir = path.resolve("dist");
const templatePath = path.join(distDir, "index.html");

if (!fs.existsSync(templatePath)) {
  console.error("STOP: dist/index.html not found. Run npm run build first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(templatePath, "utf8");

const SITE = "https://coretruthhouse.com";

const defaultImage = `${SITE}/og-image.png`;

const routes = [
  {
    route: "/",
    title: "Core Truth House | Where Serious Brands Are Built",
    description:
      "Core Truth House helps serious solo service-based founders uncover the structural gaps in their brand, stop guessing, and start with the Brand Diagnostic.",
    ogTitle: "Where serious brands are built",
    ogDescription:
      "A Brand Operating System for founders who are consistent but not converting and need structure behind their message, offers, content, and sales path.",
    image: defaultImage,
    canonical: `${SITE}/`,
    schemaType: "Organization",
  },
  {
    route: "/brand-diagnostic/",
    title: "Brand Diagnostic | Core Truth House",
    description:
      "Take the Core Truth House Brand Diagnostic to uncover the structural gaps keeping your brand from converting.",
    ogTitle: "Find the gaps in your brand structure | Core Truth House",
    ogDescription:
      "A 3 to 5 minute diagnostic for serious founders who are consistent but not converting.",
    image: `${SITE}/brand-diagnostic-assets/cth-brand-diagnostic-social-card.png`,
    canonical: `${SITE}/brand-diagnostic/`,
    schemaType: "WebPage",
  },
  {
    route: "/methodology",
    title: "Methodology | Core Truth House",
    description:
      "Explore the Core Truth House methodology for turning scattered brand decisions into clarity, structure, execution, and optimization.",
    ogTitle: "The Core Truth House Method",
    ogDescription:
      "A structured brand-building method for founders who are tired of disconnected tools, random tactics, and starting over.",
    image: `${SITE}/methodology-assets/cth-methodology-social-card.png`,
    canonical: `${SITE}/methodology`,
    schemaType: "WebPage",
  },
  {
    route: "/about",
    title: "About | Core Truth House",
    description:
      "Learn why Core Truth House exists and how it helps serious founders build from truth, structure, and strategic clarity.",
    ogTitle: "About Core Truth House",
    ogDescription:
      "The story behind a brand operating system built for founders whose work has depth but whose brand needs stronger structure.",
    image: `${SITE}/about-assets/cth-about-social-card.png`,
    canonical: `${SITE}/about`,
    schemaType: "AboutPage",
  },
  {
    route: "/contact",
    title: "Contact | Core Truth House",
    description:
      "Contact Core Truth House for questions about the Brand Diagnostic, brand systems, support, partnerships, or next steps.",
    ogTitle: "Contact Core Truth House",
    ogDescription:
      "Reach out with questions about the diagnostic, the system, support, partnerships, or the right next step for your brand.",
    image: `${SITE}/contact-assets/cth-contact-social-card.png`,
    canonical: `${SITE}/contact`,
    schemaType: "ContactPage",
  },
  {
    route: "/blog",
    title: "Field Notes | Core Truth House",
    description:
      "Read Core Truth House field notes on brand clarity, positioning, messaging, offers, content systems, and founder strategy.",
    ogTitle: "Core Truth House Field Notes",
    ogDescription:
      "Strategic essays for serious founders building stronger brands with more clarity, structure, and conversion power.",
    image: `${SITE}/field-notes-assets/cth-field-notes-social-card.png`,
    canonical: `${SITE}/blog`,
    schemaType: "Blog",
  },
  {
    route: "/store",
    title: "Store | Core Truth House",
    description:
      "Explore Core Truth House offers, tools, and resources designed to help founders strengthen brand structure and presence.",
    ogTitle: "Core Truth House Store",
    ogDescription:
      "Tools, studios, and strategic resources for founders building the brand behind the business.",
    image: `${SITE}/storefront-assets/cth-store-social-card.png`,
    canonical: `${SITE}/store`,
    schemaType: "CollectionPage",
  },
  {
    route: "/privacy",
    title: "Privacy Policy | Core Truth House",
    description:
      "Read the Core Truth House Privacy Policy to understand how information is collected, used, protected, and managed.",
    ogTitle: "Privacy Policy | Core Truth House",
    ogDescription:
      "How Core Truth House handles privacy, data, and user information.",
    image: defaultImage,
    canonical: `${SITE}/privacy`,
    schemaType: "WebPage",
  },
  {
    route: "/terms",
    title: "Terms of Service | Core Truth House",
    description:
      "Read the Core Truth House Terms of Service for platform access, purchases, subscriptions, and usage guidelines.",
    ogTitle: "Terms of Service | Core Truth House",
    ogDescription:
      "The terms that govern use of Core Truth House products, services, and platform access.",
    image: defaultImage,
    canonical: `${SITE}/terms`,
    schemaType: "WebPage",
  },
  {
    route: "/terms-of-service",
    title: "Terms of Service | Core Truth House",
    description:
      "Read the Core Truth House Terms of Service for platform access, purchases, subscriptions, and usage guidelines.",
    ogTitle: "Terms of Service | Core Truth House",
    ogDescription:
      "The terms that govern use of Core Truth House products, services, and platform access.",
    image: defaultImage,
    canonical: `${SITE}/terms-of-service`,
    schemaType: "WebPage",
  },
  {
    route: "/demo-mode",
    title: "Demo Mode | Core Truth House",
    description:
      "Preview how Core Truth House helps founders move from scattered brand decisions to a structured brand operating system.",
    ogTitle: "Preview Core Truth House",
    ogDescription:
      "See how the system guides serious founders from scattered brand decisions into a clearer operating structure.",
    image: defaultImage,
    canonical: `${SITE}/demo-mode`,
    schemaType: "WebPage",
  },
];

function escapeAttr(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function upsertTag(html, matcher, replacement) {
  if (matcher.test(html)) {
    return html.replace(matcher, replacement);
  }
  return html.replace("</head>", `        ${replacement}\n</head>`);
}

function removeExistingJsonLd(html) {
  return html.replace(
    /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    ""
  );
}

function buildSchema(meta) {
  const schema = {
    "@context": "https://schema.org",
    "@type": meta.schemaType || "WebPage",
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    publisher: {
      "@type": "Organization",
      name: "Core Truth House",
      url: SITE,
    },
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n        </script>`;
}


const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a brand operating system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A brand operating system is the connected structure behind your brand. It organizes positioning, messaging, audience, offers, content, sales pages, funnels, and decision rules so your brand does not depend on scattered notes or one-off prompts."
      }
    },
    {
      "@type": "Question",
      name: "Who is Core Truth House for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core Truth House is designed for solo service-based founders who already have content, offers, experience, and visibility, but need stronger structure so the brand is clearer, more consistent, and easier to sell."
      }
    },
    {
      "@type": "Question",
      name: "How is Core Truth House different from Jasper, ChatGPT prompts, Canva, or StoryBrand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Those tools can help create individual pieces. Core Truth House is built to hold the structure behind the pieces by connecting brand foundation, Brand Memory, content, offers, sales assets, and execution path."
      }
    },
    {
      "@type": "Question",
      name: "What is Brand Memory?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Brand Memory is the persistent context layer that stores strategy, voice, audience, offers, and visual identity, so AI generation across the platform sounds like the brand and not generic GPT output."
      }
    },
    {
      "@type": "Question",
      name: "Why should I start with the Brand Diagnostic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Brand Diagnostic shows where the structural gaps are before buying into the system. It helps identify whether the problem is positioning, messaging, offer clarity, audience fit, trust, content consistency, or conversion path."
      }
    }
  ]
};

function injectHomepageFaqSchema(html, meta) {
  if (!meta || meta.route !== "/") return html;
  if (html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"')) return html;

  const schemaTag = `        <script type="application/ld+json">${JSON.stringify(homepageFaqSchema)}</script>\n`;
  return html.replace(/\s*<\/head>/i, "\n" + schemaTag + "</head>");
}


function removePublicOnlyPreloads(html) {
  return html
    .replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/client-[^"]+\.js">/g, "")
    .replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/useAuth-[^"]+\.js">/g, "")
    .replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/Auth-[^"]+\.js">/g, "")
    .replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/ProtectedApp-[^"]+\.js">/g, "")
    .replace(/\s*<link rel="modulepreload" crossorigin href="\/assets\/AppRouter-[^"]+\.js">/g, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildFallbackBody(meta) {
  const route = meta.route || "/";

  const bodies = {
    "/": {
      eyebrow: "Core Truth House",
      headline: "Build the brand behind the business before you build the brand the world sees.",
      intro:
        "Core Truth House helps solo service-based founders uncover the structural gaps in their brand, stop guessing, and start with the Brand Diagnostic.",
      points: [
        "Take the Brand Diagnostic",
        "Uncover what is scattered, unclear, or structurally missing",
        "Enter the right system for your brand stage",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/brand-diagnostic/": {
      eyebrow: "Brand Diagnostic",
      headline: "Find the structural gaps keeping your brand from converting.",
      intro:
        "The Core Truth House Brand Diagnostic helps serious founders see what is missing across positioning, messaging, offer clarity, audience fit, content consistency, trust, and conversion path.",
      points: [
        "Complete a focused 3 to 5 minute assessment",
        "Receive a clearer view of your brand gaps",
        "Get guided toward the right Core Truth House tier",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/methodology": {
      eyebrow: "The Method",
      headline: "A structured way to build the brand behind the business.",
      intro:
        "The Core Truth House methodology moves founders from scattered decisions into clarity, structure, execution, and optimization so the brand can support real conversion.",
      points: [
        "Clarity before content",
        "Structure before scale",
        "Execution guided by brand memory",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/about": {
      eyebrow: "About Core Truth House",
      headline: "Built for founders whose work has depth but whose brand needs structure.",
      intro:
        "Core Truth House exists to help serious solo service-based founders stop rebuilding their brand from scratch every time they write, sell, launch, or explain what they do.",
      points: [
        "For solo service-based founders whose content resonates but conversion still feels inconsistent",
        "For service-based experts who are consistent but not converting",
        "For brands that need structure, not more random tactics",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/contact": {
      eyebrow: "Contact",
      headline: "Have a question about the diagnostic, the system, or your next step?",
      intro:
        "Reach out to Core Truth House for support, partnership questions, platform guidance, or clarity around which path fits your brand stage.",
      points: [
        "Questions about the Brand Diagnostic",
        "Questions about Core Truth House tiers",
        "Support, partnerships, and next-step guidance",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/blog": {
      eyebrow: "Field Notes",
      headline: "Strategic notes for founders building stronger brands.",
      intro:
        "Core Truth House Field Notes explores brand clarity, positioning, messaging, offers, content systems, conversion paths, and founder operating structure.",
      points: [
        "Brand clarity and positioning",
        "Messaging and offer structure",
        "Founder systems and content strategy",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/store": {
      eyebrow: "Store",
      headline: "Tools and resources for building the brand behind the business.",
      intro:
        "Explore Core Truth House offers, studios, and strategic resources designed to help founders strengthen brand structure and presence.",
      points: [
        "Brand-building tools",
        "Strategic resources",
        "Focused founder support",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
    "/privacy": {
      eyebrow: "Privacy Policy",
      headline: "How Core Truth House handles privacy and data.",
      intro:
        "Read how Core Truth House collects, uses, protects, and manages information across its website, products, and services.",
      points: [
        "Information collection",
        "Data use and protection",
        "User rights and choices",
      ],
      cta: "Contact Core Truth House",
      href: "/contact",
    },
    "/terms": {
      eyebrow: "Terms of Service",
      headline: "Terms for using Core Truth House.",
      intro:
        "Read the terms that govern Core Truth House platform access, purchases, subscriptions, services, and usage guidelines.",
      points: [
        "Platform access",
        "Purchases and subscriptions",
        "Use of products and services",
      ],
      cta: "Contact Core Truth House",
      href: "/contact",
    },
    "/terms-of-service": {
      eyebrow: "Terms of Service",
      headline: "Terms for using Core Truth House.",
      intro:
        "Read the terms that govern Core Truth House platform access, purchases, subscriptions, services, and usage guidelines.",
      points: [
        "Platform access",
        "Purchases and subscriptions",
        "Use of products and services",
      ],
      cta: "Contact Core Truth House",
      href: "/contact",
    },
    "/demo-mode": {
      eyebrow: "Demo Mode",
      headline: "Preview how Core Truth House moves founders from scattered to structured.",
      intro:
        "Demo Mode gives visitors a preview of how the system guides brand decisions, structure, and execution without requiring full app access.",
      points: [
        "Preview the system experience",
        "Understand the founder journey",
        "See how brand structure supports execution",
      ],
      cta: "Start the Brand Diagnostic",
      href: "/brand-diagnostic/",
    },
  };

  const body = bodies[route] || bodies["/"];

  return `
    <div id="root">
      <main style="font-family: 'DM Sans', Arial, sans-serif; background: #efe7e3; color: #2b1040; min-height: 100vh; padding: 56px 24px;">
        <section style="max-width: 980px; margin: 0 auto;">
          <p style="letter-spacing: 0.18em; text-transform: uppercase; font-size: 12px; color: #763b5b; margin: 0 0 18px;">${escapeHtml(body.eyebrow)}</p>
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: clamp(42px, 7vw, 84px); line-height: 0.95; margin: 0 0 24px; color: #2b1040;">${escapeHtml(body.headline)}</h1>
          <p style="font-size: 19px; line-height: 1.7; max-width: 760px; margin: 0 0 32px; color: #4b2a4f;">${escapeHtml(body.intro)}</p>
          <ul style="display: grid; gap: 12px; padding: 0; margin: 0 0 36px; list-style: none;">
            ${body.points
              .map(
                (point) =>
                  `<li style="border: 1px solid #d8c5c3; background: #f8f4f2; border-radius: 18px; padding: 16px 18px;">${escapeHtml(point)}</li>`
              )
              .join("")}
          </ul>
          <a href="${escapeHtml(body.href)}" style="display: inline-block; border-radius: 999px; background: #e04e35; color: #fff; padding: 14px 22px; font-weight: 700; text-decoration: none;">${escapeHtml(body.cta)}</a>
        </section>
      </main>
    </div>`;
}

function replaceRootFallback(html, meta) {
  const fallback = buildFallbackBody(meta);

  // Remove the entire root fallback block, including nested divs/sections,
  // from <div id="root"> up to the first Vite asset tag.
  const rootStart = html.indexOf('<div id="root">');

  if (rootStart === -1) {
    return html;
  }

  const afterRoot = html.slice(rootStart);
  const assetMatch = afterRoot.search(/\s*<script type="module"|\s*<link rel="modulepreload"|\s*<link rel="stylesheet"/);
  const scriptStart = assetMatch === -1 ? -1 : rootStart + assetMatch;

  if (scriptStart !== -1 && scriptStart > rootStart) {
    return html.slice(0, rootStart) + fallback + "\n  " + html.slice(scriptStart);
  }

  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', fallback);
  }

  return html;
}



function addHomepageOrganizationSchemaDirect(html, meta) {
  if (!meta || meta.route !== "/") return html;

  // Remove any existing Organization JSON-LD blocks first so the homepage only has one.
  html = html.replace(
    /\s*<script type="application\/ld\+json">\s*\{[^<]*"@type"\s*:\s*"Organization"[^<]*\}\s*<\/script>/g,
    ""
  );

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Core Truth House",
    "url": "https://coretruthhouse.com/",
    "description": "Core Truth House is a brand operating system for solo service-based founders who need structure behind their message, offers, content, sales pages, funnels, and brand decisions.",
    "logo": "https://coretruthhouse.com/brand-assets/logo/cth-logo-seal.png",
    "sameAs": []
  };

  const schemaTag = `\n        <script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>`;
  return html.replace(/<\/head>/i, schemaTag + "\n      </head>");
}


function addHomepageFaqSchemaDirect(html, meta) {
  if (!meta || meta.route !== "/") return html;
  if (html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"')) return html;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a brand operating system?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A brand operating system is the connected structure behind your brand. It organizes positioning, messaging, audience, offers, content, sales pages, funnels, and decision rules so your brand does not depend on scattered notes or one-off prompts."
        }
      },
      {
        "@type": "Question",
        "name": "Who is Core Truth House for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Core Truth House is designed for solo service-based founders who already have content, offers, experience, and visibility, but need stronger structure so the brand is clearer, more consistent, and easier to sell."
        }
      },
      {
        "@type": "Question",
        "name": "How is Core Truth House different from Jasper, ChatGPT prompts, Canva, or StoryBrand?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Those tools can help create individual pieces. Core Truth House is built to hold the structure behind the pieces by connecting brand foundation, Brand Memory, content, offers, sales assets, and execution path."
        }
      },
      {
        "@type": "Question",
        "name": "What is Brand Memory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Brand Memory is the persistent context layer that stores strategy, voice, audience, offers, and visual identity, so AI generation across the platform sounds like the brand and not generic GPT output."
        }
      },
      {
        "@type": "Question",
        "name": "Why should I start with the Brand Diagnostic?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Brand Diagnostic shows where the structural gaps are before buying into the system. It helps identify whether the problem is positioning, messaging, offer clarity, audience fit, trust, content consistency, or conversion path."
        }
      }
    ]
  };

  const schemaTag = `\n        <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
  return html.replace(/<\/head>/i, schemaTag + "\n      </head>");
}


function applyMeta(html, meta) {
  let out = injectHomepageFaqSchema(replaceRootFallback(removePublicOnlyPreloads(html), meta), meta);

  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(meta.title)}</title>`);

  out = upsertTag(
    out,
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`
  );

  out = upsertTag(
    out,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`
  );

  out = upsertTag(
    out,
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeAttr(meta.ogTitle)}" />`
  );

  out = upsertTag(
    out,
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}" />`
  );

  out = upsertTag(
    out,
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeAttr(meta.canonical)}" />`
  );

  out = upsertTag(
    out,
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeAttr(meta.image)}" />`
  );

  out = upsertTag(
    out,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeAttr(meta.ogTitle)}" />`
  );

  out = upsertTag(
    out,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}" />`
  );

  out = upsertTag(
    out,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${escapeAttr(meta.image)}" />`
  );

  out = removeExistingJsonLd(out);
  out = out.replace("</head>", `        ${buildSchema(meta)}\n</head>`);

  return out;
}

function routeToFile(route) {
  if (route === "/") return path.join(distDir, "index.html");
  const clean = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return path.join(distDir, clean, "index.html");
}

for (const meta of routes) {
  const filePath = routeToFile(meta.route);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const html = addHomepageOrganizationSchemaDirect(addHomepageFaqSchemaDirect(applyMeta(baseHtml, meta), meta), meta);
  fs.writeFileSync(filePath, html);

  console.log(`Wrote static metadata: ${meta.route} -> ${path.relative(process.cwd(), filePath)}`);
}

console.log("Static route metadata injection complete.");
