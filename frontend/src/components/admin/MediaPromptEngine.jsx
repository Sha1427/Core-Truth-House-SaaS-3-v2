/**
 * MediaPromptEngine.jsx  — v2
 * Core Truth House OS — Combined Media Prompt Engine
 *
 * Combines all five frameworks:
 *
 *  IMAGE FRAMEWORKS
 *   1. 6 Pillar Shot Structure
 *      (Subject, Environment, Lighting, Wardrobe/Style, Camera, Emotion)
 *   2. Luxury Branding Photoshoot Formula
 *      (Subject, Role/Identity, Environment, Action/Pose, Lighting, Camera Quality)
 *   3. AI Twin System — Model ID for consistent personal brand identity
 *
 *  VIDEO FRAMEWORKS
 *   4. 6-Part Video Prompt Structure
 *      (Subject, Environment, Action/Movement, Camera Motion, Lighting/Mood, Style/Quality)
 *
 *  PROMPT LIBRARY
 *   5. The 12 Viral AI Photoshoot Concepts
 *
 * Named exports:
 *   buildImagePrompt(campaign, item, brandMemory, modelId?)
 *   buildBrandPhotoshootPrompt(modelId, campaign, item, brandMemory)
 *   buildVideoPrompt(campaign, item, brandMemory)
 *   buildMediaPrompt(campaign, item, brandMemory, modelId?)
 *   AI_TWIN_SYSTEM
 *   PROMPT_LIBRARY
 *   PromptBuilderPanel  (React component)
 */

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// BRAND CONSTANTS
// ─────────────────────────────────────────────────────────────

var CTH_PALETTE = {
  primary:    'var(--cth-brand-primary)',
  secondary:  'var(--cth-admin-accent)',
  accent:     'var(--cth-admin-muted)',
  dark:       'var(--cth-brand-primary-deep)',
  ruby:       'var(--cth-admin-ruby)',
  background: 'var(--cth-brand-primary-deep)',
  gold:       'var(--cth-brand-secondary)',
}

var CTH_ANTI_PATTERNS = [
  'no generic stock photography',
  'no bright white backgrounds',
  'no smiling people looking directly at camera',
  'no obvious corporate clip-art imagery',
  'no flat lighting',
  'this brand is built deep, not loud',
].join(', ')

var CTH_CAMERA_QUALITY = 'ultra realistic, DSLR photography, cinematic editorial photography, shallow depth of field, 8k detail'

// ─────────────────────────────────────────────────────────────
// PHASE MAPS (used by both image + video builders)
// ─────────────────────────────────────────────────────────────

var PHASE_EMOTION = {
  awareness: 'thought-provoking calm, the moment before realisation, contemplative authority',
  education: 'authoritative confidence, structured intelligence, editorial precision',
  authority: 'earned power, quiet confidence, the calm certainty of someone who has done the work',
  promotion: 'decisive momentum, transformational urgency, the energy of someone who has made the choice',
}

var PHASE_LIGHTING = {
  awareness: 'dramatic side-lighting with deep shadows and a single focused beam of warm light',
  education: 'soft diffused daylight, clean editorial studio lighting, professional clarity',
  authority: 'rich golden hour warmth, cinematic chiaroscuro, luxury depth',
  promotion: 'high-contrast dramatic lighting, bold shadows, strong directional light, cinematic tension',
}

var PHASE_CAMERA_IMAGE = {
  awareness: 'wide establishing shot, deep perspective, slight low angle to create scale, 35mm',
  education: 'editorial medium shot, clean composition, rule of thirds, 85mm equivalent',
  authority: 'close-up portrait, 85mm, shallow depth of field, power framing, slight low angle',
  promotion: 'dynamic low angle power shot, bold composition, 24-35mm cinematic portrait framing',
}

var PHASE_ACTION = {
  awareness: 'pausing mid-thought, looking out a window with quiet intensity',
  education: 'writing in a journal at a luxury desk, reviewing strategy documents with focused attention',
  authority: 'standing confidently at floor-to-ceiling windows overlooking a city skyline',
  promotion: 'walking purposefully forward, closing a laptop with determination, turning to face camera',
}

var PHASE_CAMERA_VIDEO = {
  awareness: 'slow push-in from a distance, revealing the scene gradually',
  education: 'steady tracking shot alongside the subject, slow and deliberate',
  authority: 'slow dolly arc circling the subject, revealing the city skyline behind them',
  promotion: 'tracking shot moving toward the subject with intention, or slow zoom forward',
}

var FORMAT_COMPOSITION = {
  'Instagram Caption':  '1:1 square, editorial composition, strong central focal point',
  'Reel Hook':          '9:16 vertical, cinematic first frame, bold visual contrast, space for text overlay',
  'Carousel Outline':   '1:1 square, clean consistent background for series, minimal composition',
  'Email Newsletter':   '16:9 wide banner, horizontal editorial layout, professional letterbox',
  'Blog Post':          '16:9 wide hero, editorial photography, aspirational yet grounded',
  'Thread':             '1:1 or 4:5, minimal clean aesthetic, text-forward design space',
  'Ad Copy':            'bold high-contrast, single dominant focal point, clear visual hierarchy',
  'Sales Page':         '16:9 wide aspirational hero, transformation-focused, luxury editorial',
}

var FORMAT_WARDROBE = {
  'Instagram Caption':  'tailored luxury workwear, brand palette colors, polished accessories',
  'Reel Hook':          'bold statement piece — minimal all-black or signature brand color outfit',
  'Email Newsletter':   'professional elevated business attire, refined jewelry, brand palette',
  'Blog Post':          'editorial fashion — casual luxury or formal, tells a story',
  'Ad Copy':            'high-impact visual clothing, bold silhouette, premium brand alignment',
  'Sales Page':         'aspirational luxury attire — the transformation embodied in clothing',
}

// ─────────────────────────────────────────────────────────────
// FRAMEWORK 1 — 6 PILLAR SHOT STRUCTURE (Editorial/Cinematic)
// ─────────────────────────────────────────────────────────────

