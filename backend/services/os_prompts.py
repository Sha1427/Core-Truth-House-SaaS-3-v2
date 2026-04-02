"""OS Workflow prompts — All 9 Strategic OS Step prompts."""

STEP_NAMES = {
    1: "Strategic Brand and Market Analysis",
    2: "Audience Psychology and Messaging Intelligence",
    3: "Authority Positioning and Differentiation System",
    4: "Competitor Content Breakdown and Strategic White Space",
    5: "Conversion-Oriented Content Pillars",
    6: "Platform-Specific Adaptation Engine",
    7: "30-Day Strategic Content Plan",
    8: "Scroll-Stopping Post Generator",
    9: "Monetization and Audience Conversion Strategy",
}

STEP_DESCRIPTIONS = {
    1: "Build the strategic foundation — market opportunity, competitive gaps, positioning, and platform priorities.",
    2: "Map your audience psychology — triggers, objections, messaging angles, hook themes, and trust builders.",
    3: "Design your authority positioning — category ownership, signature frameworks, and differentiation system.",
    4: "Find your white space — what competitors are missing and how to own the angles they ignore.",
    5: "Build 5 conversion-oriented content pillars with post ideas, formats, and offer bridges.",
    6: "Adapt your strategy per platform — native content, repurposing workflow, and platform priorities.",
    7: "Generate a 30-day strategic content plan with intentional sequencing and narrative arc.",
    8: "Write scroll-stopping posts with alternative hooks, CTAs, and strategic rationale.",
    9: "Build your monetization roadmap — follower-to-customer journey, funnel, and revenue strategy.",
}

FULL_OS_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
FAST_START_STEPS = [1, 2, 3, 5, 7, 9]

QC_BLOCK = """
---
QUALITY CONTROL CONSTRAINTS — APPLY BEFORE FINALIZING:
- Do not give generic advice
- Do not repeat obvious best practices unless strategically relevant
- Be specific and decisive
- Prioritize differentiation, clarity, and practical usefulness
- If an assumption is weak, say so explicitly
- Show where the strategy could fail
- Favor depth over breadth

Before finalizing, pressure-test your recommendations for vagueness, generic language, weak differentiation, poor monetization logic, and lack of audience specificity. Then refine the answer.
"""


def _inject(template: str, v: dict) -> str:
    result = template
    for key, value in v.items():
        result = result.replace(f"[{key}]", value or "Not specified")
    return result


def _context_lock(prior: str) -> str:
    if not prior:
        return ""
    return f"""Use the conclusions below as fixed strategic context. Do not contradict them unless you identify a serious flaw and explain why clearly.

--- PRIOR STRATEGIC CONTEXT (LOCKED) ---
{prior}
--- END PRIOR CONTEXT ---

"""


def get_step_prompt(step: int, variables: dict, prior_context: str = "", extra: dict = None) -> str:
    """Get the prompt for a given step number."""
    extra = extra or {}
    lock = _context_lock(prior_context) if step > 1 else ""

    if step == 1:
        return _inject(_STEP_1, variables) + QC_BLOCK
    elif step == 2:
        return lock + _inject(_STEP_2, variables) + QC_BLOCK
    elif step == 3:
        return lock + _inject(_STEP_3, variables) + QC_BLOCK
    elif step == 4:
        return lock + _inject(_STEP_4, variables) + QC_BLOCK
    elif step == 5:
        return lock + _inject(_STEP_5, variables) + QC_BLOCK
    elif step == 6:
        return lock + _inject(_STEP_6, variables) + QC_BLOCK
    elif step == 7:
        return lock + _inject(_STEP_7, variables) + QC_BLOCK
    elif step == 8:
        topic = extra.get("topic", "Brand positioning")
        platform = extra.get("platform", "Instagram")
        goal = extra.get("goal", "AUTHORITY")
        tmpl = _STEP_8.replace("${topic}", topic).replace("${platform}", platform).replace("${goal}", goal)
        return lock + _inject(tmpl, variables) + QC_BLOCK
    elif step == 9:
        return lock + _inject(_STEP_9, variables) + QC_BLOCK
    return ""


