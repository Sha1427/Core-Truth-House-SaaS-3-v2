import React from "react";
import { Link, useParams } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const A = "/field-notes-assets/";

const categories = [
 "All Notes",
 "Brand Strategy",
 "Messaging",
 "Systems",
 "Founder Growth",
 "Execution",
 "Offers",
 "AI + Workflows",
];

const notes = [
 {
 slug: "strategic-consistency",
 category: "Brand Strategy",
 title: "The Quiet Power of Strategic Consistency.",
 excerpt:
 "Consistency is not repetition. It is alignment. The brands that endure are the clearest.",
 read: "6 min read",
 img: "cth-field-notes-article-strategic-consistency-hero.webp",
 sections: [
 "Consistency Is Not Repetition",
 "Clarity Builds Recognition",
 "Repetition Builds Trust",
 "Systems Protect Brand Integrity",
 "The Long Game Wins",
 "A Framework for Consistency",
 "Final Thoughts",
 ],
 paragraphs: [
 "In a world of constant noise, consistency is your brand’s quiet advantage. It does not demand attention. It earns it. It is the throughline that turns first impressions into lasting relationships and fleeting attention into enduring trust.",
 "Repetition is saying the same thing over and over. Consistency is saying the right things, in the right ways, across every touchpoint.",
 "When your message is clear and your identity is aligned, your audience recognizes you instantly. Whether they are seeing you for the first time or the tenth, the brand feels familiar, grounded, and trustworthy.",
 "Trust is built in the ordinary moments. Every consistent interaction reinforces a promise and deepens confidence.",
 "Behind every consistent brand is a system. Documented standards, repeatable processes, and empowered decisions ensure your brand shows up the same way, even when you are not in the room.",
 "Trends fade. Consistency compounds. The brands that win over time are the ones that stay true to who they are, and stay present for the long haul.",
 "Consistency will not always be the loudest choice, but it will always be the strongest. When your brand is built on clarity, alignment, and discipline, you create something rare: a brand that lasts.",
 ],
 quote: "Consistency is not about being the same. It is about being unmistakably you.",
 },
 {
 slug: "say-fewer-things",
 category: "Messaging",
 title: "Say Fewer Things. Say Them Better.",
 excerpt:
 "Your message is not what you say about your business. It is what changes in your client's mind.",
 read: "5 min read",
 img: "cth-field-notes-article-say-fewer-things-hero.webp",
 sections: [
 "The Cost of Saying Too Much",
 "Clarity Creates Movement",
 "One Message Must Lead",
 "Repetition Builds Recall",
 "Final Thoughts",
 ],
 paragraphs: [
 "Most founders do not need more words. They need sharper words. A message becomes powerful when the audience can repeat it back without having to decode it.",
 "The cost of saying too much is not just confusion. It is hesitation. When every idea competes for attention, the buyer cannot tell which truth matters most.",
 "Clarity creates movement because it removes the mental work from the reader. They do not have to guess what you do, why it matters, or what step to take next.",
 "One message must lead. Your content, offers, sales pages, and calls to action should all point back to a clear central idea.",
 "Repetition is not lazy when the message is true. It is how your audience learns what to associate with your brand.",
 "Say fewer things. Say them with more discipline. Let your strongest message become easier to recognize every time someone meets your brand.",
 ],
 quote: "The sharper the message, the less your audience has to work to trust it.",
 },
 {
 slug: "systems-create-freedom",
 category: "Systems",
 title: "Systems Create Freedom. Not Just Efficiency.",
 excerpt:
 "The right systems do not just save time. They create space for vision, creativity, and scale.",
 read: "6 min read",
 img: "cth-field-notes-article-systems-create-freedom-hero.webp",
 sections: [
 "Systems Are Not Restriction",
 "Structure Protects Creativity",
 "Repeatable Does Not Mean Generic",
 "The Founder Gets Space Back",
 "Final Thoughts",
 ],
 paragraphs: [
 "Systems are often misunderstood as rigid, cold, or limiting. But the right system is not a cage. It is a container that protects what matters.",
 "When your brand decisions are scattered, every new task becomes heavier than it should be. You are not just creating. You are searching, deciding, and rebuilding at the same time.",
 "Structure protects creativity because it removes unnecessary decisions. It gives your energy somewhere productive to go.",
 "Repeatable does not mean generic. A strong system preserves the brand’s standards, voice, promise, and direction so every new asset feels connected.",
 "The founder gets space back when the business is no longer dependent on memory, mood, or last-minute effort.",
 "A system is not the opposite of freedom. For a serious brand, it is how freedom becomes sustainable.",
 ],
 quote: "The right system does not make your brand smaller. It gives your best thinking somewhere to live.",
 },
 {
 slug: "inner-work-outer-results",
 category: "Founder Growth",
 title: "The Inner Work Behind Outer Results.",
 excerpt:
 "Sustainable growth starts with your state, your standards, and your self-leadership.",
 read: "5 min read",
 img: "cth-field-notes-article-inner-work-outer-results-hero.webp",
 sections: [
 "The Founder Sets the Weather",
 "Standards Shape the Brand",
 "Calm Is a Strategic Advantage",
 "Leadership Before Visibility",
 "Final Thoughts",
 ],
 paragraphs: [
 "A founder does not just build the business. The founder sets the weather inside it.",
 "When the founder is scattered, the brand often becomes scattered too. When the founder is clear, the business has a better chance of moving with discipline.",
 "Standards shape the brand long before the audience sees the final asset. What you tolerate, repeat, refine, and protect becomes part of the customer experience.",
 "Calm is a strategic advantage. It allows you to make cleaner decisions, hold a stronger line, and stop overcorrecting every time the market shifts.",
 "Visibility is powerful, but leadership comes first. A brand that grows without internal standards becomes harder to hold as attention increases.",
 "The work behind the work matters. Your systems, state, and standards decide how much growth your brand can actually carry.",
 ],
 quote: "The brand can only hold what the founder is willing to lead.",
 },
 {
 slug: "execution-is-intentional",
 category: "Execution",
 title: "Execution Is Not Intense. It Is Intentional.",
 excerpt:
 "Small, consistent actions compound into category-defining results over time.",
 read: "4 min read",
 img: "cth-field-notes-article-execution-is-intentional-hero.webp",
 sections: [
 "Intensity Is Not the Same as Progress",
 "Execution Needs Direction",
 "Small Moves Compound",
 "Consistency Beats Bursts",
 "Final Thoughts",
 ],
 paragraphs: [
 "Execution is often mistaken for intensity. More hours. More pressure. More urgency. But intensity without direction creates motion, not momentum.",
 "Intentional execution starts with knowing what matters now. The next right action becomes clearer when the brand has a real operating system behind it.",
 "Small moves compound when they are connected. A single post, email, offer update, or sales page revision becomes more powerful when it strengthens the same direction.",
 "Consistency beats bursts because trust is built through repeated evidence. Your audience needs to see that the brand can hold its promise over time.",
 "The goal is not to do everything. The goal is to do the right things with enough discipline that they begin to work together.",
 "Execution becomes easier when the brand is clear enough to tell you what deserves attention.",
 ],
 quote: "Execution is not about doing more. It is about doing what compounds.",
 },
 {
 slug: "offers-that-align",
 category: "Offers",
 title: "Offers That Align Convert With Ease.",
 excerpt:
 "When your offer meets the real need, in the right way, at the right time, it sells.",
 read: "5 min read",
 img: "cth-field-notes-article-offers-that-align-hero.webp",
 sections: [
 "Alignment Creates Ease",
 "The Offer Must Meet the Moment",
 "Value Needs Translation",
 "The Path Must Feel Clear",
 "Final Thoughts",
 ],
 paragraphs: [
 "A strong offer does not feel forced. It feels aligned. The audience can see the problem, the promise, the path, and the reason to act.",
 "Many offers struggle because they are built from what the founder wants to sell, not from what the buyer is ready to understand.",
 "The offer must meet the moment. It should speak to the real problem your audience is carrying now, not the problem you wish they were ready to solve.",
 "Value needs translation. Deliverables matter, but buyers make decisions based on outcomes, belief, timing, and trust.",
 "The path must feel clear. When the offer is hard to explain, the sales page gets longer, the CTA gets weaker, and the buyer hesitates.",
 "Aligned offers convert with more ease because they remove confusion before the sale ever begins.",
 ],
 quote: "An offer converts when the buyer can see themselves moving through it.",
 },
 {
 slug: "ai-will-multiply-you",
 category: "AI + Workflows",
 title: "AI Will Not Replace You. But It Will Multiply You.",
 excerpt:
 "Use AI to remove friction, accelerate output, and elevate your creative edge.",
 read: "6 min read",
 img: "cth-field-notes-article-ai-will-multiply-you-hero.webp",
 sections: [
 "AI Needs Direction",
 "The Founder Remains the Source",
 "Workflows Create Leverage",
 "Quality Still Needs Judgment",
 "Final Thoughts",
 ],
 paragraphs: [
 "AI will not fix a scattered brand by itself. It will usually multiply whatever structure already exists.",
 "If the brand is unclear, AI creates more unclear output faster. If the brand is structured, AI becomes a powerful amplifier.",
 "The founder remains the source. Your perspective, standards, proof, audience understanding, and strategic decisions are still the raw material.",
 "Workflows create leverage because they turn repeated tasks into guided systems. They help you move faster without losing the brand’s center.",
 "Quality still needs judgment. AI can draft, organize, summarize, and accelerate. But it cannot replace the founder’s discernment.",
 "The goal is not to hand the brand over to AI. The goal is to build enough clarity that AI can support the brand without diluting it.",
 ],
 quote: "AI is not the strategy. It is leverage for a strategy that already knows where it is going.",
 },
 {
 slug: "authority-is-earned",
 category: "Brand Strategy",
 title: "Authority Is Earned. Not Announced.",
 excerpt:
 "You build authority through proof, presence, and perspective, not promotion.",
 read: "4 min read",
 img: "cth-field-notes-article-authority-is-earned-hero.webp",
 sections: [
 "Authority Is Evidence",
 "Perspective Creates Position",
 "Proof Must Be Visible",
 "Presence Builds Memory",
 "Final Thoughts",
 ],
 paragraphs: [
 "Authority is not something a brand can simply claim. It is something the audience comes to believe after repeated evidence.",
 "You earn authority through the clarity of your perspective, the usefulness of your ideas, the consistency of your presence, and the proof behind your promise.",
 "Perspective creates position. When your brand has a clear point of view, people understand what you stand for and why your work matters.",
 "Proof must be visible. Case studies, examples, frameworks, process, results, and standards all help the audience trust what you say.",
 "Presence builds memory. The brand becomes easier to remember when it shows up with a consistent message and recognizable point of view.",
 "Authority is earned quietly before it is recognized publicly.",
 ],
 quote: "Authority is not volume. It is repeated evidence that your brand can be trusted.",
 },
];