/**
 * buildImagePrompt
 * Uses the 6 Pillar Shot Structure.
 * Best for: editorial brand imagery, campaign content, non-portrait assets.
 *
 * @param campaign     campaign object from Campaign Builder
 * @param item         content plan item (has type, format, platform, topic)
 * @param brandMemory  { colors, voice }
 * @param modelId      optional — if set, prefixes with Model ID for AI Twin consistency
 */
export function buildImagePrompt(campaign, item, brandMemory, modelId) {
  brandMemory = brandMemory || {}
  var phase       = item.contentType || 'awareness'
  var format      = item.contentFormat || item.format || 'Instagram Caption'
  var platform    = item.contentPlatform || item.platform || 'Instagram'
  var topic       = item.contentTopic || item.topic || ''
  var palette     = (brandMemory.colors || Object.values(CTH_PALETTE).slice(0, 4)).join(', ')
  var modelPrefix = modelId ? 'Photoshoot of ' + modelId + '. ' : ''

  var subject     = topic
    ? modelPrefix + 'Brand visual for: "' + topic + '"'
    : modelPrefix + 'A luxury brand environment representing ' + (campaign.offerName || 'the brand')

  var environment = 'luxury high-rise workspace or editorial brand environment, deep aubergine and crimson tones, architectural depth, warm ambient lighting'
  var lighting    = PHASE_LIGHTING[phase] || PHASE_LIGHTING.awareness
  var wardrobe    = (FORMAT_WARDROBE[format] || FORMAT_WARDROBE['Instagram Caption']) + '. Brand palette: ' + palette
  var camera      = (FORMAT_COMPOSITION[format] || FORMAT_COMPOSITION['Instagram Caption']) + ', ' + (PHASE_CAMERA_IMAGE[phase] || PHASE_CAMERA_IMAGE.awareness)
  var emotion     = PHASE_EMOTION[phase] || PHASE_EMOTION.awareness

  return [
    '━━ IMAGE PROMPT — 6 PILLAR SHOT STRUCTURE ━━',
    '',
    '🎭 PILLAR 1 — SUBJECT',       subject,
    '',
    '🌿 PILLAR 2 — ENVIRONMENT',   environment,
    '',
    '💡 PILLAR 3 — LIGHTING',      lighting,
    '',
    '👗 PILLAR 4 — WARDROBE / STYLE', wardrobe,
    '',
    '📸 PILLAR 5 — CAMERA & COMPOSITION', camera,
    '',
    '⚡ PILLAR 6 — EMOTION / ENERGY',    emotion,
    '',
    '━━ CAMPAIGN CONTEXT ━━',
    'Campaign: ' + campaign.name,
    'Message: '  + (campaign.emotionalHook || ''),
    'Phase: '    + phase + ' · Platform: ' + platform,
    '',
    CTH_ANTI_PATTERNS,
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────
// FRAMEWORK 2 — LUXURY BRANDING PHOTOSHOOT FORMULA
// ─────────────────────────────────────────────────────────────

/**
 * buildBrandPhotoshootPrompt
 * Uses the Luxury Branding Photoshoot Formula.
 * Formula: Subject + Role/Identity + Environment + Action/Pose + Lighting + Camera Quality
 * Best for: founder portraits, CEO shots, personal brand authority photos.
 *
 * @param modelId      AI Twin Model ID (e.g. 'Dynasty Model 01') — or null for generic
 * @param campaign     campaign object (provides context for action/scene)
 * @param item         content plan item
 * @param brandMemory  { colors, founderDescription, role }
 */
export function buildBrandPhotoshootPrompt(modelId, campaign, item, brandMemory) {
  brandMemory = brandMemory || {}
  var phase   = item.contentType || 'authority'

  // Part 1 — Subject
  var subject = modelId
    ? 'Photoshoot of ' + modelId
    : 'Ultra realistic branding photoshoot of a ' + (brandMemory.founderDescription || 'elegant, confident entrepreneur')

  // Part 2 — Role / Authority Position
  var role = brandMemory.role || 'brand strategist, CEO, and founder'

  // Part 3 — Luxury Environment
  var envMap = {
    awareness: 'a luxury penthouse office with floor-to-ceiling windows overlooking a city skyline',
    education: 'a premium home office with marble surfaces, bookshelves, and warm architectural lighting',
    authority: 'a skyline corner office with glass walls, marble desk, and city panorama',
    promotion: 'an elegant lobby or rooftop terrace overlooking the city at golden hour',
  }
  var environment = envMap[phase] || envMap.authority

  // Part 4 — Action / Pose (Brand Behavior)
  var actionMap = {
    awareness: 'standing beside a marble desk, looking thoughtfully out the window with quiet intensity',
    education: 'seated at a marble desk reviewing notes in a leather planner while working on a laptop',
    authority: 'standing confidently behind a marble desk in a power pose, direct and commanding presence',
    promotion: 'walking confidently through the office or standing at the window looking toward the horizon',
  }
  var action = actionMap[phase] || actionMap.authority

  // Part 5 — Lighting
  var lighting = PHASE_LIGHTING[phase] || PHASE_LIGHTING.authority

  // Part 6 — Camera Quality
  var camera = CTH_CAMERA_QUALITY

  return [
    '━━ BRAND PHOTOSHOOT PROMPT — LUXURY FORMULA ━━',
    '',
    '👤 PART 1 — SUBJECT',         subject,
    '',
    '🏆 PART 2 — ROLE / IDENTITY', role,
    '',
    '🏛 PART 3 — LUXURY ENVIRONMENT', environment,
    '',
    '🤲 PART 4 — ACTION / POSE',   action,
    '',
    '💡 PART 5 — LIGHTING STYLE',  lighting,
    '',
    '📷 PART 6 — CAMERA QUALITY',  camera,
    '',
    '━━ BRAND CONTEXT ━━',
    'Campaign: '      + campaign.name,
    'Core message: '  + (campaign.emotionalHook || ''),
    'Offer: '         + (campaign.offerName || ''),
    '',
    CTH_ANTI_PATTERNS,
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────
// FRAMEWORK 3 — AI TWIN SYSTEM
// ─────────────────────────────────────────────────────────────

/**
 * AI_TWIN_SYSTEM
 * The Model ID framework for consistent personal brand identity.
 * Reference: The AI Twin Luxury Content System
 *
 * Formula: Reference Image + Model ID + Cinematic Prompt = Unlimited Brand Photos
 */
export var AI_TWIN_SYSTEM = {

  /**
   * Step 1 instructions: what photos to upload to create the AI Twin
   */
  setupInstructions: [
    'Upload 3-5 clear photos of yourself:',
    '  • Front-facing portrait with professional lighting',
    '  • Slight side angle shot',
    '  • Smiling portrait (natural expression)',
    '  • Neutral expression close-up',
    '  • Professional or semi-professional lighting for all',
    '',
    'Then tell the AI:',
    '"Use this image as the reference model. Keep the same facial features,',
    'skin tone, and face structure exactly the same."',
  ].join('\n'),

  /**
   * buildModelIdPrompt — wraps any prompt with the Model ID prefix
   * @param modelId  e.g. 'CTH Brand Model 01'
   * @param scene    the scene/prompt string
   */
  buildModelIdPrompt: function(modelId, scene) {
    return 'Photoshoot of ' + modelId + '. ' + scene
  },

  /**
   * generateModelSetupPrompt — the identity lock prompt
   * @param modelId  the name to assign the model
   */
  generateModelSetupPrompt: function(modelId) {
    return [
      'This model is called ' + modelId + '.',
      'Use this face for all future images.',
      'Keep the same facial features, skin tone, face structure, and identity exactly the same.',
      'This is the only face to be used across all photoshoot scenes.',
    ].join(' ')
  },

  /**
   * Content categories for the AI Twin System
   */
  contentCategories: {
    authority: {
      label: 'Authority Photos',
      description: 'CEO portraits — command presence',
      ratio: '40%',
      sceneTemplate: function(modelId) {
        return 'Photoshoot of ' + modelId + ' standing confidently in a luxury office with skyline windows, wearing a tailored power suit, cinematic lighting, ultra realistic, 8k'
      },
    },
    work: {
      label: 'Work Photos',
      description: 'Laptop / planner / strategy — shows real work',
      ratio: '30%',
      sceneTemplate: function(modelId) {
        return 'Photoshoot of ' + modelId + ' working on a laptop at a marble desk with planner and coffee, skyline office background, natural daylight, editorial photography'
      },
    },
    lifestyle: {
      label: 'Lifestyle Photos',
      description: 'Freedom and success — the reward of the work',
      ratio: '20%',
      sceneTemplate: function(modelId) {
        return 'Photoshoot of ' + modelId + ' relaxing on a rooftop terrace overlooking a glowing city skyline at sunset, wearing a tailored white suit, cinematic golden light'
      },
    },
    speaking: {
      label: 'Speaking Photos',
      description: 'Authority and leadership — teacher/expert positioning',
      ratio: '10%',
      sceneTemplate: function(modelId) {
        return 'Photoshoot of ' + modelId + ' speaking confidently on stage with microphone in a luxury conference hall, spotlight lighting, ultra realistic'
      },
    },
  },

  /**
   * Content output from one AI Twin batch session
   */
  batchOutput: {
    images: 30,
    reels: 10,
    posts: 20,
    contentPieces: '100+',
    timeToGenerate: '~1 hour',
  },

  /**
   * Reel animation ideas (for tools like Runway, Pika, CapCut)
   */
  reelAnimations: [
    'Walking toward camera',
    'Turning head slowly',
    'Skyline transition reveal',
    'Luxury zoom effect',
    'Window light sweep',
  ],
}

// ─────────────────────────────────────────────────────────────
// FRAMEWORK 4 — 6-PART VIDEO PROMPT STRUCTURE
// ─────────────────────────────────────────────────────────────

/**
 * buildVideoPrompt
 * Uses the 6-Part Video Prompt Structure.
 * Key insight: Part 3 (Action/Movement) is what separates video from image prompts.
 */
export function buildVideoPrompt(campaign, item, brandMemory) {
  brandMemory = brandMemory || {}
  var phase    = item.contentType || 'awareness'
  var format   = item.contentFormat || item.format || 'Reel Hook'
  var platform = item.contentPlatform || item.platform || 'Instagram'
  var topic    = item.contentTopic || item.topic || ''

  var aspectRatio = (platform === 'YouTube') ? '16:9 widescreen' : '9:16 vertical'

  var subject     = topic ? 'Luxury brand video capturing: "' + topic + '"' : 'A confident, sophisticated brand founder in a luxury environment'
  var environment = 'high-end minimalist workspace or luxury brand environment — marble surfaces, aubergine and crimson tones, city skyline or interior architectural depth'
  var action      = PHASE_ACTION[phase] || PHASE_ACTION.awareness
  var cameraMotion = PHASE_CAMERA_VIDEO[phase] || PHASE_CAMERA_VIDEO.awareness
  var lightingMood = PHASE_LIGHTING[phase] + ', ' + PHASE_EMOTION[phase]
  var styleQuality = 'ultra realistic, 4K cinematic film quality, ' + aspectRatio + ', DSLR film look, no jump cuts, single continuous motion'

  return [
    '━━ VIDEO PROMPT — 6-PART VIDEO STRUCTURE ━━',
    '',
    '🎬 PART 1 — SUBJECT',        subject,
    '',
    '🌆 PART 2 — ENVIRONMENT',    environment,
    '',
    '🎭 PART 3 — ACTION / MOVEMENT', action,
    '(Most critical part — describe exact motion in detail)',
    '',
    '📷 PART 4 — CAMERA MOTION',  cameraMotion,
    '',
    '💡 PART 5 — LIGHTING & MOOD', lightingMood,
    '',
    '🎞 PART 6 — STYLE / QUALITY', styleQuality,
    '',
    '━━ CAMPAIGN CONTEXT ━━',
    'Campaign: '  + campaign.name,
    'Message: '   + (campaign.emotionalHook || ''),
    'Phase: '     + phase + ' · Platform: ' + platform,
    '',
    '💡 Think like a director. Not "woman in office" but',
    '"confident woman closing her laptop and looking out the window with',
    'determination, camera slowly dollying from the side as golden light fills the room."',
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────
// AUTO-SELECT BUILDER
// ─────────────────────────────────────────────────────────────

/**
 * buildMediaPrompt — auto-routes to the right builder
 * Drop-in replacement for old buildMediaPrompt in Media Workflow.
 *
 * @param campaign     campaign object
 * @param item         content plan item — item.mediaType determines image vs video
 *                     item.promptStyle = 'photoshoot' uses Luxury Branding Formula
 * @param brandMemory  { colors, voice, founderDescription, role }
 * @param modelId      optional AI Twin Model ID
 */
export function buildMediaPrompt(campaign, item, brandMemory, modelId) {
  var mediaType   = item.mediaType   || 'image'
  var promptStyle = item.promptStyle || 'editorial'

  if (mediaType === 'video') {
    return buildVideoPrompt(campaign, item, brandMemory)
  }
  if (promptStyle === 'photoshoot') {
    return buildBrandPhotoshootPrompt(modelId || null, campaign, item, brandMemory)
  }
  return buildImagePrompt(campaign, item, brandMemory, modelId)
}

// ─────────────────────────────────────────────────────────────
// FRAMEWORK 5 — THE 12 VIRAL AI PHOTOSHOOT CONCEPTS
// ─────────────────────────────────────────────────────────────

export var PROMPT_LIBRARY = {

  // ── THE 12 VIRAL CONCEPTS ──────────────────────────────────

  viral12: [
    {
      id: 'ceo_power_portrait',
      number: 1,
      label: 'The CEO Power Portrait',
      purpose: 'Establish instant authority',
      visualIdea: 'Luxury office, power pose, confident expression',
      phase: 'authority',
      prompt: 'Ultra realistic editorial portrait of a powerful African American CEO standing behind a marble desk in a luxury penthouse office with skyline windows, wearing a cream power suit and diamond jewelry, warm natural daylight, cinematic photography, 8k',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing behind a marble desk in a luxury penthouse office with skyline windows, wearing a cream power suit and diamond jewelry, cinematic lighting, ultra realistic, 8k' },
    },
    {
      id: 'rooftop_vision',
      number: 2,
      label: 'The Rooftop Vision Shot',
      purpose: 'Symbolizes ambition and vision',
      visualIdea: 'Entrepreneur overlooking the city',
      phase: 'authority',
      prompt: 'Elegant entrepreneur standing on a rooftop terrace overlooking a glowing city skyline at sunset, wearing a tailored white suit and gold jewelry, cinematic golden hour lighting, ultra realistic editorial photography',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing on a rooftop terrace overlooking the city skyline at sunset, wearing a tailored white suit, cinematic golden light, ultra realistic' },
    },
    {
      id: 'work_in_progress',
      number: 3,
      label: 'The Work-In-Progress Shot',
      purpose: 'Shows real work behind the brand',
      visualIdea: 'Laptop, planner, coffee',
      phase: 'education',
      prompt: 'Luxury branding photo of an entrepreneur working on a laptop at a marble desk with planner and coffee, skyline office background, natural daylight, editorial photography',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' working on a laptop at a marble desk with planner and coffee in a luxury skyline office, natural daylight, editorial photography' },
    },
    {
      id: 'thinking_shot',
      number: 4,
      label: 'The Thinking Shot',
      purpose: 'Signals intelligence and strategy',
      visualIdea: 'Looking out a window holding notebook',
      phase: 'awareness',
      prompt: 'Elegant businesswoman standing beside floor-to-ceiling windows looking thoughtfully over the skyline while holding a leather notebook, soft golden light, ultra realistic',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing beside floor-to-ceiling windows looking thoughtfully over the skyline holding a leather notebook, soft golden light, ultra realistic, 8k' },
    },
    {
      id: 'oversized_symbol',
      number: 5,
      label: 'The Oversized Symbol Shot',
      purpose: 'Creates viral visual curiosity',
      visualIdea: 'Huge luxury objects — watch, crown, laptop',
      phase: 'awareness',
      prompt: 'Elegant entrepreneur standing beside a giant gold watch inside a luxury penthouse office, skyline behind her, cinematic lighting, surreal yet ultra realistic editorial photography',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing beside an oversized luxury gold watch inside a penthouse office with city skyline, cinematic lighting, surreal but ultra realistic' },
    },
    {
      id: 'speaking_authority',
      number: 6,
      label: 'The Speaking Authority Shot',
      purpose: 'Position as teacher or expert',
      visualIdea: 'Speaking on stage or presenting',
      phase: 'authority',
      prompt: 'Cinematic branding photo of a female entrepreneur speaking confidently in a modern conference room with presentation screen behind her, wearing a cream suit, warm spotlight lighting',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' speaking confidently on stage at a luxury conference event with spotlight lighting, ultra realistic, 8k' },
    },
    {
      id: 'luxury_lifestyle',
      number: 7,
      label: 'The Luxury Lifestyle Shot',
      purpose: 'Shows the reward of the work',
      visualIdea: 'Rooftop coffee, travel, penthouse',
      phase: 'lifestyle',
      prompt: 'Elegant entrepreneur relaxing on a rooftop lounge chair with coffee overlooking a glowing skyline at sunset, wearing a neutral blazer, cinematic golden light',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' relaxing on a rooftop terrace with coffee overlooking a glowing skyline at sunset, cinematic golden light, ultra realistic' },
    },
    {
      id: 'flat_lay_detail',
      number: 8,
      label: 'The Flat Lay Detail Shot',
      purpose: 'Adds aesthetic luxury — no person needed',
      visualIdea: 'Desk details, luxury objects',
      phase: 'education',
      prompt: 'Luxury flat lay of marble desk with laptop, planner, gold pen, designer glasses and coffee, warm sunlight, editorial photography',
      withModelId: null, // no person in this shot
    },
    {
      id: 'walking_confidence',
      number: 9,
      label: 'The Walking Confidence Shot',
      purpose: 'Shows movement and power',
      visualIdea: 'Walking through office lobby',
      phase: 'promotion',
      prompt: 'Luxury branding photo of a confident businesswoman walking through a glass office lobby carrying a laptop and designer handbag, polished marble floors, cinematic lighting',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' walking confidently through a glass office lobby carrying a laptop and designer handbag, marble floor reflections, cinematic lighting, ultra realistic' },
    },
    {
      id: 'brand_story',
      number: 10,
      label: 'The Brand Story Shot',
      purpose: 'Show personal narrative',
      visualIdea: 'Founder reading notes, reflecting',
      phase: 'awareness',
      prompt: 'Elegant entrepreneur seated by a large window writing in a leather journal while sunrise light fills the room, calm luxury environment, editorial realism',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' seated by a large window writing in a leather journal at sunrise, calm luxury environment, warm light, ultra realistic editorial photography' },
    },
    {
      id: 'legacy_shot',
      number: 11,
      label: 'The Legacy Shot',
      purpose: 'Communicates long-term impact',
      visualIdea: 'Standing above skyline or at sunrise',
      phase: 'authority',
      prompt: 'Powerful entrepreneur standing on a rooftop terrace overlooking the city at sunrise holding a planner, wearing a white suit, cinematic golden light, ultra realistic',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing on a rooftop at sunrise overlooking the city, holding a planner, wearing a white suit, cinematic golden light, ultra realistic, 8k' },
    },
    {
      id: 'iconic_signature',
      number: 12,
      label: 'The Iconic Signature Portrait',
      purpose: 'Your brand main image',
      visualIdea: 'Clean, powerful portrait — timeless',
      phase: 'authority',
      prompt: 'Ultra realistic luxury branding portrait of a confident African American businesswoman standing beside floor-to-ceiling skyline windows wearing a tailored white suit and diamond jewelry, cinematic editorial photography, 8k',
      withModelId: function(id) { return 'Photoshoot of ' + id + ' standing beside floor-to-ceiling skyline windows in a tailored white suit and diamond jewelry, cinematic editorial photography, ultra realistic, 8k' },
    },
  ],

  // ── EDITORIAL IMAGE PROMPTS (6 Pillar) ─────────────────────

  images: {

    awareness_hero: {
      label: 'Awareness — Hero Image',
      platform: 'Instagram / Blog',
      phase: 'awareness',
      pillar1_subject:     'A luxury brand environment suggesting a moment of realisation — empty desk, single light source, strategic stillness',
      pillar2_environment: 'Minimalist high-rise workspace at dusk, floor-to-ceiling windows, city lights beginning to glow, deep aubergine walls',
      pillar3_lighting:    'Dramatic single beam of warm amber light cutting through deep shadow, high contrast chiaroscuro',
      pillar4_wardrobe:    'Marble desk surface, leather-bound notebook, single pen, a small crimson accent object',
      pillar5_camera:      'Wide shot, deep perspective, 35mm cinematic, rule of thirds, shallow foreground focus',
      pillar6_emotion:     'The quiet before the shift — contemplative authority, the moment before everything changes',
      full_prompt:         'Luxury brand editorial image. Minimalist high-rise workspace at dusk, floor-to-ceiling windows, city lights beginning to glow. Deep aubergine walls, marble desk, leather notebook, single pen. One dramatic beam of warm amber light cuts across the desk through deep shadow. Wide cinematic shot, 35mm, rule of thirds. Mood: contemplative authority, the moment before everything changes. Color palette: deep aubergine var(--cth-brand-primary-soft), crimson var(--cth-brand-primary), warm gold. Ultra realistic, editorial photography, 8k. No generic stock photography, no bright white backgrounds, this brand is built deep not loud.',
    },

    education_carousel: {
      label: 'Education — Carousel Background',
      platform: 'Instagram Carousel',
      phase: 'education',
      full_prompt:         'Luxury editorial background for Instagram carousel slides. Clean architectural surface — dark aubergine marble or deep matte surface. Soft diffused daylight from left. Small brand-colored accent elements in crimson var(--cth-admin-accent) and tuscany var(--cth-admin-muted). 1:1 square, top-down slight angle, editorial magazine aesthetic. Mood: structured authority, intelligent clarity. Ultra realistic flat lay photography, space for text overlay, minimal composition. No generic stock photography.',
    },

    authority_portrait: {
      label: 'Authority — Brand Portrait',
      platform: 'Instagram / LinkedIn',
      phase: 'authority',
      full_prompt:         'Cinematic brand portrait. Confident entrepreneur in tailored deep burgundy power suit with gold jewelry, standing in a luxury corner office with warm golden hour light streaming through large windows. 85mm portrait lens, shallow depth of field, slight low angle power framing. Soft golden fill light, cinematic depth. Mood: quiet authority, earned confidence, calm certainty. Color palette: deep aubergine, warm gold, crimson accent. Ultra realistic, editorial brand photography, 8k. No generic stock photography, no smiling people looking directly at camera.',
    },

    promotion_cta: {
      label: 'Promotion — Ad Creative',
      platform: 'Ad Creative / Sales Page',
      phase: 'promotion',
      full_prompt:         'High-impact brand advertising visual. Bold cinematic scene — confident figure in a luxury architectural environment with dramatic high-contrast lighting. Dark shadow with single strong light source creating tension. Low angle power shot, 24mm wide, dynamic composition. Deep crimson var(--cth-brand-primary) and aubergine var(--cth-brand-primary-soft) palette. Mood: decisive momentum, transformational urgency. Ultra realistic, editorial advertising quality, 8k. No generic stock photography, no flat lighting.',
    },
  },

  // ── BRAND PHOTOSHOOT PROMPTS (Luxury Formula) ──────────────

  photoshoots: {

    ceo_office: {
      label: 'CEO Office Shot',
      framework: 'Luxury Branding Formula',
      part1: 'Elegant African American CEO',
      part2: 'powerful female entrepreneur and CEO',
      part3: 'seated behind a white marble desk in a luxury penthouse office with floor-to-ceiling skyline windows',
      part4: 'reviewing notes on her laptop while holding a pen over a leather planner',
      part5: 'warm natural daylight',
      part6: 'cinematic editorial photography, ultra realistic, DSLR camera, shallow depth of field, 8k',
      full_prompt: 'Ultra realistic branding photoshoot of an elegant African American CEO seated behind a white marble desk in a luxury penthouse office with floor-to-ceiling skyline windows, wearing a cream power suit and diamond jewelry while reviewing notes on her laptop, warm natural daylight, cinematic editorial photography, DSLR camera, 8k',
    },

    consultant_portrait: {
      label: 'Consultant Standing Portrait',
      framework: 'Luxury Branding Formula',
      full_prompt: 'Luxury branding portrait of a confident female consultant standing beside a marble conference table in a modern skyline office, wearing a tailored beige blazer dress and gold jewelry while holding a planner, warm golden hour lighting, ultra realistic DSLR editorial photography',
    },

    coach_teaching: {
      label: 'Business Coach — Teaching',
      framework: 'Luxury Branding Formula',
      full_prompt: 'Elegant branding photoshoot of a female business coach teaching from a laptop inside a bright luxury office with neutral decor and gold accents, wearing a soft cream suit, natural window light, cinematic editorial photography, ultra realistic, 8k',
    },

    personal_brand_walking: {
      label: 'Personal Brand — Walking Power Shot',
      framework: 'Luxury Branding Formula',
      full_prompt: 'Luxury personal brand photoshoot of a confident entrepreneur walking through a glass office lobby carrying a laptop and designer handbag, wearing a white tailored suit and heels, marble floor reflections, cinematic lighting, ultra realistic DSLR photography',
    },
  },

  // ── VIDEO PROMPTS (6-Part) ──────────────────────────────────

  videos: {

    awareness_reel: {
      label: 'Awareness — Reel Hook',
      platform: 'Instagram Reel / TikTok',
      full_prompt: 'Cinematic brand video. 9:16 vertical. A luxury minimalist workspace with floor-to-ceiling windows overlooking a city skyline. Deep aubergine walls, marble desk, leather notebook. Camera slowly pushes in through the window as golden hour light begins to fill the room, long warm shadows retreating across the desk. Slow cinematic push-in. Mood: the quiet before the shift, contemplative authority. Ultra realistic, 4K cinematic, slow motion, no people — environment only.',
    },

    education_clip: {
      label: 'Education — Brand Explainer Clip',
      platform: 'Instagram / LinkedIn',
      full_prompt: 'Cinematic brand video. 9:16 vertical. Confident entrepreneur writing in a leather journal at a luxury marble desk. Warm daylight through large windows. Camera tracks slowly from left to right at desk level. They pause, look up with quiet certainty. Soft warm editorial lighting. Mood: structured intelligence, earned authority. Ultra realistic, 4K, cinematic DSLR quality, no fast cuts, single continuous motion.',
    },

    authority_statement: {
      label: 'Authority — Brand Statement',
      platform: 'Instagram / LinkedIn / YouTube',
      full_prompt: 'Ultra-realistic cinematic brand video. 16:9. Powerful entrepreneur standing at floor-to-ceiling windows of a luxury high-rise, city skyline behind them. They slowly turn toward the camera with absolute determination. Slow arc dolly from behind, revealing the full city. Rich golden hour backlight, powerful rim silhouette, warm fill on face. Mood: earned authority, quiet power. 4K cinematic DSLR, slow motion, no dialogue needed.',
    },

    promotion_launch: {
      label: 'Promotion — Campaign Launch',
      platform: 'Instagram / Ad Creative',
      full_prompt: 'High-impact cinematic brand launch video. 9:16 vertical. Confident entrepreneur walking purposefully through a luxury architectural corridor toward the camera. Camera tracks backward maintaining distance. High-contrast dramatic lighting, bold shadows. Crimson and aubergine environment. Mood: decisive momentum, transformational urgency. Ultra realistic, 4K cinematic, slight slow motion 60fps.',
    },

    brand_atmosphere: {
      label: 'Brand Atmosphere / B-Roll',
      platform: 'Universal',
      full_prompt: 'Ultra-cinematic brand atmosphere video. No people. Luxury workspace with deep aubergine walls, marble surfaces, leather-bound books, single candle, warm gold accents. Sunlight streams through architectural gaps creating dust particles. Extremely slow push-in toward the desk surface. Rich warm atmospheric lighting, deep dramatic shadows. Mood: the depth of a brand built on truth, not trend. 4K cinematic, extreme slow motion 120fps.',
    },
  },

  // ── FORMULAS — QUICK COPY ──────────────────────────────────

  formulas: {

    // 6-Pillar image formula
    image_6pillar: '[Subject — who/what is the focus] inside [Environment — luxury location with brand tones]. [Lighting — dramatic/soft/golden] lighting. Wearing/featuring [Wardrobe — brand palette, fashion details]. Shot on [Camera — lens, angle, composition]. Mood: [Emotion — the feeling this image carries]. Ultra realistic, editorial photography, 8k. No generic stock photography, no flat lighting, this brand is built deep not loud.',

    // Luxury Branding Photoshoot formula
    photoshoot_formula: 'Ultra realistic branding photoshoot of a [elegant businesswoman / entrepreneur / coach] inside a [luxury environment] wearing [polished wardrobe] [doing a brand-related action] [lighting style], cinematic editorial photography, DSLR camera, shallow depth of field, 8k',

    // 6-Part video formula
    video_6part: 'Cinematic video of [Subject] inside [Environment]. [Action/Movement — describe exact motion in detail]. [Camera Motion — how the camera moves]. [Lighting and Mood — atmosphere and emotion]. [Style/Quality — cinematic, 4K, aspect ratio, speed].',

    // AI Twin with scene
    ai_twin: 'Photoshoot of [Model ID] [scene description] [wardrobe] [environment] [lighting], ultra realistic, DSLR, 8k',

    // CTH brand defaults
    cth_defaults: {
      palette:    'deep aubergine var(--cth-brand-primary-soft), Alabama Crimson var(--cth-brand-primary), Cinnabar var(--cth-admin-accent), Tuscany Rose var(--cth-admin-muted), warm gold var(--cth-brand-secondary)',
      quality:    'ultra realistic, DSLR photography, cinematic editorial photography, shallow depth of field, 8k detail',
      anti:       CTH_ANTI_PATTERNS,
    },

    // Content mix ratios (from Luxury Branding doc)
    contentMix: {
      authority:        '40%',
      lifestyle:        '30%',
      behindTheScenes:  '20%',
      storytelling:     '10%',
    },
  },
}

// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER PANEL (React component)
// Drop into Media Workflow or Media Studio as a helper panel
// ─────────────────────────────────────────────────────────────

var C = {
  bg: 'var(--cth-brand-primary-deep)', bgCard: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)',
  accent: 'var(--cth-admin-accent)', white: 'var(--cth-white)',
  t60: 'var(--cth-text-on-dark-muted)', t50: 'rgba(255,255,255,0.5)',
  t40: 'rgba(255,255,255,0.4)', t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)', t20: 'rgba(255,255,255,0.2)',
  font: "'DM Sans', sans-serif",
}