_STEP_1 = """Act as a senior social media growth strategist and brand advisor.
Your job is to analyze this business and create a strategic foundation for social media growth.

Business context:
- Brand name: [BRAND_NAME]
- Business description: [BUSINESS_DESCRIPTION]
- Niche: [NICHE]
- Primary offer: [PRIMARY_OFFER]
- Secondary offers: [SECONDARY_OFFERS]
- Target audience: [TARGET_AUDIENCE]
- Main audience problem: [AUDIENCE_PROBLEM]
- Main audience desire: [AUDIENCE_DESIRE]
- Brand strengths: [BRAND_STRENGTHS]
- Founder background: [FOUNDER_BACKGROUND]
- Unique mechanism: [UNIQUE_MECHANISM]
- Competitors: [COMPETITOR_1], [COMPETITOR_2], [COMPETITOR_3]
- Platforms: [PLATFORMS]
- Current content approach: [CURRENT_CONTENT_APPROACH]
- Growth goal: [GROWTH_GOAL]
- Revenue goal: [REVENUE_GOAL]
- Brand voice: [BRAND_VOICE]
- Geography: [GEOGRAPHY_OR_MARKET]
- Constraints: [CONSTRAINTS]

Deliver in these exact sections:
1. Executive Summary
2. Brand Opportunity in the Market
3. Audience-Market Fit Assessment
4. Competitive Gap Analysis
5. Positioning Opportunities
6. Platform Recommendations by Priority
7. Top 5 Strategic Risks or Blind Spots
8. Top 5 Strategic Advantages to Exploit

End with: A one-sentence positioning statement, three strategic directions (A, B, C), and a "What Must Be True" checklist."""

_STEP_2 = """Act as a behavioral psychologist, buyer psychology expert, and messaging strategist.
Build a deep audience psychology breakdown.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Offer: [PRIMARY_OFFER]
- Audience: [TARGET_AUDIENCE] | Problem: [AUDIENCE_PROBLEM] | Desire: [AUDIENCE_DESIRE]
- Voice: [BRAND_VOICE] | Geography: [GEOGRAPHY_OR_MARKET]

Sections: 1. Core Identity 2. Visible Frustrations 3. Hidden Frustrations 4. Top Desires 5. Fears and Resistance 6. Common Objections 7. What They're Tired of Hearing 8. Content They Engage With 9. Language They Use 10. What Builds Trust

Then: 10 Messaging Angles, 10 Hook Themes, 10 Trust-Building Themes, 5 Polarizing Angles, and Messaging Mistakes to Avoid (5+)."""

_STEP_3 = """Act as a category-positioning strategist and personal brand authority expert.
Develop a positioning strategy.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Founder: [FOUNDER_BACKGROUND]
- Strengths: [BRAND_STRENGTHS] | Differentiator: [UNIQUE_MECHANISM]
- Competitors: [COMPETITOR_1], [COMPETITOR_2], [COMPETITOR_3]
- Voice: [BRAND_VOICE] | Audience: [TARGET_AUDIENCE]

Sections: 1. Category to Own 2. Positioning Statement 3. Unique POV 4. Industry Myths to Challenge (4+) 5. Three Signature Frameworks 6. Credibility Drivers 7. Personality Traits 8. Authority Signals

Then: Go-to-Market Reputation Summary, 5 Examples of How Brand Should Sound, 5 Examples of How Not, and Positioning Test Criteria."""

_STEP_4 = """Act as a competitive content strategist.
Evaluate competitor patterns and find white space.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Audience: [TARGET_AUDIENCE]
- Offer: [PRIMARY_OFFER] | Competitors: [COMPETITOR_1], [COMPETITOR_2], [COMPETITOR_3]

Sections: 1. Common Competitor Themes 2. Common Positioning Patterns 3. Where Competitors Blend 4. What They Overemphasize 5. What They Neglect 6. Underserved Angles 7. Three White-Space Opportunities 8. Three Ways to Be Different

Then: Copy This / Avoid This Table (8+ rows each), 10 Differentiation Ideas."""