const featuredArticle = notes[0];

function FieldNotesIndex() {
 return (
 <main className="fn-page">
 <PublicHeader active="journal" />

 <section className="fn-hero">
 <div className="fn-hero-column" />

 <div className="fn-shell fn-hero-grid">
 <div className="fn-hero-copy">
 <p className="fn-eyebrow">Field Notes</p>
 <h1>Strategic Notes From the House.</h1>
 <div className="fn-line" />
 <p>
 Field Notes is where founders find short-form insights, reflections, strategy notes,
 and sharp observations on brand clarity, systems, messaging, growth, and execution.
 </p>

 <div className="fn-proof-row">
 <div>
 <span>▧</span>
 <strong>Founder-Written Insights</strong>
 </div>
 <div>
 <span>◎</span>
 <strong>Real-World Strategy & Observations</strong>
 </div>
 <div>
 <span>△</span>
 <strong>Clarity for the Build Ahead</strong>
 </div>
 </div>
 </div>

 <div className="fn-hero-art">
 <img src={`${A}cth-field-notes-hero-book-architecture.png`} alt="Core Truth House field notes book and architecture" />
 </div>
 </div>
 </section>

 <section className="fn-tabs-wrap">
 <div className="fn-shell fn-tabs">
 {categories.map((cat, index) => (
 <button key={cat} className={index === 0 ? "active" : ""}>{cat}</button>
 ))}
 </div>
 </section>

 <section className="fn-main-section">
 <div className="fn-shell">
 <div className="fn-featured">
 <div className="fn-featured-img">
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="Core Truth House column architecture" />
 <img className="fn-image-watermark" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>

 <div className="fn-featured-copy">
 <p className="fn-section-label">Featured Note</p>
 <h2>{featuredArticle.title}</h2>
 <p>
 Consistency is not repetition. It is alignment. The brands that endure are not the loudest.
 They are the clearest. Here is how to build a brand that holds its line, compounds trust,
 and wins without chasing trends.
 </p>

 <div className="fn-note-meta">
 <span>May 20, 2026</span>
 <span>•</span>
 <span>{featuredArticle.read}</span>
 <span>•</span>
 <span>Brand Strategy</span>
 </div>

 <Link to="/blog/strategic-consistency" className="fn-red-btn">Read Note <span>→</span></Link>
 </div>
</div>

 <div className="fn-content-grid">
 <div>
 <div className="fn-section-head">
 <p className="fn-section-label">Recent Notes</p>
 <span />
 </div>

 <div className="fn-card-grid">
 {notes.map((note, index) => (
 <article className="fn-card" key={`${note.slug}-${index}`}>
 <div className="fn-card-img">
 <img src={`${A}${note.img}`} alt="" />
 <img className="fn-image-watermark small" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>

 <div className="fn-card-body">
 <p className="fn-card-category">{note.category}</p>
 <h3>{note.title}</h3>
 <p>{note.excerpt}</p>

 <div className="fn-card-meta">
 <span>May 19, 2026</span>
 <span>•</span>
 <span>{note.read}</span>
 </div>

 <Link to={`/blog/${note.slug}`}>Read More <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </div>

 <SubscribeCard />
 </div>
 </div>
 </section>

 <InsideNotebook />
 <DiagnosticCTA />
 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
}

function ArticlePage({ article: currentArticle }) {
 const [isSaved, setIsSaved] = React.useState(false);
 const [shareStatus, setShareStatus] = React.useState("");

 React.useEffect(() => {
 if (!currentArticle || typeof window === "undefined") return;

 const saved = JSON.parse(window.localStorage.getItem("cthSavedFieldNotes") || "[]");
 setIsSaved(saved.some((item) => item.slug === currentArticle.slug));
 }, [currentArticle]);

 const handleSaveArticle = () => {
 if (!currentArticle || typeof window === "undefined") return;

 const saved = JSON.parse(window.localStorage.getItem("cthSavedFieldNotes") || "[]");
 const alreadySaved = saved.some((item) => item.slug === currentArticle.slug);

 const nextSaved = alreadySaved
 ? saved.filter((item) => item.slug !== currentArticle.slug)
 : [
 ...saved,
 {
 slug: currentArticle.slug,
 title: currentArticle.title,
 category: currentArticle.category,
 savedAt: new Date().toISOString(),
 },
 ];

 window.localStorage.setItem("cthSavedFieldNotes", JSON.stringify(nextSaved));
 setIsSaved(!alreadySaved);
 setShareStatus(alreadySaved ? "Removed from saved notes" : "Saved to this browser");

 window.setTimeout(() => setShareStatus(""), 2200);
 };

 const handleShareArticle = async () => {
 if (!currentArticle || typeof window === "undefined") return;

 const shareUrl = window.location.href;
 const shareData = {
 title: currentArticle.title,
 text: currentArticle.excerpt,
 url: shareUrl,
 };

 try {
 if (navigator.share) {
 await navigator.share(shareData);
 setShareStatus("Share opened");
 } else if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(shareUrl);
 setShareStatus("Article link copied");
 } else {
 window.prompt("Copy this article link:", shareUrl);
 setShareStatus("Copy the article link");
 }
 } catch (error) {
 if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(shareUrl);
 setShareStatus("Article link copied");
 }
 }

 window.setTimeout(() => setShareStatus(""), 2200);
 };

 if (!currentArticle) {
 return (
 <main className="fn-page">
 <PublicHeader active="journal" />
 <section className="article-hero">
 <div className="fn-shell">
 <p className="fn-eyebrow">Field Notes</p>
 <h1>Field Note not found.</h1>
 <p>The note you are looking for may have moved. Return to the Field Notes library.</p>
 <Link to="/blog" className="fn-red-btn">Back to Field Notes <span>→</span></Link>
 </div>
 </section>
 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
 }

 return (
 <main className="fn-page">
 <PublicHeader active="journal" />

 <section className="article-hero">
 <div className="fn-shell article-hero-grid">
 <div className="article-hero-copy">
 <div className="breadcrumb">
 <Link to="/">⌂</Link>
 <span>›</span>
 <Link to="/blog">Field Notes</Link>
 <span>›</span>
 <span>Brand Strategy</span>
 <span>›</span>
 <span>{currentArticle.title}</span>
 </div>

 <p className="fn-eyebrow">{currentArticle.category}</p>
 <h1>{currentArticle.title}</h1>
 <div className="fn-line" />
 <p>{currentArticle.excerpt}</p>
 </div>

 <div className="article-hero-image">
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="Core Truth House architectural columns" />
 </div>
 </div>

 <div className="article-meta-bar fn-shell">
 <div className="author-block">
 <span className="fn-mini-seal static">CTH</span>
 <div>
 <small>By Core Truth House</small>
 <strong>Editorial Team</strong>
 </div>
 </div>

 <div className="meta-item">
 <span>□</span>
 <strong>May 20, 2026</strong>
 </div>

 <div className="meta-item">
 <span>◷</span>
 <strong>{featuredArticle.read}</strong>
 </div>

 <button type="button" className={`meta-item meta-action ${isSaved ? "saved" : ""}`} onClick={handleSaveArticle}>
 <span>{isSaved ? "♥" : "♡"}</span>
 <strong>{isSaved ? "Saved" : "Save Article"}</strong>
 </button>

 <button type="button" className="meta-item meta-action" onClick={handleShareArticle}>
 <span>↗</span>
 <strong>Share</strong>
 </button>
 </div>

 {shareStatus && (
 <div className="fn-shell article-action-status" role="status" aria-live="polite">
 {shareStatus}
 </div>
 )}
 </section>

 <section className="article-body-section">
 <div className="fn-shell article-layout">
 <aside className="article-toc">
 <p className="fn-section-label">In This Article</p>
 <ul>
 {currentArticle.sections.map((section) => (
 <li key={section}>
 <span />
 <a href={`#${section.toLowerCase().replaceAll(" ", "-")}`}>{section}</a>
 </li>
 ))}
 </ul>

 <div className="toc-column-art" />
 </aside>

 <article className="article-content">
 {currentArticle.paragraphs.slice(0, 2).map((paragraph, index) => (
 <p key={`intro-${index}`}>{paragraph}</p>
 ))}

 <h2 id={currentArticle.sections[0].toLowerCase().replaceAll(" ", "-")}>{currentArticle.sections[0]}</h2>
 <p>{currentArticle.paragraphs[2]}</p>

 <blockquote>
 <span>“</span>
 <p>{currentArticle.quote}</p>
 </blockquote>

 {currentArticle.sections.slice(1, 5).map((section, index) => (
 <React.Fragment key={section}>
 <h2 id={section.toLowerCase().replaceAll(" ", "-")}>{section}</h2>
 <p>{currentArticle.paragraphs[index + 3]}</p>
 </React.Fragment>
 ))}

 <div id="a-framework-for-consistency" className="framework-box">
 <p className="framework-label">A Framework for Consistent Brands</p>
 <div className="framework-grid">
 {[
 ["Define", "Clarify your purpose, promise, and positioning."],
 ["Align", "Unify your voice, visuals, and story."],
 ["Systematize", "Build repeatable processes and standards."],
 ["Empower", "Equip your team to represent the brand well."],
 ["Sustain", "Measure, refine, and stay the course."],
 ].map(([title, text]) => (
 <div key={title}>
 <span>⌂</span>
 <strong>{title}</strong>
 <p>{text}</p>
 </div>
 ))}
 </div>
 </div>

 <p id="final-thoughts">{currentArticle.paragraphs[currentArticle.paragraphs.length - 1]}</p>
 </article>

 <aside className="article-side-rail">
 <RelatedNote currentSlug={currentArticle.slug} />
 <SubscribeCard />
 </aside>
 </div>
 </section>

 <section className="article-diagnostic fn-shell">
 <div className="fn-footer-seal">CTH</div>
 <div>
 <h2>Build a Brand That Holds</h2>
 <p>Let’s uncover the blind spots, align your systems, and build a brand that stays consistent, earns trust, and wins for the long game.</p>
 </div>
 <a href="/brand-diagnostic/">Start the Brand Diagnostic <span>→</span></a>
 </section>

 <section className="more-notes fn-shell">
 <p className="fn-section-label">More Field Notes</p>
 <div className="more-notes-grid">
 {notes.filter((note) => note.slug !== currentArticle.slug).slice(0, 3).map((note) => (
 <article className="fn-card" key={note.slug}>
 <div className="fn-card-img">
 <img src={`${A}${note.img}`} alt="" />
 <img className="fn-image-watermark small" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>
 <div className="fn-card-body">
 <p className="fn-card-category">{note.category}</p>
 <h3>{note.title}</h3>
 <div className="fn-card-meta">
 <span>May 12, 2026</span>
 <span>•</span>
 <span>{note.read}</span>
 </div>
 <Link to={`/blog/${note.slug}`}>Read More <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </section>

 <TrustedStrip />
 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
}

function RelatedNote({ currentSlug }) {
 const related = notes.find((note) => note.slug !== currentSlug) || notes[0];
 return (
 <aside className="related-note">
 <p>Related Note</p>
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="" />
 <h3>{related.title}</h3>
 <Link to={`/blog/${related.slug}`}>Read More <span>→</span></Link>
 </aside>
 );
}

function SubscribeCard() {
 return (
 <aside className="fn-subscribe">
 <img src={`${A}cth-field-notes-icon-open-book.png`} alt="" />
 <h2>Notes Worth Returning To.</h2>
 <div className="fn-gold-line" />
 <p>
 Subscribe for our thinking, articles, founder insights, and sharp opportunities delivered straight to your inbox.
 </p>

 <ul>
 <li>Founder Strategy & Mindset</li>
 <li>Brand Clarity & Messaging</li>
 <li>Systems, Growth & Execution</li>
 <li>AI, Data & Workforce</li>
 </ul>

 <form>
 <input type="email" placeholder="Enter your email" />
 <button type="button">Subscribe <span>→</span></button>
 </form>

 <small>🔒 We respect your inbox. Unsubscribe anytime.</small>
 </aside>
 );
}

function InsideNotebook() {
 const inside = [
 ["cth-field-notes-icon-binoculars.png", "Quick Observations", "Short takes on what we are seeing in the market, in brands, and in the founder journey.", "See Observations"],
 ["cth-field-notes-icon-compass.png", "Frameworks & Models", "Practical tools and strategic frameworks to help you think clearly and build better.", "Explore Frameworks"],
 ["cth-field-notes-icon-open-book.png", "Recurring Themes", "The enduring principles behind strong brands, smart systems, and sustainable growth.", "View Themes"],
 ];

 return (
 <section className="fn-inside">
 <div className="fn-shell">
 <div className="fn-inside-title">
 <span />
 <p>Inside the Notebook</p>
 <span />
 </div>

 <div className="fn-inside-grid">
 {inside.map(([icon, title, text, cta]) => (
 <article key={title}>
 <img src={`${A}${icon}`} alt="" />
 <div>
 <h3>{title}</h3>
 <p>{text}</p>
 <Link to="/blog">{cta} <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function DiagnosticCTA() {
 return (
 <section className="fn-cta">
 <div className="fn-shell fn-cta-grid">
 <div className="fn-footer-seal">CTH</div>
 <div>
 <h2>Build With Clarity. Lead With Conviction.</h2>
 <p>Get a clear-eyed assessment of your brand, messaging, systems, and growth opportunities.</p>
 </div>
 <a href="/brand-diagnostic/">Start the Brand Diagnostic <span>→</span></a>
 </div>
 </section>
 );
}


export default function BlogJournalPage() {
 const { slug } = useParams();
 const selectedArticle = slug ? notes.find((note) => note.slug === slug) : null;

 if (slug) {
 return <ArticlePage article={selectedArticle} />;
 }

 return <FieldNotesIndex />;
}

function FieldNotesStyles() {
 return (
 <style>{`
 .fn-page {
 min-height: 100vh;
 background: #fbf7f1;
 color: #241536;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 overflow-x: hidden;
 }

 .fn-shell {
 width: min(1240px, calc(100vw - 96px));
 margin: 0 auto;
 }

 .fn-eyebrow,
 .fn-section-label {
 margin: 0 0 20px;
 color: #9c1730;
 font-size: 12px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .18em;
 }

 .fn-line {
 width: 90px;
 height: 3px;
 background: #d0a24b;
 margin: 32px 0 28px;
 }

 .fn-hero {
 position: relative;
 padding: 70px 0 50px;
 }

 .fn-hero-column {
 position: absolute;
 left: -28px;
 top: 34px;
 width: 148px;
 height: 420px;
 opacity: .22;
 background: url("/about-assets/columns/cth-column-full-corinthian-blueprint.png") center/contain no-repeat;
 }

 .fn-hero-grid {
 display: grid;
 grid-template-columns: 0.8fr 1.2fr;
 align-items: center;
 gap: 48px;
 }

 .fn-hero h1 {
 margin: 0;
 max-width: 560px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: clamp(58px, 6vw, 84px);
 line-height: .94;
 letter-spacing: -.06em;
 color: #21133b;
 }

 .fn-hero-copy > p {
 max-width: 560px;
 margin: 0;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.76;
 }

 .fn-hero-art {
 display: flex;
 justify-content: flex-end;
 align-items: center;
 }

 .fn-hero-art img {
 width: min(100%, 940px);
 display: block;
 }

 .fn-proof-row {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 34px;
 margin-top: 42px;
 }

 .fn-proof-row div {
 display: grid;
 grid-template-columns: 44px 1fr;
 gap: 14px;
 align-items: center;
 }

 .fn-proof-row span {
 color: #d0a24b;
 font-size: 28px;
 }

 .fn-proof-row strong {
 color: #5a5665;
 font-size: 13px;
 line-height: 1.4;
 }

 .fn-tabs-wrap {
 padding: 22px 0;
 }

 .fn-tabs {
 display: grid;
 grid-template-columns: repeat(8, 1fr);
 border: 1px solid #ead9ca;
 border-radius: 10px;
 overflow: hidden;
 }

 .fn-tabs button {
 min-height: 54px;
 background: rgba(255,255,255,.42);
 border: 0;
 border-right: 1px solid #ead9ca;
 color: #5b5464;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .07em;
 }

 .fn-tabs button.active {
 background: #951730;
 color: #fff;
 }

 .fn-main-section {
 padding: 34px 0 54px;
 }

 .fn-featured {
 display: grid;
 grid-template-columns: 1.05fr .95fr;
 gap: 44px;
 align-items: center;
 margin-bottom: 38px;
 }

 .fn-featured-img {
 position: relative;
 height: 340px;
 overflow: hidden;
 border-radius: 5px;
 background: #160b27;
 }

 .fn-featured-img img,
 .fn-card-img img {
 width: 100%;
 height: 100%;
 object-fit: cover;
 }

 .fn-image-watermark {
 position: absolute;
 top: 12px;
 right: 12px;
 left: auto;
 width: 26px;
 height: 26px;
 padding: 2px;
 opacity: .22;
 pointer-events: none;
 z-index: 2;
 object-fit: cover;
 border-radius: 999px;
 overflow: hidden;
 background: rgba(251, 247, 241, 0.18);
 border: 1px solid rgba(208, 162, 75, 0.18);
 mix-blend-mode: multiply;
 filter: none;
 }

 .fn-image-watermark.small {
 top: 10px;
 right: 10px;
 width: 20px;
 height: 20px;
 padding: 1px;
 opacity: .18;
 }

 .fn-mini-seal {
 position: absolute;
 left: 18px;
 top: 18px;
 width: 54px;
 height: 54px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 background: #761126;
 color: #f2c46d;
 border: 3px solid #d8aa55;
 font-family: Georgia, "Times New Roman", serif;
 font-weight: 700;
 font-size: 14px;
 }

 .fn-mini-seal.small {
 width: 42px;
 height: 42px;
 font-size: 11px;
 }

 .fn-mini-seal.static {
 position: static;
 }

 .fn-featured-copy h2 {
 margin: 0 0 22px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 48px;
 line-height: 1.02;
 letter-spacing: -.05em;
 color: #21133b;
 }

 .fn-featured-copy p {
 color: #5a5665;
 line-height: 1.7;
 }

 .fn-note-meta,
 .fn-card-meta {
 display: flex;
 flex-wrap: wrap;
 gap: 12px;
 color: #806f68;
 font-size: 12px;
 margin: 22px 0;
 }

 .fn-red-btn {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 padding: 14px 22px;
 background: #951730;
 color: #fff;
 border-radius: 4px;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }
.fn-content-grid {
 display: grid;
 grid-template-columns: 1fr 270px;
 gap: 30px;
 align-items: start;
 }

 .fn-section-head {
 display: flex;
 align-items: center;
 gap: 20px;
 margin-bottom: 20px;
 }

 .fn-section-head .fn-section-label {
 margin: 0;
 }

 .fn-section-head span {
 height: 1px;
 flex: 1;
 background: #d8c3ae;
 }

 .fn-card-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 18px;
 }

 .fn-card {
 background: rgba(255,255,255,.58);
 border: 1px solid #ead9ca;
 border-radius: 6px;
 overflow: hidden;
 }

 .fn-card-img {
 position: relative;
 height: 132px;
 background: #1d1131;
 overflow: hidden;
 }

 .fn-card-img img {
 opacity: .86;
 }

 .fn-card-body {
 padding: 16px;
 }

 .fn-card-category {
 margin: 0 0 8px;
 color: #9c1730;
 font-size: 10px;
 font-weight: 900;
 letter-spacing: .12em;
 text-transform: uppercase;
 }

 .fn-card h3 {
 margin: 0 0 10px;
 color: #241536;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 19px;
 line-height: 1.12;
 }

 .fn-card p {
 color: #625d6b;
 font-size: 13px;
 line-height: 1.55;
 }

 .fn-card a {
 color: #9c1730;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-subscribe {
 background: linear-gradient(180deg, #2a123e, #170a25);
 color: #fff;
 border-radius: 9px;
 padding: 34px 28px;
 min-height: 650px;
 }

 .fn-subscribe > img {
 width: 64px;
 height: 64px;
 display: block;
 margin: 0 auto 28px;
 }

 .fn-subscribe h2 {
 margin: 0;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 36px;
 line-height: 1.08;
 text-align: center;
 }

 .fn-gold-line {
 width: 58px;
 height: 3px;
 background: #d0a24b;
 margin: 24px auto;
 }

 .fn-subscribe p,
 .fn-subscribe li,
 .fn-subscribe small {
 color: rgba(255,255,255,.72);
 line-height: 1.65;
 font-size: 13px;
 }

 .fn-subscribe ul {
 list-style: none;
 padding: 0;
 margin: 24px 0;
 }

 .fn-subscribe li {
 padding: 7px 0;
 }

 .fn-subscribe li:before {
 content: "◎";
 color: #d0a24b;
 margin-right: 8px;
 }

 .fn-subscribe input {
 width: 100%;
 height: 48px;
 box-sizing: border-box;
 border: 1px solid rgba(208,162,75,.36);
 background: transparent;
 color: white;
 border-radius: 4px;
 padding: 0 14px;
 }

 .fn-subscribe button {
 width: 100%;
 height: 50px;
 margin-top: 12px;
 border: 0;
 background: #b82038;
 color: white;
 border-radius: 4px;
 font-size: 11px;
 font-weight: 900;
 letter-spacing: .1em;
 text-transform: uppercase;
 }

 .fn-subscribe small {
 display: block;
 margin-top: 26px;
 }

 .fn-inside {
 padding: 18px 0 34px;
 }

 .fn-inside-title {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 18px;
 margin-bottom: 18px;
 }

 .fn-inside-title p {
 margin: 0;
 color: #5f4b5c;
 font-size: 14px;
 font-weight: 900;
 letter-spacing: .18em;
 text-transform: uppercase;
 }

 .fn-inside-title span {
 width: 70px;
 height: 1px;
 background: #d0a24b;
 }

 .fn-inside-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 border: 1px solid #ead9ca;
 border-radius: 9px;
 overflow: hidden;
 }

 .fn-inside-grid article {
 display: grid;
 grid-template-columns: 64px 1fr;
 gap: 22px;
 padding: 28px;
 background: rgba(255,255,255,.48);
 border-right: 1px solid #ead9ca;
 }

 .fn-inside-grid img {
 width: 58px;
 height: 58px;
 object-fit: contain;
 }

 .fn-inside-grid h3 {
 margin: 0 0 8px;
 font-family: Georgia, "Times New Roman", serif;
 color: #241536;
 font-size: 20px;
 }

 .fn-inside-grid p {
 margin: 0 0 12px;
 color: #625d6b;
 font-size: 13px;
 line-height: 1.5;
 }

 .fn-inside-grid a {
 color: #9c1730;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-cta,
 .article-diagnostic {
 background: linear-gradient(135deg, #2a123e, #170a25);
 color: #fff;
 }

 .fn-cta {
 padding: 34px 0;
 }

 .fn-cta-grid,
 .article-diagnostic {
 display: grid;
 grid-template-columns: 96px 1fr auto;
 gap: 26px;
 align-items: center;
 }

 .fn-footer-seal {
 width: 78px;
 height: 78px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 background: #761126;
 color: #f2c46d;
 border: 3px solid #d8aa55;
 font-family: Georgia, "Times New Roman", serif;
 font-weight: 700;
 font-size: 20px;
 }

 .fn-cta h2,
 .article-diagnostic h2 {
 margin: 0 0 8px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 34px;
 font-weight: 400;
 }

 .fn-cta p,
 .article-diagnostic p {
 margin: 0;
 color: rgba(255,255,255,.74);
 }

 .fn-cta a,
 .article-diagnostic a {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 min-height: 52px;
 padding: 0 28px;
 background: #e1b65f;
 color: #241536;
 border-radius: 6px;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-trusted {
 padding: 24px 0 30px;
 text-align: center;
 }

 .fn-trusted p {
 margin: 0 0 22px;
 color: #9c1730;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .16em;
 text-transform: uppercase;
 }

 .fn-trusted div {
 display: flex;
 justify-content: center;
 gap: 52px;
 flex-wrap: wrap;
 color: rgba(36,21,54,.6);
 font-family: Georgia, "Times New Roman", serif;
 font-size: 22px;
 letter-spacing: .14em;
 text-transform: uppercase;
 }

 .article-hero {
 position: relative;
 padding: 38px 0 0;
 }

 .article-hero-grid {
 display: grid;
 grid-template-columns: 0.92fr 1.08fr;
 align-items: center;
 gap: 56px;
 }

 .breadcrumb {
 display: flex;
 flex-wrap: wrap;
 gap: 10px;
 align-items: center;
 margin-bottom: 48px;
 color: #837c88;
 font-size: 11px;
 }

 .breadcrumb a {
 color: #837c88;
 text-decoration: none;
 }

 .article-hero h1 {
 margin: 0;
 max-width: 720px;
 color: #21133b;
 font-family: Georgia, "Times New Roman", serif;
 font-size: clamp(54px, 5.8vw, 82px);
 line-height: .96;
 letter-spacing: -.06em;
 }

 .article-hero-copy > p {
 max-width: 620px;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.76;
 }

 .article-hero-image {
 min-height: 390px;
 display: flex;
 align-items: center;
 justify-content: flex-end;
 overflow: hidden;
 }

 .article-hero-image img {
 width: min(100%, 760px);
 display: block;
 filter: drop-shadow(0 24px 40px rgba(36,21,54,.16));
 }

 .article-meta-bar {
 margin-top: 30px;
 display: grid;
 grid-template-columns: 1.4fr repeat(4, 1fr);
 align-items: center;
 background: rgba(255,255,255,.72);
 border: 1px solid #ead9ca;
 border-radius: 7px;
 min-height: 76px;
 }

 .author-block,
 .meta-item {
 min-height: 76px;
 display: flex;
 align-items: center;
 gap: 14px;
 padding: 0 28px;
 border-right: 1px solid #ead9ca;
 }

 .author-block small {
 display: block;
 color: #6f6874;
 font-size: 11px;
 }

 .author-block strong,
 .meta-item strong {
 display: block;
 color: #5a5362;
 font-size: 12px;
 }

 .meta-item span {
 color: #d0a24b;
 font-size: 24px;
 }

 .meta-action {
 appearance: none;
 border: 0;
 background: transparent;
 cursor: pointer;
 text-align: left;
 font-family: inherit;
 transition: background .18s ease, color .18s ease;
 }

 .meta-action:hover {
 background: rgba(149, 23, 48, .06);
 }

 .meta-action.saved span,
 .meta-action.saved strong {
 color: #951730;
 }

 .article-action-status {
 margin-top: 12px;
 color: #951730;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .08em;
 text-transform: uppercase;
 }

 .article-body-section {
 padding: 46px 0 34px;
 }

 .article-layout {
 display: grid;
 grid-template-columns: 250px minmax(0, 560px) 270px;
 gap: 42px;
 align-items: start;
 }

 .article-toc {
 position: sticky;
 top: 110px;
 }

 .article-toc ul {
 margin: 0;
 padding: 0;
 list-style: none;
 position: relative;
 }

 .article-toc ul:before {
 content: "";
 position: absolute;
 left: 6px;
 top: 8px;
 bottom: 8px;
 width: 1px;
 background: #d0a24b;
 }

 .article-toc li {
 display: grid;
 grid-template-columns: 14px 1fr;
 gap: 18px;
 margin-bottom: 24px;
 align-items: center;
 }

 .article-toc li span {
 width: 10px;
 height: 10px;
 border-radius: 999px;
 background: #d0a24b;
 position: relative;
 z-index: 2;
 }

 .article-toc a {
 color: #716978;
 text-decoration: none;
 font-size: 12px;
 font-weight: 700;
 }

 .toc-column-art {
 width: 340px;
 height: 720px;
 margin-top: 48px;
 margin-left: -78px;
 opacity: .22;
 background: url("/about-assets/columns/cth-column-full-corinthian-blueprint.png") center/contain no-repeat;
 }

 .article-content {
 border-left: 1px solid #ead9ca;
 padding-left: 42px;
 }

 .article-content > p {
 margin: 0 0 30px;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.8;
 }

 .article-content h2 {
 margin: 28px 0 10px;
 color: #35224d;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 28px;
 line-height: 1.12;
 letter-spacing: -.03em;
 }

 .article-content blockquote {
 margin: 34px 0;
 border-top: 1px solid #d8c3ae;
 border-bottom: 1px solid #d8c3ae;
 padding: 24px 24px;
 text-align: center;
 color: #6e4a5f;
 font-family: Georgia, "Times New Roman", serif;
 }

 .article-content blockquote span {
 display: block;
 color: #d0a24b;
 font-size: 44px;
 line-height: 1;
 }

 .article-content blockquote p {
 margin: 0;
 font-size: 20px;
 line-height: 1.35;
 }

 .framework-box {
 border: 1px solid #d8c3ae;
 border-radius: 8px;
 margin: 34px 0;
 padding: 24px;
 }

 .framework-label {
 margin: 0 0 20px;
 color: #5f4b5c;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .16em;
 text-transform: uppercase;
 }

 .framework-grid {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 gap: 14px;
 }

 .framework-grid div {
 text-align: center;
 border-right: 1px solid #ead9ca;
 padding: 0 8px;
 }

 .framework-grid span {
 color: #d0a24b;
 font-size: 30px;
 }

 .framework-grid strong {
 display: block;
 margin: 8px 0;
 color: #4e4058;
 font-size: 11px;
 text-transform: uppercase;
 }

 .framework-grid p {
 margin: 0;
 color: #716978;
 font-size: 11px;
 line-height: 1.4;
 }

 .article-side-rail {
 display: grid;
 gap: 28px;
 }

 .related-note {
 background: linear-gradient(180deg, #2a123e, #170a25);
 color: #fff;
 border-radius: 8px;
 padding: 22px;
 }

 .related-note > p {
 margin: 0 0 16px;
 color: rgba(255,255,255,.7);
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .12em;
 text-transform: uppercase;
 }

 .related-note img {
 width: 100%;
 height: 142px;
 object-fit: cover;
 border-radius: 7px;
 }

 .related-note h3 {
 margin: 18px 0 10px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 27px;
 line-height: 1.05;
 }

 .related-note a {
 color: #d0a24b;
 text-decoration: none;
 font-size: 12px;
 }

 .article-diagnostic {
 margin-top: 16px;
 margin-bottom: 34px;
 border-radius: 7px;
 padding: 28px 36px;
 }

 .more-notes {
 padding: 0 0 34px;
 }

 .more-notes-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 28px;
 }

 @media (max-width: 1120px) {
 .fn-shell {
 width: min(100% - 40px, 920px);
 }

 .fn-hero-grid,
 .fn-featured,
 .fn-content-grid,
 .fn-cta-grid,
 .article-hero-grid,
 .article-meta-bar,
 .article-layout,
 .article-diagnostic {
 grid-template-columns: 1fr;
 }

 .fn-card-grid,
 .more-notes-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .fn-featured-sketch,
 .article-toc {
 display: none;
 }

 .fn-subscribe {
 min-height: auto;
 }

 .framework-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .article-content {
 border-left: 0;
 padding-left: 0;
 }
 }

 @media (max-width: 680px) {
 .fn-shell {
 width: min(100% - 28px, 560px);
 }

 .fn-hero h1,
 .article-hero h1 {
 font-size: 46px;
 }

 .fn-proof-row,
 .fn-card-grid,
 .more-notes-grid {
 grid-template-columns: 1fr;
 }

 .fn-tabs {
 display: flex;
 overflow-x: auto;
 }

 .fn-tabs button {
 min-width: 150px;
 }

 .fn-trusted div {
 gap: 22px;
 font-size: 16px;
 }

 .author-block,
 .meta-item {
 border-right: 0;
 border-bottom: 1px solid #ead9ca;
 }

 .framework-grid {
 grid-template-columns: 1fr;
 }
 }
 `}</style>
 );
}
