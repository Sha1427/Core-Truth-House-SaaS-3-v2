/**
 * os-step-inputs.js
 * Core Truth House OS — Strategic OS Step Input Definitions
 *
 * Each step in the 9-step Strategic OS asks the user 2–4 targeted questions
 * before generating output. These answers are merged with Brand Memory variables
 * at generation time to produce context-specific, non-generic output.
 *
 * These inputs are stored as JSON on the OS workflow step record.
 * They are NOT stored in Brand Memory — they are generation-time context only.
 */

export const OS_STEP_INPUTS = [
  // STEP 1 — Strategic Brand and Market Analysis
  {
    stepNumber: 1,
    stepName: 'Strategic Brand and Market Analysis',
    description:
      'This step builds the strategic foundation for your entire OS run. The more honest and specific your answers, the more your output will reflect where you actually are, not where you wish you were.',
    fields: [
      {
        id: 'biggest_challenge',
        label: 'What is your biggest strategic challenge right now?',
        placeholder:
          'e.g. I get clients from referrals but nothing is converting from content. I have no idea how to position myself against competitors who charge less.',
        type: 'textarea',
        required: true,
        maxLength: 500,
        helpText: 'Be honest. This is not a pitch. It is a diagnosis.',
      },
      {
        id: 'winning_looks_like',
        label: 'What does winning look like for your brand in 12 months?',
        placeholder:
          'e.g. $15k/month in recurring revenue, a waitlist for my flagship offer, and a content engine that works without me posting every day.',
        type: 'textarea',
        required: true,
        maxLength: 400,
        helpText: 'Be specific with numbers and outcomes where possible.',
      },
      {
        id: 'current_stage',
        label: 'Where are you right now in your business?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Pre-revenue — building toward first client or sale',
          'Early stage — generating revenue but inconsistently',
          'Growth stage — consistent revenue, ready to scale',
          'Established — scaling and optimizing an existing model',
          'Rebuilding — pivoting or rebranding an existing business',
        ],
      },
    ],
  },

  // STEP 2 — Audience Psychology and Messaging Intelligence
  {
    stepNumber: 2,
    stepName: 'Audience Psychology and Messaging Intelligence',
    description:
      'This step maps the psychological landscape of your ideal client — what they fear, what they want, and what has already failed them. The output becomes the messaging intelligence layer for every content piece you create.',
    fields: [
      {
        id: 'ideal_client_sentence',
        label: 'Describe your ideal client in one sentence.',
        placeholder:
          'e.g. A service-based founder with 2–5 years in business who is generating revenue but feels invisible online and has no consistent brand strategy.',
        type: 'textarea',
        required: true,
        maxLength: 300,
        helpText: 'One person, one sentence. Resist the urge to name multiple audiences.',
      },
      {
        id: 'keeps_them_up',
        label: 'What keeps your ideal client up at night?',
        placeholder:
          'e.g. They worry that they are building something real but nobody outside their referral network knows it exists. They feel like they are starting over every month.',
        type: 'textarea',
        required: true,
        maxLength: 400,
        helpText: 'Think in their words, not your words.',
      },
      {
        id: 'already_tried',
        label: 'What have they already tried that has not worked?',
        placeholder:
          'e.g. Hiring a social media manager, buying courses on content strategy, trying to post consistently on their own. None of it produced real leads.',
        type: 'textarea',
        required: true,
        maxLength: 400,
        helpText: 'This is critical for positioning. The more specific, the better the messaging.',
      },
      {
        id: 'dream_outcome',
        label: 'What is the dream outcome your client is hiring you to achieve?',
        placeholder:
          'e.g. They want a brand that attracts clients without them having to chase. They want to feel proud of how their brand looks and sounds online.',
        type: 'textarea',
        required: true,
        maxLength: 400,
      },
    ],
  },

  // STEP 3 — Authority Positioning and Differentiation System
  {
    stepNumber: 3,
    stepName: 'Authority Positioning and Differentiation System',
    description:
      'This step defines exactly what makes you the only logical choice in your market and how to say it without sounding like everyone else. Your answers here become the core of your authority voice.',
    fields: [
      {
        id: 'known_for_now',
        label: 'What are you currently known for?',
        placeholder:
          'e.g. Brand strategy and design for small businesses. Most people come to me through referrals for logo and website work.',
        type: 'textarea',
        required: true,
        maxLength: 300,
        helpText: 'Be honest about perception, not just intention.',
      },
      {
        id: 'want_to_be_known_for',
        label: 'What do you want to be known for?',
        placeholder:
          'e.g. Building the brand strategy behind a business — the foundation and systems that make everything else compound. Not just the visuals.',
        type: 'textarea',
        required: true,
        maxLength: 300,
        helpText: 'This is your positioning north star.',
      },
      {
        id: 'why_you_not_them',
        label: 'Why would someone choose you over every other option?',
        placeholder:
          'e.g. I have 30 years of real business experience. I am not teaching from theory. I have built and rebuilt brands in real markets. My clients get strategy, not just deliverables.',
        type: 'textarea',
        required: true,
        maxLength: 400,
        helpText: 'Do not be modest here. Say the real reason.',
      },
    ],
  },

  // STEP 4 — Competitor Content Breakdown and Strategic White Space
  {
    stepNumber: 4,
    stepName: 'Competitor Content Breakdown and Strategic White Space',
    description:
      'This step analyzes what your competitors are doing so you can find the gaps they are leaving open. You do not need to know their metrics — just their patterns.',
    fields: [
      {
        id: 'additional_competitors',
        label: 'Are there any competitors you want to add that are not in your Brand Memory?',
        placeholder:
          'e.g. The Brand Therapist, Donald Miller / StoryBrand, or any local competitors in your market.',
        type: 'textarea',
        required: false,
        maxLength: 300,
        helpText: 'Optional. Leave blank if your Brand Memory competitors are complete.',
      },
      {
        id: 'what_competitors_do_well',
        label: 'What are your competitors doing well that you respect?',
        placeholder:
          'e.g. They have strong community presence, consistent posting frequency, very clear niche positioning.',
        type: 'textarea',
        required: true,
        maxLength: 400,
      },
      {
        id: 'formats_to_avoid',
        label: 'Are there any content formats or approaches you want to avoid?',
        placeholder:
          'e.g. I do not want to do vlogs, talking-head videos, or anything that feels overly casual or performative.',
        type: 'textarea',
        required: false,
        maxLength: 300,
        helpText: 'This shapes the platform strategy in Step 6.',
      },
    ],
  },

  // STEP 5 — Conversion-Oriented Content Pillars
  {
    stepNumber: 5,
    stepName: 'Conversion-Oriented Content Pillars',
    description:
      'Your content pillars are not content categories. They are strategic lanes that each serve a specific role in moving your audience from awareness to purchase. This step builds them around your actual offer and your audience’s decision journey.',
    fields: [
      {
        id: 'lead_pillar',
        label: 'Which type of content do you want to lead with right now?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Authority — position me as the expert in my space',
          'Education — teach my audience something they do not know',
          'Trust — show proof, results, and behind-the-scenes reality',
          'Transformation — show before and after, journey and outcome',
          'Community — build belonging and shared identity',
        ],
        helpText: 'Pick the one that matches your current growth priority.',
      },
      {
        id: 'primary_cta',
        label: 'What is your primary call to action right now?',
        placeholder:
          'e.g. Book a Brand Audit, join the waitlist, download the free guide, DM me the word BRAND.',
        type: 'text',
        required: true,
        maxLength: 150,
        helpText: 'Your pillars will be built to funnel toward this.',
      },
      {
        id: 'content_goal',
        label: 'What is the most important thing your content needs to do right now?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Build awareness — more people need to know I exist',
          'Build trust — people know me but are not buying yet',
          'Drive leads — I need inquiries and bookings',
          'Retain and upsell — I need existing clients to come back',
          'Establish authority — I need to be seen as the expert',
        ],
      },
    ],
  },

  // STEP 6 — Platform-Specific Adaptation Engine
  {
    stepNumber: 6,
    stepName: 'Platform-Specific Adaptation Engine',
    description:
      'The same message lands differently on every platform. This step adapts your strategy to fit how your audience actually consumes content where they spend their time.',
    fields: [
      {
        id: 'priority_platform',
        label: 'Which platforms are your priority?',
        placeholder: '',
        type: 'multiselect',
        required: true,
        options: [
          'Instagram',
          'LinkedIn',
          'TikTok',
          'Facebook',
          'YouTube',
          'X / Twitter',
          'Threads',
          'Pinterest',
          'Podcast',
          'Email / Newsletter',
          'Blog / SEO',
        ],
        helpText: 'Select all platforms you want to focus on.',
      },
      {
        id: 'primary_format',
        label: 'What content format do you post most or want to post most?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Written posts / carousels',
          'Short-form video (Reels, TikTok, Shorts)',
          'Long-form video (YouTube)',
          'Audio / Podcast',
          'Live video',
          'Stories / Ephemeral content',
          'Mixed — I want to test multiple formats',
        ],
      },
      {
        id: 'posting_capacity',
        label: 'How many times per week can you realistically post?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          '1 time per week',
          '2–3 times per week',
          '4–5 times per week',
          'Daily',
          'Multiple times per day',
        ],
        helpText: 'Be honest. A sustainable cadence always outperforms an ambitious one you abandon.',
      },
    ],
  },

  // STEP 7 — 30-Day Strategic Content Plan
  {
    stepNumber: 7,
    stepName: '30-Day Strategic Content Plan',
    description:
      'This step maps your monthly execution plan from the strategy you already built. Your answers help the OS connect your pillars, platform focus, business calendar, and monthly growth goal.',
    fields: [
      {
        id: 'business_events',
        label: 'What is happening in your business this month?',
        placeholder:
          'e.g. I am launching my Brand Audit offer mid-month. I have a speaking engagement in week 3. End of month is my enrollment close for my group program.',
        type: 'textarea',
        required: false,
        maxLength: 400,
        helpText:
          'Leave blank if nothing specific is planned. The OS will build a standard awareness and lead-gen month.',
      },
      {
        id: 'content_month_goal',
        label: 'What is the single most important outcome for your content this month?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Generate leads and inquiries for my offer',
          'Build audience and grow reach',
          'Warm up a cold audience before a launch',
          'Re-engage an existing audience that has gone quiet',
          'Establish authority in a new niche or positioning',
          'Support an active launch or promotion',
        ],
      },
      {
        id: 'avoid_this_month',
        label: 'Is there anything you want to avoid in your content this month?',
        placeholder:
          'e.g. No discount messaging, no overly personal posts, no content that feels salesy. I want to lead with value first.',
        type: 'textarea',
        required: false,
        maxLength: 300,
      },
    ],
  },

  // STEP 8 — Hero Content Builder
  {
    stepNumber: 8,
    stepName: 'Hero Content Builder',
    description:
      'This step turns your strategy into one strong hero content asset using your brand voice, pillar strategy, platform choice, and selected hook angle. Your answers guide the asset before the AI drafts it.',
    fields: [
      {
        id: 'post_pillar',
        label: 'Which content pillar should this post come from?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Pillar 1 — from my strategy (auto-fill from Step 5)',
          'Pillar 2 — from my strategy (auto-fill from Step 5)',
          'Pillar 3 — from my strategy (auto-fill from Step 5)',
          'Pillar 4 — from my strategy (auto-fill from Step 5)',
          'Pillar 5 — from my strategy (auto-fill from Step 5)',
        ],
        helpText: 'After Step 5 is complete, these labels can update to your actual pillar names.',
      },
      {
        id: 'hook_angle',
        label: 'What hook angle do you want for this post?',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Pain — call out the exact problem my audience is living with',
          'Desire — paint the picture of what they want',
          'Curiosity — make them need to know what comes next',
          'Contrast — challenge a belief they hold about their situation',
          'Proof — show a result or transformation',
          'Confession — share something raw and real that builds trust',
        ],
      },
      {
        id: 'post_platform',
        label: 'Which platforms is this post for?',
        placeholder: '',
        type: 'multiselect',
        required: true,
        options: [
          'Instagram caption',
          'LinkedIn post',
          'TikTok / Reel script',
          'Twitter / X thread',
          'Facebook post',
          'Threads',
          'Email subject line + preview text',
        ],
      },
      {
        id: 'specific_direction',
        label: 'Any specific direction or topic for this post? (optional)',
        placeholder:
          'e.g. I want it to be about why branding is not the logo. Or focus it on a client result from last month.',
        type: 'textarea',
        required: false,
        maxLength: 300,
      },
    ],
  },

  // STEP 9 — Monetization and Audience Conversion Strategy
  {
    stepNumber: 9,
    stepName: 'Monetization and Audience Conversion Strategy',
    description:
      'This final step builds your conversion architecture — the path from content to revenue. It maps your offer ladder, your audience’s buying readiness, and the specific moves you need to make to close the gap between attention and income.',
    fields: [
      {
        id: 'revenue_goal_quarter',
        label: 'What is your primary revenue goal this quarter?',
        placeholder:
          'e.g. $25,000 in total revenue, or 5 new Brand OS clients at $5,000 each.',
        type: 'textarea',
        required: true,
        maxLength: 300,
        helpText: 'Specific numbers produce specific strategy.',
      },
      {
        id: 'offer_to_push',
        label: 'Which offer do you want to prioritize in this quarter?',
        placeholder:
          'e.g. My Brand Audit at $500 as the entry point, funneling into the Brand OS at $5,000.',
        type: 'textarea',
        required: true,
        maxLength: 300,
        helpText: 'Name the offer and the price point.',
      },
      {
        id: 'conversion_gap',
        label: 'Where does your audience drop off before buying?',
        placeholder: '',
        type: 'multiselect',
        required: true,
        options: [
          'They do not know I have an offer — awareness is missing',
          'They know about the offer but do not take the next step',
          'They inquire but do not convert on the sales call',
          'They buy once but do not come back or refer',
          'I am not sure — I do not have enough data yet',
        ],
        helpText: 'Select all that apply. This shapes whether the strategy focuses on reach, trust, or conversion.',
      },
      {
        id: 'willing_to_do',
        label: 'What conversion actions are you willing to take?',
        placeholder: '',
        type: 'multiselect',
        required: true,
        options: [
          'Direct outreach to warm leads',
          'Sales calls or strategy sessions',
          'Free training or webinar as a lead magnet',
          'Limited-time offer or enrollment window',
          'Referral or affiliate program',
          'Content-only — I want to convert through content without direct selling',
        ],
      },
    ],
  },
];

