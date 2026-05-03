// frontend/src/lib/apiPaths.js

function encode(value) {
  return encodeURIComponent(String(value ?? "").trim());
}

function buildPath(basePath, query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          params.append(key, String(item));
        }
      });
      return;
    }

    params.append(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export const API_PATHS = {
  platform: {
    version: "/api/version",
    health: "/api/health",
    healthReady: "/api/health/ready",
    healthLive: "/api/health/live",
    permissionsMe: "/api/permissions/me",
    workspacesMine: "/api/workspaces/mine",
    workspaceSwitch: "/api/workspaces/switch",
  },

  auth: {
    me: "/api/auth/me",
    session: "/api/auth/session",
    signOut: "/api/auth/sign-out",
  },

  public: {
    contact: "/api/contact",
    pricing: "/api/public/pricing",
    plans: "/api/public/plans",
    status: "/api/public/status",
  },

  onboarding: {
    progress: "/api/onboarding/progress",
    checklist: "/api/onboarding/checklist",
    completeStep: (stepKey) => `/api/onboarding/steps/${encode(stepKey)}/complete`,
  },

  audit: {
    run: "/api/audit/run",
    latest: "/api/audit/latest",
    history: "/api/audit/history",
    byId: (auditId) => `/api/audit/${encode(auditId)}`,
    compare: buildPath.bind(null, "/api/audit/compare"),
  },

  analytics: {
    overview: "/api/analytics/overview",
    brandProgress: "/api/analytics/brand-progress",
    aiUsage: "/api/analytics/ai-usage",
    contentBreakdown: "/api/analytics/content-breakdown",
    mediaBreakdown: "/api/analytics/media-breakdown",
    brandMemory: "/api/analytics/brand-memory",
    dashboard: "/api/analytics/dashboard",
    usage: "/api/analytics/usage",
    report: buildPath.bind(null, "/api/analytics/report"),
  },

  workspace: {
    stats: (workspaceId) => `/api/workspace/${encode(workspaceId)}/stats`,
    detail: (workspaceId) => `/api/workspace/${encode(workspaceId)}`,
    settings: (workspaceId) => `/api/workspace/${encode(workspaceId)}/settings`,
    members: (workspaceId) => `/api/workspace/${encode(workspaceId)}/members`,
  },

  permissions: {
    me: "/api/permissions/me",
    routeCheck: buildPath.bind(null, "/api/permissions/check"),
  },

  billing: {
    plans: "/api/billing/plans",
    creditPacks: "/api/billing/credit-packs",
    summary: "/api/billing/summary",
    transactions: "/api/billing/transactions",
    portal: "/api/billing/portal",
    checkoutSubscription: "/api/billing/checkout/subscription",
    checkoutCredits: "/api/billing/checkout/credits",
    checkoutStatus: (sessionId) => `/api/billing/checkout/status/${encode(sessionId)}`,
  },

  teams: {
    members: (workspaceId) => `/api/teams/${encode(workspaceId)}/members`,
    pendingInvites: (workspaceId) => `/api/teams/${encode(workspaceId)}/pending-invites`,
    activitySummary: (workspaceId) => `/api/teams/${encode(workspaceId)}/activity-summary`,
    invite: (workspaceId) => `/api/teams/${encode(workspaceId)}/invite`,
    memberRole: (workspaceId, memberId) =>
      `/api/teams/${encode(workspaceId)}/members/${encode(memberId)}/role`,
    memberDelete: (workspaceId, memberId) =>
      `/api/teams/${encode(workspaceId)}/members/${encode(memberId)}`,
    resendInvite: (workspaceId, inviteId) =>
      `/api/teams/${encode(workspaceId)}/pending-invites/${encode(inviteId)}/resend`,
    deleteInvite: (workspaceId, inviteId) =>
      `/api/teams/${encode(workspaceId)}/pending-invites/${encode(inviteId)}`,
  },

  persist: {
    brandMemory: "/api/persist/brand-memory",
    brandFoundation: "/api/persist/brand-foundation",
    brandFoundationAiAssist: "/api/persist/brand-foundation/ai-assist",

    contentLibrary: "/api/persist/content/library",
    contentGenerate: "/api/persist/content/generate",
    contentSave: "/api/persist/content/save",
    contentById: (contentId) => `/api/persist/content/${encode(contentId)}`,

    assets: "/api/persist/assets",
    assetById: (assetId) => `/api/persist/assets/${encode(assetId)}`,
  },

  audience: {
    avatars: "/api/audience/avatars",
    avatarById: (avatarId) => `/api/audience/avatars/${encode(avatarId)}`,
    setPrimary: (avatarId) => `/api/audience/avatars/${encode(avatarId)}/set-primary`,
  },

  campaigns: {
    regenerateBrief: (id) => `/api/campaigns/${encode(id)}/regenerate-brief`,
    regenerateHooks: (id) => `/api/campaigns/${encode(id)}/regenerate-hooks`,
    retrospective: (id) => `/api/campaigns/${encode(id)}/retrospective`,
  },

   osWorkflow: {
    readiness: "/api/os-workflow/readiness",
    brandMemory: "/api/analytics/brand-memory",
    workflow: "/api/os-workflow",
    workflowById: (workflowId) => `/api/os-workflow/${encode(workflowId)}`,
    generateStep: (workflowId, stepNum) =>
      `/api/os-workflow/${encode(workflowId)}/step/${encode(stepNum)}/generate`,
    editStep: (workflowId, stepNum) =>
      `/api/os-workflow/${encode(workflowId)}/step/${encode(stepNum)}/edit`,
  },

  crm: {
    dashboard: "/api/crm/dashboard/summary",

    contacts: "/api/crm/contacts",
    contactById: (contactId) => `/api/crm/contacts/${encode(contactId)}`,
    contactsSearch: (query) => buildPath("/api/crm/contacts", query),

    deals: "/api/crm/deals",
    dealById: (dealId) => `/api/crm/deals/${encode(dealId)}`,
    dealsSearch: (query) => buildPath("/api/crm/deals", query),

    activities: "/api/crm/activities",
    activityById: (activityId) => `/api/crm/activities/${encode(activityId)}`,

    notes: "/api/crm/notes",
    noteById: (noteId) => `/api/crm/notes/${encode(noteId)}`,

    companies: "/api/crm/companies",
    companyById: (companyId) => `/api/crm/companies/${encode(companyId)}`,
  },

  calendar: {
    events: "/api/calendar/events",
    eventsMonth: (year, month) => `/api/calendar/events/month/${encode(year)}/${encode(month)}`,
    eventsWeek: (query) => buildPath("/api/calendar/events/week", query),
    eventsToday: "/api/calendar/events/today",
    eventById: (eventId) => `/api/calendar/events/${encode(eventId)}`,
    categories: "/api/calendar/categories",
    upcoming: "/api/calendar/upcoming",
    analytics: "/api/calendar/analytics",
  },

  documents: {
    list: buildPath.bind(null, "/api/documents"),
    create: "/api/documents",
    uploadBinary: (documentId) => `/api/documents/${encode(documentId)}/upload`,
    byId: (documentId) => `/api/documents/${encode(documentId)}`,
    delete: (documentId) => `/api/documents/${encode(documentId)}`,
    download: (documentId) => `/api/documents/${encode(documentId)}/download`,
  },

  store: {
    catalog: "/api/store/catalog",
    products: "/api/store/products",
    productById: (productId) => `/api/store/products/${encode(productId)}`,
    checkout: "/api/store/checkout",
    orders: "/api/store/orders",
    orderById: (orderId) => `/api/store/orders/${encode(orderId)}`,
  },

  admin: {
    dashboard: "/api/admin/dashboard",
    users: "/api/admin/users",
    userById: (userId) => `/api/admin/users/${encode(userId)}`,
    workspaces: "/api/admin/workspaces",
    workspaceById: (workspaceId) => `/api/admin/workspaces/${encode(workspaceId)}`,
    subscriptions: "/api/admin/subscriptions",
    usage: "/api/admin/usage",
    logs: "/api/admin/logs",
    settings: "/api/admin/settings",
    knowledgeBase: buildPath.bind(null, "/api/admin/knowledge-base"),
    knowledgeBaseById: (articleId) => `/api/admin/knowledge-base/${encode(articleId)}`,
  },

  settings: {
    profile: "/api/settings/profile",
    workspace: "/api/settings/workspace",
    notifications: "/api/settings/notifications",
    billing: "/api/settings/billing",
  },

  business: {
    profile: "/api/business/profile",
    summary: "/api/business/summary",
  },

  usage: {
    summary: "/api/usage/summary",
    ledger: "/api/usage/ledger",
    history: buildPath.bind(null, "/api/usage/history"),
  },

  subscription: {
    current: "/api/subscription/current",
    plans: "/api/subscription/plans",
    change: "/api/subscription/change",
    cancel: "/api/subscription/cancel",
  },

  contact: {
    submit: "/api/contact",
    list: "/api/contact",
  },
};

export { buildPath, encode };
export default API_PATHS;