var BUILDER_MODES = [
  { id: 'editorial',  label: '6-Pillar Editorial',    type: 'image', desc: 'Campaign content, brand imagery' },
  { id: 'photoshoot', label: 'Luxury Photoshoot',      type: 'image', desc: 'Founder / CEO personal brand photos' },
  { id: 'aitwin',     label: 'AI Twin Scene',          type: 'image', desc: 'Consistent identity across scenes' },
  { id: 'video',      label: '6-Part Video',           type: 'video', desc: 'Reels, clips, campaign video' },
]

var PILLARS_EDITORIAL = [
  { id: 'subject',     label: '🎭 Subject',              hint: 'Who or what is the focus', example: 'Confident brand founder at a luxury marble desk' },
  { id: 'environment', label: '🌿 Environment',          hint: 'Where does the scene take place', example: 'Luxury high-rise office, aubergine walls, city view' },
  { id: 'lighting',    label: '💡 Lighting',             hint: 'How is the scene lit — controls emotion', example: 'Warm golden hour light streaming through windows' },
  { id: 'wardrobe',    label: '👗 Wardrobe / Style',     hint: 'What is worn or designed with', example: 'Tailored burgundy power suit, gold jewelry, var(--cth-brand-primary) var(--cth-admin-accent)' },
  { id: 'camera',      label: '📸 Camera & Composition', hint: 'Lens, angle, framing', example: '85mm portrait lens, shallow depth of field, slight low angle' },
  { id: 'emotion',     label: '⚡ Emotion / Energy',     hint: 'What feeling does this carry', example: 'Quiet authority, earned confidence, calm certainty' },
]