/**
 * Get the input config for a specific step number (1–9)
 */
export function getStepInputConfig(stepNumber) {
  return OS_STEP_INPUTS.find((s) => s.stepNumber === stepNumber) || null;
}

/**
 * Validate that all required fields in a step are filled.
 * Returns an array of missing field IDs.
 */
export function validateStepInputs(stepNumber, inputs = {}) {
  const config = getStepInputConfig(stepNumber);
  if (!config) return [];

  const missing = [];

  for (const field of config.fields) {
    if (!field.required) continue;

    const value = inputs[field.id];

    if (field.type === 'multiselect') {
      if (!Array.isArray(value) || value.length === 0) {
        missing.push(field.id);
      }
      continue;
    }

    if (typeof value === 'string') {
      if (!value.trim()) missing.push(field.id);
      continue;
    }

    if (value === null || value === undefined || value === '') {
      missing.push(field.id);
    }
  }

  return missing;
}

/**
 * Format step inputs as a readable prompt block.
 * Called inside the generation route to inject user answers into the prompt.
 */
export function formatStepInputsForPrompt(stepNumber, inputs = {}) {
  const config = getStepInputConfig(stepNumber);
  if (!config) return '';

  const lines = [
    `--- USER CONTEXT FOR STEP ${stepNumber}: ${config.stepName.toUpperCase()} ---`,
  ];

  for (const field of config.fields) {
    const val = inputs[field.id];
    if (!val || (Array.isArray(val) && val.length === 0)) continue;

    const display = Array.isArray(val) ? val.join(', ') : String(val);
    lines.push(`${field.label}\n${display}`);
  }

  lines.push('--- END USER CONTEXT ---');
  return lines.join('\n\n');
}
