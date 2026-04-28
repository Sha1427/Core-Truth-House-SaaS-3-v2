const fs = require("fs");
const path = require("path");

const root = process.cwd();
const distIndexPath = path.join(root, "dist", "index.html");
const outputDir = path.join(root, "dist", "brand-diagnostic");
const outputPath = path.join(outputDir, "index.html");

if (!fs.existsSync(distIndexPath)) {
  console.error("STOP: dist/index.html not found. Run npm run build first.");
  process.exit(1);
}

const distIndex = fs.readFileSync(distIndexPath, "utf8");
const jsMatch = distIndex.match(/\/assets\/[^"]+\.js/);
const cssMatch = distIndex.match(/\/assets\/[^"]+\.css/);

if (!jsMatch || !cssMatch) {
  console.error("STOP: Could not detect built JS/CSS assets from dist/index.html.");
  process.exit(1);
}

const jsAsset = jsMatch[0];
const cssAsset = cssMatch[0];

fs.mkdirSync(outputDir, { recursive: true });

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#33033C" />

    <title>Brand Diagnostic | Core Truth House</title>
    <meta name="description" content="Take the Core Truth House Brand Diagnostic to uncover the structural gaps keeping your brand from converting." />
    <link rel="canonical" href="https://coretruthhouse.com/brand-diagnostic/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Core Truth House" />
    <meta property="og:title" content="Find the gaps in your brand structure | Core Truth House" />
    <meta property="og:description" content="A 3 to 5 minute diagnostic for serious founders who are consistent but not converting." />
    <meta property="og:url" content="https://coretruthhouse.com/brand-diagnostic/" />
    <meta property="og:image" content="https://coretruthhouse.com/brand-diagnostic-assets/cth-brand-diagnostic-social-card.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Find the gaps in your brand structure | Core Truth House" />
    <meta name="twitter:description" content="A 3 to 5 minute diagnostic for serious founders who are consistent but not converting." />
    <meta name="twitter:image" content="https://coretruthhouse.com/brand-diagnostic-assets/cth-brand-diagnostic-social-card.png" />

    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/icon-152.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
    <link rel="icon" type="image/png" href="/favicon.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://clerk.coretruthhouse.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Core Truth House Brand Diagnostic",
      "description": "A 3 to 5 minute diagnostic that helps founders identify the structural gaps keeping their brand from converting.",
      "url": "https://coretruthhouse.com/brand-diagnostic/",
      "provider": {
        "@type": "Organization",
        "name": "Core Truth House",
        "url": "https://coretruthhouse.com"
      }
    }
    </script>

    <script type="module" crossorigin src="${jsAsset}"></script>
    <link rel="stylesheet" crossorigin href="${cssAsset}">
  </head>
  <body>
    <noscript>
      <h1>Brand Diagnostic | Core Truth House</h1>
      <p>Take the Core Truth House Brand Diagnostic to uncover the structural gaps keeping your brand from converting.</p>
    </noscript>
    <div id="root"></div>
  </body>
</html>
`;

fs.writeFileSync(outputPath, html);
console.log(`Created route-specific metadata page: ${outputPath}`);
console.log(`Using JS: ${jsAsset}`);
console.log(`Using CSS: ${cssAsset}`);