var PILLARS_PHOTOSHOOT = [
  { id: 'subject', label: '👤 Subject',               hint: 'Who is in the photo — identity description', example: 'Elegant African American businesswoman' },
  { id: 'role',    label: '🏆 Role / Authority',      hint: 'Professional credibility position', example: 'Powerful female entrepreneur and CEO' },
  { id: 'environment', label: '🏛 Luxury Environment', hint: 'Location that communicates success', example: 'Luxury penthouse office with floor-to-ceiling skyline windows' },
  { id: 'action',  label: '🤲 Action / Pose',         hint: 'What are they doing — brand behavior', example: 'Working on a laptop while reviewing notes in a leather planner' },
  { id: 'lighting', label: '💡 Lighting Style',       hint: 'The luxury mood', example: 'Warm natural daylight, golden hour' },
  { id: 'camera',  label: '📷 Camera Quality',        hint: 'Forces photorealistic output', example: 'Cinematic editorial photography, ultra realistic, DSLR, shallow depth of field, 8k' },
]

var PILLARS_VIDEO = [
  { id: 'subject',  label: '🎬 Subject',              hint: 'Who or what is in the video', example: 'Confident entrepreneur in a luxury workspace' },
  { id: 'environment', label: '🌆 Environment',       hint: 'Where does the video take place', example: 'Luxury high-rise office with city skyline, aubergine tones' },
  { id: 'action',   label: '🎭 Action / Movement',    hint: 'MOST IMPORTANT — describe exact motion', example: 'Slowly closes her laptop and turns to look out the window with determination' },
  { id: 'camera',   label: '📷 Camera Motion',        hint: 'How the camera moves', example: 'Slow dolly arc from behind, revealing the city skyline' },
  { id: 'lighting', label: '💡 Lighting & Mood',      hint: 'Atmosphere and emotional tone', example: 'Rich golden hour backlight, cinematic chiaroscuro depth' },
  { id: 'style',    label: '🎞 Style / Quality',      hint: 'Look, format, speed', example: 'Ultra realistic, 4K cinematic, 9:16 vertical, slow motion 60fps' },
]