_STEP_5 = """Act as a social media content strategist focused on growth and conversion.
Create 5 content pillars.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Audience: [TARGET_AUDIENCE]
- Offer: [PRIMARY_OFFER] | Problem: [AUDIENCE_PROBLEM] | Desire: [AUDIENCE_DESIRE]
- Positioning: [UNIQUE_MECHANISM] | Voice: [BRAND_VOICE]
- Growth: [GROWTH_GOAL] | Revenue: [REVENUE_GOAL]

For each pillar: 1. Name 2. Strategic Purpose 3. Psychological Resonance 4. Buyer Journey Stage 5. Best Formats 6. 10 Post Ideas 7. Mistakes to Avoid 8. Offer Bridge

Then: Recommended Mix %, Growth-Dominant Pillar, Monetization-Dominant Pillar."""

_STEP_6 = """Act as a platform-specific content strategist.
Adapt strategy for: [PLATFORMS].

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Audience: [TARGET_AUDIENCE]
- Offer: [PRIMARY_OFFER] | Voice: [BRAND_VOICE]
- Growth: [GROWTH_GOAL] | Revenue: [REVENUE_GOAL]

Per platform: 1. What Audience Wants There 2. Best Formats 3. Best Tone 4. What to Repurpose 5. What's Native Only 6. Biggest Mistake 7. Growth vs Trust vs Conversion Usage

Then: Platform Priority Ranking, Repurposing Workflow."""

_STEP_7 = """Act as a senior content strategist.
Create a 30-day content plan using the strategy and pillars from prior context.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Audience: [TARGET_AUDIENCE]
- Platforms: [PLATFORMS] | Offer: [PRIMARY_OFFER] | Voice: [BRAND_VOICE]
- Growth: [GROWTH_GOAL] | Revenue: [REVENUE_GOAL]

Per day: 1. Day # 2. Topic 3. Format 4. Hook Concept 5. Core Message 6. Emotion/Tension 7. Goal (REACH/AUTHORITY/TRUST/LEADS/CONVERSION) 8. CTA Type 9. Why This Post

Include: 8+ reach, 6+ trust, 4+ proof, 4+ objection, 4+ offer-adjacent, 4+ conversion posts.

End with: Monthly Narrative Arc, Top 5 Growth Posts, Top 5 Revenue Posts."""

_STEP_8 = """Act as an elite social media copywriter.
Write a high-performing post.

Context:
- Brand: [BRAND_NAME] | Niche: [NICHE] | Audience: [TARGET_AUDIENCE]
- Voice: [BRAND_VOICE] | CTA: [CALL_TO_ACTION_PREFERENCE] | Offer: [PRIMARY_OFFER]
- Topic: ${topic} | Goal: ${goal} | Platform: ${platform}

Requirements: Compelling hook, strong insight/opinion/story, easy to read, aligned CTA.

After the post: 5 Alternative Hooks, 3 CTA Variations, Why This Works (2-3 sentences)."""

_STEP_9 = """Act as a digital monetization strategist and customer journey designer.
Build a monetization strategy.

Context:
- Brand: [BRAND_NAME] | Offer: [PRIMARY_OFFER] | Secondary: [SECONDARY_OFFERS]
- Audience: [TARGET_AUDIENCE] | Problem: [AUDIENCE_PROBLEM] | Desire: [AUDIENCE_DESIRE]
- Price: [PRICE_POINT] | Sales Model: [SALES_MODEL]
- Content: [CURRENT_CONTENT_APPROACH] | Revenue: [REVENUE_GOAL] | Platforms: [PLATFORMS]

Sections: 1. Follower-to-Customer Journey 2. Funnel Stages 3. Offer Ladder 4. Pricing Logic 5. Lead Magnet Ideas (3-5) 6. Content by Funnel Stage 7. Pre-Purchase Objections 8. CTA Strategy by Stage 9. Launch vs Evergreen 10. Monetization Risks

End with: Monetization Roadmap (Month 1, 2-3, 4-6), Fastest Path to Revenue, Most Scalable Path."""