/**
 * PromptBuilderPanel
 * Props:
 *   campaign     campaign object (optional)
 *   onUsePrompt  function(promptString) — called when user hits Use Prompt
 */
export function PromptBuilderPanel(props) {
  var campaign    = props.campaign || {}
  var onUsePrompt = props.onUsePrompt

  var modeS   = useState('editorial'); var mode = modeS[0]; var setMode = modeS[1]
  var modelIdS = useState('');         var modelId = modelIdS[0]; var setModelId = modelIdS[1]
  var valsS   = useState({});          var vals = valsS[0]; var setVals = valsS[1]
  var promptS = useState('');          var builtPrompt = promptS[0]; var setBuiltPrompt = promptS[1]
  var copiedS = useState(false);       var copied = copiedS[0]; var setCopied = copiedS[1]

  var pillars = mode === 'photoshoot' ? PILLARS_PHOTOSHOOT : mode === 'video' ? PILLARS_VIDEO : PILLARS_EDITORIAL
  var isAiTwin = mode === 'aitwin'

  function update(id, val) {
    setVals(function(prev) { var n = Object.assign({}, prev); n[id] = val; return n })
  }

  function build() {
    var parts = []

    if (isAiTwin) {
      var scene = [
        vals.environment || '',
        vals.action      ? vals.action + '.' : '',
        vals.wardrobe    ? 'Wearing ' + vals.wardrobe + '.' : '',
        vals.lighting    || '',
        vals.quality     || 'ultra realistic, DSLR, 8k',
      ].filter(function(s) { return s.trim() }).join(' ')
      parts = ['Photoshoot of ' + (modelId || '[Model ID]') + '. ' + scene]
    } else if (mode === 'video') {
      parts = [
        'Cinematic video of ' + (vals.subject || '[subject]') + '.',
        vals.environment ? 'Scene: ' + vals.environment + '.' : '',
        vals.action      ? 'Action: ' + vals.action + '.' : '',
        vals.camera      ? 'Camera: ' + vals.camera + '.' : '',
        vals.lighting    ? 'Lighting/mood: ' + vals.lighting + '.' : '',
        vals.style       ? vals.style + '.' : 'Ultra realistic, 4K cinematic.',
        campaign.name          ? 'Campaign: ' + campaign.name : '',
        campaign.emotionalHook ? 'Message: ' + campaign.emotionalHook : '',
        CTH_ANTI_PATTERNS,
      ]
    } else if (mode === 'photoshoot') {
      parts = [
        'Ultra realistic branding photoshoot of a ' + (vals.subject || '[subject]'),
        vals.role && vals.role.trim() ? '— ' + vals.role : '',
        vals.environment ? 'inside ' + vals.environment + '.' : '',
        vals.action      ? vals.action + '.' : '',
        vals.lighting    ? vals.lighting + '.' : '',
        vals.camera      ? vals.camera + '.' : 'Cinematic editorial photography, ultra realistic, DSLR, shallow depth of field, 8k.',
        CTH_ANTI_PATTERNS,
      ]
    } else {
      // editorial / 6-pillar
      parts = [
        vals.subject || '[subject]',
        vals.environment ? 'inside ' + vals.environment + '.' : '',
        vals.lighting    ? vals.lighting + '.' : '',
        vals.wardrobe    ? vals.wardrobe + '.' : '',
        vals.camera      ? vals.camera + '.' : '',
        vals.emotion     ? 'Mood: ' + vals.emotion + '.' : '',
        'Ultra realistic, editorial photography, 8k.',
        campaign.name          ? 'Campaign: ' + campaign.name : '',
        campaign.emotionalHook ? 'Message: ' + campaign.emotionalHook : '',
        CTH_ANTI_PATTERNS,
      ]
    }

    setBuiltPrompt(parts.filter(function(p) { return p.trim() }).join('\n'))
  }

  function handleCopy() {
    navigator.clipboard.writeText(builtPrompt).catch(function() {})
    setCopied(true)
    setTimeout(function() { setCopied(false) }, 2000)
  }

  var inp12 = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.white,
    fontFamily: C.font, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: C.bg, fontFamily: C.font }}>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        {BUILDER_MODES.map(function(m) {
          var isActive = mode === m.id
          return (
            <button key={m.id} onClick={function() { setMode(m.id); setVals({}) }} style={{
              padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: C.font,
              fontSize: 11, fontWeight: 500, border: '1px solid',
              borderColor: isActive ? 'rgba(224,78,53,0.5)' : 'rgba(255,255,255,0.08)',
              background: isActive ? 'rgba(224,78,53,0.1)' : 'rgba(255,255,255,0.03)',
              color: isActive ? C.accent : C.t40,
            }}>
              {m.label}
            </button>
          )
        })}
      </div>

      {/* AI Twin model ID field */}
      {(isAiTwin || mode === 'photoshoot') && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10.5, fontWeight: 600, color: C.t40, display: 'block', marginBottom: 5 }}>
            {isAiTwin ? 'Model ID *' : 'Model ID (optional — for AI Twin consistency)'}
          </label>
          <input
            value={modelId}
            onChange={function(e) { setModelId(e.target.value) }}
            placeholder="e.g. CTH Brand Model 01"
            style={inp12}
          />
          {isAiTwin && (
            <p style={{ fontSize: 10, color: C.t25, margin: '4px 0 0', lineHeight: 1.5 }}>
              Create your Model ID by uploading 3-5 reference photos and locking your identity with the AI Twin setup prompt.
            </p>
          )}
        </div>
      )}

      {/* AI Twin fields */}
      {isAiTwin && (
        <div>
          {[
            { id: 'environment', label: '🏛 Scene / Environment', hint: 'Where the photo takes place', example: 'luxury penthouse office with floor-to-ceiling skyline windows' },
            { id: 'action',      label: '🤲 Pose / Action',       hint: 'What are they doing', example: 'standing confidently behind a marble desk in a power pose' },
            { id: 'wardrobe',    label: '👗 Wardrobe',             hint: 'What they are wearing', example: 'cream power suit and diamond jewelry' },
            { id: 'lighting',    label: '💡 Lighting',             hint: 'The lighting style', example: 'warm natural daylight, cinematic golden hour' },
            { id: 'quality',     label: '📷 Quality',              hint: 'Camera and realism', example: 'ultra realistic, DSLR, shallow depth of field, 8k' },
          ].map(function(f) {
            return (
              <div key={f.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.t60 }}>{f.label}</label>
                  <span style={{ fontSize: 9.5, color: C.t25, fontStyle: 'italic' }}>{f.hint}</span>
                </div>
                <input value={vals[f.id] || ''} onChange={function(e) { update(f.id, e.target.value) }} placeholder={f.example} style={inp12} />
              </div>
            )
          })}
        </div>
      )}

      {/* Standard pillar fields */}
      {!isAiTwin && (
        <div>
          {pillars.map(function(pillar) {
            return (
              <div key={pillar.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.t60 }}>{pillar.label}</label>
                  <span style={{ fontSize: 9.5, color: C.t25, fontStyle: 'italic' }}>{pillar.hint}</span>
                </div>
                <input value={vals[pillar.id] || ''} onChange={function(e) { update(pillar.id, e.target.value) }} placeholder={pillar.example} style={inp12} />
              </div>
            )
          })}
        </div>
      )}

      {/* Build button */}
      <button onClick={build} style={{
        width: '100%', padding: '9px', borderRadius: 8, border: '1px solid rgba(224,78,53,0.25)',
        background: 'var(--cth-brand-primary-soft)', color: C.accent, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', fontFamily: C.font, marginTop: 8, marginBottom: 12,
      }}>
        🔧 Build Prompt
      </button>

      {/* Output */}
      {builtPrompt && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.t25, margin: 0 }}>Built Prompt</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCopy} style={{ fontSize: 10.5, color: copied ? 'var(--cth-status-success-bright)' : C.t40, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              {onUsePrompt && (
                <button onClick={function() { onUsePrompt(builtPrompt) }} style={{ fontSize: 10.5, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font, fontWeight: 600 }}>
                  Use Prompt →
                </button>
              )}
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', maxHeight: 220, overflowY: 'auto' }}>
            <p style={{ fontSize: 11, color: C.t60, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{builtPrompt}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptBuilderPanel
