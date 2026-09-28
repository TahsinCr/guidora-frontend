import { CATEGORIES, TAG_CATEGORIES } from './mockData';
import { getOrganizations, adminUpdateOrganization } from './userService';

export { adminUpdateOrganization };

export const CATEGORIES_KEY = 'guidora_custom_categories';
export const TAGS_KEY = 'guidora_custom_tags';
const DELETED_TOOLS_KEY = 'guidora_deleted_tool_ids';
const TOOL_OVERRIDES_KEY = 'guidora_tool_overrides';
const REPORTS_KEY = 'guidora_reports';
const USERS_KEY = 'guidora_all_users';

function notifyTaxonomyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_taxonomy_change'));
  }
}

// --- Tag Categories & Tags Management ---
export function adminGetTagCategories() {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) {
      localStorage.setItem(TAGS_KEY, JSON.stringify(TAG_CATEGORIES));
      return [...TAG_CATEGORIES];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...TAG_CATEGORIES];
  }
}

export function adminUpdateTagCategory(tagCategoryId, { name, translations = {}, isSingleSelect }) {
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId) {
      return {
        ...group,
        name: name !== undefined ? name.trim() : group.name,
        translations: {
          ...(group.translations || {}),
          ...translations,
        },
        isSingleSelect: isSingleSelect !== undefined ? Boolean(isSingleSelect) : group.isSingleSelect,
      };
    }
    return group;
  });
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminAddTagCategory({ id, name, translations = {}, isSingleSelect = false }) {
  const currentCategories = adminGetTagCategories();
  const slug = (id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug || !name?.trim()) {
    throw new Error('Valid category name is required.');
  }
  if (currentCategories.some((c) => c.id === slug || c.name.toLowerCase() === name.trim().toLowerCase())) {
    throw new Error('A tag category with this name or ID already exists.');
  }
  const newCat = {
    id: slug,
    name: name.trim(),
    translations: { ...translations },
    isSingleSelect: Boolean(isSingleSelect),
    tags: [],
  };
  const updated = [...currentCategories, newCat];
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return newCat;
}

export function adminDeleteTagCategory(tagCategoryId) {
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.filter((g) => g.id !== tagCategoryId);
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminAddTag(tagCategoryId, { name, translations = {}, isSingleSelect = false }) {
  const currentCategories = adminGetTagCategories();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId) {
      if (group.tags.some((t) => t.id === slug || t.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('This tag already exists in this category.');
      }
      return {
        ...group,
        tags: [
          ...group.tags,
          {
            id: slug,
            name: name.trim(),
            translations: {
              tr: translations?.tr?.trim() || '',
              ru: translations?.ru?.trim() || '',
            },
            only: group.isSingleSelect || isSingleSelect,
          },
        ],
      };
    }
    return group;
  });

  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminDeleteTag(tagCategoryId, tagId) {
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId) {
      return {
        ...group,
        tags: group.tags.filter((t) => t.id !== tagId && t.name !== tagId),
      };
    }
    return group;
  });

  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminUpdateTag(tagCategoryId, tagId, updates) {
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId) {
      return {
        ...group,
        tags: group.tags.map((tag) => {
          if (tag.id === tagId) {
            return {
              ...tag,
              name: updates.name !== undefined ? updates.name.trim() : tag.name,
              translations: {
                ...(tag.translations || {}),
                ...(updates.translations || {}),
              },
              only: updates.only !== undefined ? updates.only : tag.only,
            };
          }
          return tag;
        }),
      };
    }
    return group;
  });

  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

// --- Categories ---
export function adminGetCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(CATEGORIES));
      return [...CATEGORIES];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...CATEGORIES];
  }
}

export function adminAddCategory({ name, translations = {}, color = '#8A38F5', isPopular = false }) {
  const current = adminGetCategories();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (current.some((c) => c.id === id)) {
    throw new Error('A category with this name already exists.');
  }

  const newCat = {
    id,
    name: name.trim(),
    translations: {
      tr: translations?.tr?.trim() || '',
      ru: translations?.ru?.trim() || '',
    },
    count: 0,
    color,
    isPopular: Boolean(isPopular),
  };

  const updated = [...current, newCat];
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return newCat;
}

export function adminUpdateCategory(catId, updates) {
  const current = adminGetCategories();
  const updated = current.map((c) => {
    if (c.id === catId) {
      return {
        ...c,
        ...updates,
        translations: updates.translations !== undefined
          ? { ...(c.translations || {}), ...updates.translations }
          : c.translations,
      };
    }
    return c;
  });
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminDeleteCategory(catId) {
  if (catId === 'all') {
    throw new Error('Cannot delete the root "All Tools" category.');
  }
  const current = adminGetCategories();
  const updated = current.filter((c) => c.id !== catId);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

// --- Tools Overrides & Deletion ---
export function getDeletedToolIds() {
  try {
    const raw = localStorage.getItem(DELETED_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getToolOverrides() {
  try {
    const raw = localStorage.getItem(TOOL_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function adminUpdateTool(toolId, fieldUpdates) {
  const overrides = getToolOverrides();
  overrides[toolId] = {
    ...(overrides[toolId] || {}),
    ...fieldUpdates,
  };
  localStorage.setItem(TOOL_OVERRIDES_KEY, JSON.stringify(overrides));
  return overrides[toolId];
}

export function adminDeleteTool(toolId) {
  const deleted = getDeletedToolIds();
  if (!deleted.includes(toolId)) {
    deleted.push(toolId);
    localStorage.setItem(DELETED_TOOLS_KEY, JSON.stringify(deleted));
  }
  return deleted;
}

export function adminRestoreTool(toolId) {
  const deleted = getDeletedToolIds();
  const updated = deleted.filter((id) => id !== toolId);
  localStorage.setItem(DELETED_TOOLS_KEY, JSON.stringify(updated));
  return updated;
}

// --- Reports ---
export function adminGetReports() {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function adminResolveReport(reportId, actionTaken = 'Reviewed') {
  const reports = adminGetReports();
  const updated = reports.map((rep) => {
    if (rep.id === reportId) {
      return {
        ...rep,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        actionTaken,
      };
    }
    return rep;
  });
  localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
  return updated;
}

export function adminDismissReport(reportId) {
  const reports = adminGetReports();
  const updated = reports.map((rep) => {
    if (rep.id === reportId) {
      return {
        ...rep,
        status: 'dismissed',
        resolvedAt: new Date().toISOString(),
      };
    }
    return rep;
  });
  localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
  return updated;
}

// --- Activity / Audit Logs ---
export const ADMIN_LOGS_KEY = 'guidora_admin_audit_logs';
export const PROPOSALS_KEY = 'guidora_product_proposals';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-101',
    action: 'RATE_LIMIT_EXCEEDED',
    entityName: 'API Gateway',
    entityId: 'sec-limiter-01',
    target: 'IP: 198.51.100.42 (Rate: 120 req/s)',
    level: 'CRITICAL',
    category: 'SECURITY',
    actor: 'Security Firewall Guard',
    actorEmail: 'security@guidora.ai',
    actorRole: 'system',
    actorIp: '198.51.100.42',
    userAgent: 'Go-http-client/2.0',
    traceId: 'trace-guidora-8f12a9e3',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    xmin: 49201,
    badge: 'error',
    oldValues: null,
    newValues: {
      clientIp: '198.51.100.42',
      requestCount: 120,
      windowSeconds: 60,
      threshold: 60,
      actionTaken: 'TEMPORARY_BLOCK_15M',
    },
  },
  {
    id: 'log-102',
    action: 'PRODUCT_STATUS_VERIFIED',
    entityName: 'Product',
    entityId: 'neurogen-studio',
    target: 'NeuroGen Studio',
    level: 'AUDIT',
    category: 'CATALOG',
    actor: 'Tahsin Cr',
    actorEmail: 'tahsincrs@gmail.com',
    actorRole: 'admin',
    actorIp: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) GuidoraAdmin/2.0',
    traceId: 'trace-guidora-b472c1a8',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    xmin: 49202,
    badge: 'success',
    oldValues: {
      verified: { admin: false, audited: false, featured: false },
      updatedAt: '2026-09-27T14:10:00Z',
    },
    newValues: {
      verified: { admin: true, audited: true, featured: true },
      verifiedBy: 'Tahsin Cr',
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  },
  {
    id: 'log-103',
    action: 'AUTOVACUUM_ANALYZE',
    entityName: 'DatabaseTable',
    entityId: 'products',
    target: 'public.products (PostgreSQL 18)',
    level: 'INFO',
    category: 'DATABASE',
    actor: 'PostgreSQL AutoVacuum Worker',
    actorEmail: 'postgres@internal.cluster',
    actorRole: 'system',
    actorIp: '127.0.0.1',
    userAgent: 'PostgreSQL 18.0 (Debian 18.0-1.pgdg120+1)',
    traceId: 'trace-guidora-db-0041',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    xmin: 49203,
    badge: 'info',
    oldValues: null,
    newValues: {
      table: 'products',
      deadTuplesPurged: 18,
      pagesModified: 4,
      executionDurationMs: 14.8,
    },
  },
  {
    id: 'log-104',
    action: 'USER_REPORT_TRIAGED',
    entityName: 'Report',
    entityId: 'rep-17270001',
    target: 'Flagged: Misleading Pricing on AI Studio',
    level: 'WARN',
    category: 'GOVERNANCE',
    actor: 'Deniz Kaya',
    actorEmail: 'deniz@guidora.ai',
    actorRole: 'moderator',
    actorIp: '10.0.0.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    traceId: 'trace-guidora-c99201f4',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    xmin: 49204,
    badge: 'warning',
    oldValues: {
      status: 'pending',
      actionTaken: null,
    },
    newValues: {
      status: 'resolved',
      actionTaken: 'Pricing updated to Freemium after vendor verification',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  },
  {
    id: 'log-105',
    action: 'ADMIN_SESSION_MFA_ESTABLISHED',
    entityName: 'Session',
    entityId: 'sess-adm-991',
    target: 'Admin Console Access',
    level: 'AUDIT',
    category: 'AUTH',
    actor: 'Tahsin Cr',
    actorEmail: 'tahsincrs@gmail.com',
    actorRole: 'admin',
    actorIp: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    traceId: 'trace-guidora-e18230aa',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    xmin: 49205,
    badge: 'success',
    oldValues: null,
    newValues: {
      sessionType: 'HttpOnly Secure Cookie + InMemory AccessToken',
      mfaMethod: 'FIDO2 / WebAuthn Hardware Security Key',
      expiryHours: 8,
    },
  },
  {
    id: 'log-106',
    action: 'CIRCUIT_BREAKER_PROBE_SUCCESS',
    entityName: 'CircuitBreaker',
    entityId: 'cb-dotnet-api',
    target: 'Guidora API /api/health/live',
    level: 'INFO',
    category: 'SYSTEM',
    actor: 'CircuitBreaker Watcher',
    actorEmail: 'engine@guidora.internal',
    actorRole: 'system',
    actorIp: '127.0.0.1',
    userAgent: 'Guidora-HealthProbe/1.0',
    traceId: 'trace-guidora-cb-0012',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    xmin: 49206,
    badge: 'info',
    oldValues: { state: 'HALF_OPEN', consecutiveFailures: 5 },
    newValues: { state: 'CLOSED', consecutiveFailures: 0, latencyMs: 8 },
  },
];

export function adminGetLogs() {
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return [...INITIAL_AUDIT_LOGS];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...INITIAL_AUDIT_LOGS];
  }
}

export function adminAddLog(action, target, badge = 'info', extraMeta = {}) {
  const logs = adminGetLogs();
  const levelMap = {
    info: 'INFO',
    success: 'AUDIT',
    warning: 'WARN',
    error: 'ERROR',
    critical: 'CRITICAL',
  };
  const categoryMap = {
    info: 'SYSTEM',
    success: 'CATALOG',
    warning: 'GOVERNANCE',
    error: 'SECURITY',
  };

  const newLog = {
    id: `log-${Date.now()}`,
    action: action.toUpperCase().replace(/\s+/g, '_'),
    entityName: extraMeta.entityName || 'Entity',
    entityId: extraMeta.entityId || `ent-${Date.now()}`,
    target,
    level: extraMeta.level || levelMap[badge] || 'INFO',
    category: extraMeta.category || categoryMap[badge] || 'SYSTEM',
    actor: extraMeta.actor || 'Tahsin Cr',
    actorEmail: extraMeta.actorEmail || 'tahsincrs@gmail.com',
    actorRole: extraMeta.actorRole || 'admin',
    actorIp: extraMeta.actorIp || '192.168.1.104',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'GuidoraCore/1.0',
    traceId: `trace-guidora-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: new Date().toISOString(),
    xmin: Math.floor(49200 + Math.random() * 500),
    badge,
    oldValues: extraMeta.oldValues || null,
    newValues: extraMeta.newValues || { summary: action, target },
  };

  const updated = [newLog, ...logs].slice(0, 100);
  try {
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function adminClearLogs() {
  try {
    localStorage.removeItem(ADMIN_LOGS_KEY);
    return [];
  } catch (e) {
    return [];
  }
}

export function adminRevertAuditLog(logId) {
  const logs = adminGetLogs();
  const targetLog = logs.find((l) => l.id === logId);
  if (!targetLog) {
    throw new Error('Audit log record not found.');
  }
  if (!targetLog.oldValues) {
    throw new Error('This audit log record does not contain prior state (oldValues) to revert to.');
  }

  // If entity is tool, restore overrides
  if (targetLog.entityName?.toLowerCase() === 'product' && targetLog.entityId) {
    adminUpdateTool(targetLog.entityId, targetLog.oldValues);
  }

  // Record an audit log for the reversion action
  const revertLog = {
    id: `log-${Date.now()}`,
    action: 'AUDIT_RECORD_REVERTED',
    entityName: targetLog.entityName,
    entityId: targetLog.entityId,
    target: `Reverted change from log [${targetLog.id}] on ${targetLog.target}`,
    level: 'AUDIT',
    category: 'GOVERNANCE',
    actor: 'Tahsin Cr',
    actorEmail: 'tahsincrs@gmail.com',
    actorRole: 'admin',
    actorIp: '192.168.1.104',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'GuidoraCore/1.0',
    traceId: `trace-guidora-rev-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: new Date().toISOString(),
    xmin: targetLog.xmin ? targetLog.xmin + 1 : 49999,
    badge: 'warning',
    oldValues: targetLog.newValues,
    newValues: targetLog.oldValues,
  };

  const updated = [revertLog, ...logs].slice(0, 100);
  localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(updated));
  return { success: true, revertLog, updatedLogs: updated };
}

// --- Product Edit Proposals (Governance Queue) ---
const INITIAL_PROPOSALS = [
  {
    id: 'prop-101',
    toolId: 'cursor-editor',
    toolName: 'Cursor AI',
    proposer: 'alex_frontend',
    proposerEmail: 'alex@devstack.org',
    proposerRole: 'creator',
    submittedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    status: 'pending', // 'pending' | 'accepted' | 'rejected'
    summary: 'Update pricing tiers for Pro & Claude 3.5 Sonnet support details',
    changes: {
      tagline: {
        old: 'The AI-first Code Editor',
        new: 'The AI Code Editor with Claude 3.5 Sonnet, GPT-4o, and Cursor Tab',
      },
      pricing: {
        old: 'Freemium ($20/mo)',
        new: 'Freemium ($20/mo Pro, $40/mo Business, Enterprise available)',
      },
      tags: {
        old: ['Editor', 'Developer', 'Copilot'],
        new: ['Editor', 'Developer', 'Copilot', 'Claude-3.5', 'Code-Gen'],
      },
    },
  },
  {
    id: 'prop-102',
    toolId: 'vllm-engine',
    toolName: 'vLLM Engine',
    proposer: 'neuro_researcher',
    proposerEmail: 'researcher@vllm.org',
    proposerRole: 'member',
    submittedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: 'pending',
    summary: 'Update GitHub repository stars count and v0.6 PagedAttention docs',
    changes: {
      githubStars: {
        old: '28.4k',
        new: '35.1k',
      },
      version: {
        old: 'v0.5.4',
        new: 'v0.6.2',
      },
    },
  },
];

export function adminGetProposals() {
  try {
    const raw = localStorage.getItem(PROPOSALS_KEY);
    if (!raw) {
      localStorage.setItem(PROPOSALS_KEY, JSON.stringify(INITIAL_PROPOSALS));
      return [...INITIAL_PROPOSALS];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...INITIAL_PROPOSALS];
  }
}

export function adminResolveProposal(proposalId, status, reviewNotes = '') {
  const proposals = adminGetProposals();
  let resolvedProposal = null;

  const updated = proposals.map((p) => {
    if (p.id === proposalId) {
      resolvedProposal = {
        ...p,
        status, // 'accepted' | 'rejected'
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Tahsin Cr',
        reviewNotes: reviewNotes.trim() || (status === 'accepted' ? 'Approved by admin' : 'Rejected after review'),
      };
      return resolvedProposal;
    }
    return p;
  });

  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(updated));

  // If accepted, automatically apply the new values to tool overrides!
  if (status === 'accepted' && resolvedProposal?.toolId && resolvedProposal?.changes) {
    const patch = {};
    Object.keys(resolvedProposal.changes).forEach((key) => {
      patch[key] = resolvedProposal.changes[key].new;
    });
    adminUpdateTool(resolvedProposal.toolId, patch);

    adminAddLog(
      'PROPOSAL_ACCEPTED_AND_APPLIED',
      `${resolvedProposal.toolName} (by ${resolvedProposal.proposer})`,
      'success',
      {
        entityName: 'ProductEditProposal',
        entityId: resolvedProposal.id,
        category: 'GOVERNANCE',
        newValues: patch,
      }
    );
  } else if (status === 'rejected') {
    adminAddLog(
      'PROPOSAL_REJECTED',
      `${resolvedProposal?.toolName || proposalId} (by ${resolvedProposal?.proposer || 'User'})`,
      'warning',
      {
        entityName: 'ProductEditProposal',
        entityId: proposalId,
        category: 'GOVERNANCE',
        newValues: { reviewNotes },
      }
    );
  }

  return { success: true, updated };
}

// --- Platform Stats Overview ---
export function adminGetStats(allTools = [], allUsers = []) {
  const categories = adminGetCategories();
  const organizations = getOrganizations();
  const reports = adminGetReports();
  const pendingReports = reports.filter((r) => !r.status || r.status === 'pending');
  const proposals = adminGetProposals();
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  const verifiedTools = allTools.filter((t) => t.verified?.admin || t.verified?.audited);
  const totalViews = allTools.reduce((acc, t) => {
    const v = parseFloat((t.views || '0').replace(/[^0-9.]/g, ''));
    return acc + (isNaN(v) ? 0 : v);
  }, 0);

  return {
    totalTools: allTools.length,
    verifiedTools: verifiedTools.length,
    totalCategories: categories.length - 1, // exclude 'all'
    totalOrganizations: organizations.length,
    totalUsers: allUsers.length || 4,
    pendingReports: pendingReports.length,
    pendingProposals: pendingProposals.length,
    approxViews: `${totalViews.toFixed(1)}k`,
  };
}

// --- High-Level PostgreSQL 18 Database Management ---
const VACUUM_STATUS_KEY = 'guidora_db_vacuum_status';

export function adminGetDatabaseStats(allTools = [], allCategories = [], allUsers = []) {
  const toolsCount = allTools.length || 24;
  const categoriesCount = allCategories.length || 8;
  const usersCount = allUsers.length || 4;
  const logsCount = adminGetLogs().length;
  const proposalsCount = adminGetProposals().length;
  const reportsCount = adminGetReports().length;
  const orgsCount = getOrganizations().length;
  const tagCatsCount = adminGetTagCategories().length;

  let customVacuum = {};
  try {
    customVacuum = JSON.parse(localStorage.getItem(VACUUM_STATUS_KEY) || '{}');
  } catch (e) {}

  const tables = [
    {
      name: 'products',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: toolsCount,
      tableSizeBytes: toolsCount * 78000 + 409600,
      tableSize: `${((toolsCount * 78000 + 409600) / 1024 / 1024).toFixed(2)} MB`,
      indexSize: '416 KB',
      totalSize: `${((toolsCount * 78000 + 409600 + 425984) / 1024 / 1024).toFixed(2)} MB`,
      deadTuples: customVacuum.products?.deadTuples ?? 6,
      lastVacuum: customVacuum.products?.lastVacuum ?? '18m ago',
      indexesCount: 4,
      status: 'HEALTHY',
    },
    {
      name: 'categories',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: categoriesCount,
      tableSizeBytes: categoriesCount * 8192 + 32768,
      tableSize: `${Math.round((categoriesCount * 8192 + 32768) / 1024)} KB`,
      indexSize: '32 KB',
      totalSize: `${Math.round((categoriesCount * 8192 + 65536) / 1024)} KB`,
      deadTuples: customVacuum.categories?.deadTuples ?? 0,
      lastVacuum: customVacuum.categories?.lastVacuum ?? '1h ago',
      indexesCount: 2,
      status: 'OPTIMAL',
    },
    {
      name: 'category_taxonomies',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: tagCatsCount,
      tableSizeBytes: 131072,
      tableSize: '128 KB',
      indexSize: '64 KB',
      totalSize: '192 KB',
      deadTuples: customVacuum.category_taxonomies?.deadTuples ?? 1,
      lastVacuum: customVacuum.category_taxonomies?.lastVacuum ?? '2h ago',
      indexesCount: 3,
      status: 'OPTIMAL',
    },
    {
      name: 'product_edit_proposals',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: proposalsCount,
      tableSizeBytes: 262144,
      tableSize: '256 KB',
      indexSize: '80 KB',
      totalSize: '336 KB',
      deadTuples: customVacuum.product_edit_proposals?.deadTuples ?? 2,
      lastVacuum: customVacuum.product_edit_proposals?.lastVacuum ?? '35m ago',
      indexesCount: 3,
      status: 'HEALTHY',
    },
    {
      name: 'audit_logs',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap (Append-only)',
      rowCount: logsCount,
      tableSizeBytes: logsCount * 32000 + 1048576,
      tableSize: `${((logsCount * 32000 + 1048576) / 1024 / 1024).toFixed(2)} MB`,
      indexSize: '1.24 MB',
      totalSize: `${((logsCount * 32000 + 1048576 + 1300000) / 1024 / 1024).toFixed(2)} MB`,
      deadTuples: customVacuum.audit_logs?.deadTuples ?? 0,
      lastVacuum: customVacuum.audit_logs?.lastVacuum ?? '12m ago',
      indexesCount: 5,
      status: 'OPTIMAL',
    },
    {
      name: 'users',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: usersCount,
      tableSizeBytes: 327680,
      tableSize: '320 KB',
      indexSize: '128 KB',
      totalSize: '448 KB',
      deadTuples: customVacuum.users?.deadTuples ?? 0,
      lastVacuum: customVacuum.users?.lastVacuum ?? '45m ago',
      indexesCount: 3,
      status: 'OPTIMAL',
    },
    {
      name: 'roles',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: 4,
      tableSizeBytes: 16384,
      tableSize: '16 KB',
      indexSize: '16 KB',
      totalSize: '32 KB',
      deadTuples: 0,
      lastVacuum: '3d ago',
      indexesCount: 2,
      status: 'STATIC',
    },
    {
      name: 'comments',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: 12,
      tableSizeBytes: 524288,
      tableSize: '512 KB',
      indexSize: '160 KB',
      totalSize: '672 KB',
      deadTuples: customVacuum.comments?.deadTuples ?? 3,
      lastVacuum: customVacuum.comments?.lastVacuum ?? '1h ago',
      indexesCount: 3,
      status: 'HEALTHY',
    },
    {
      name: 'organizations',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / Heap',
      rowCount: orgsCount,
      tableSizeBytes: 147456,
      tableSize: '144 KB',
      indexSize: '48 KB',
      totalSize: '192 KB',
      deadTuples: customVacuum.organizations?.deadTuples ?? 0,
      lastVacuum: customVacuum.organizations?.lastVacuum ?? '2h ago',
      indexesCount: 2,
      status: 'OPTIMAL',
    },
    {
      name: '__ef_migrations_history',
      schema: 'public',
      engine: 'PostgreSQL 18.0 / EF Core',
      rowCount: 6,
      tableSizeBytes: 32768,
      tableSize: '32 KB',
      indexSize: '16 KB',
      totalSize: '48 KB',
      deadTuples: 0,
      lastVacuum: '4d ago',
      indexesCount: 1,
      status: 'LOCKED',
    },
  ];

  return {
    databaseName: 'guidora_production_pg18',
    serverVersion: 'PostgreSQL 18.0 on x86_64-pc-linux-gnu (Compiled Sept 2026)',
    connectionPool: {
      active: 8,
      idle: 12,
      max: 50,
      utilizationPercent: 16,
    },
    cacheHitRatio: '99.4%',
    tablesTotalCount: tables.length,
    totalSizeBytes: tables.reduce((acc, t) => acc + t.tableSizeBytes, 0),
    tables,
  };
}

export function adminTriggerVacuum(tableName) {
  let customVacuum = {};
  try {
    customVacuum = JSON.parse(localStorage.getItem(VACUUM_STATUS_KEY) || '{}');
  } catch (e) {}

  customVacuum[tableName] = {
    deadTuples: 0,
    lastVacuum: 'Just now',
    vacuumedAt: new Date().toISOString(),
  };

  localStorage.setItem(VACUUM_STATUS_KEY, JSON.stringify(customVacuum));

  adminAddLog(
    'DATABASE_VACUUM_EXECUTED',
    `VACUUM (VERBOSE, ANALYZE) on ${tableName}`,
    'info',
    {
      entityName: 'DatabaseTable',
      entityId: tableName,
      category: 'DATABASE',
      newValues: { command: `VACUUM ANALYZE ${tableName};`, status: 'SUCCESS' },
    }
  );

  return customVacuum[tableName];
}

export function adminGetTableSchema(tableName) {
  const schemas = {
    products: [
      { column: 'id', type: 'uuid', nullable: false, key: 'PK', default: 'gen_random_uuid()' },
      { column: 'slug', type: 'varchar(150)', nullable: false, key: 'UNI', default: null, index: 'ix_products_slug (B-Tree)' },
      { column: 'name', type: 'varchar(200)', nullable: false, key: '', default: null },
      { column: 'tagline', type: 'varchar(300)', nullable: false, key: '', default: null },
      { column: 'description', type: 'text', nullable: true, key: '', default: null },
      { column: 'category_id', type: 'varchar(50)', nullable: false, key: 'FK', default: null, index: 'ix_products_category_id' },
      { column: 'pricing', type: 'varchar(80)', nullable: false, key: '', default: "'Free'" },
      { column: 'rating', type: 'numeric(3,2)', nullable: false, key: '', default: '0.00' },
      { column: 'views_count', type: 'integer', nullable: false, key: '', default: '0' },
      { column: 'is_verified', type: 'boolean', nullable: false, key: '', default: 'false' },
      { column: 'metadata', type: 'jsonb', nullable: true, key: '', default: "'{}'::jsonb", index: 'ix_products_metadata_gin (GIN)' },
      { column: 'search_vector', type: 'tsvector', nullable: true, key: '', default: 'GENERATED ALWAYS', index: 'ix_products_search_vector (GIN)' },
      { column: 'xmin', type: 'xid', nullable: false, key: 'SYS', default: 'SYSTEM', note: 'PostgreSQL Row Version for Concurrency' },
      { column: 'created_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()' },
      { column: 'updated_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()' },
    ],
    categories: [
      { column: 'id', type: 'varchar(50)', nullable: false, key: 'PK', default: null },
      { column: 'name', type: 'varchar(100)', nullable: false, key: '', default: null },
      { column: 'color', type: 'varchar(30)', nullable: false, key: '', default: "'#8A38F5'" },
      { column: 'icon', type: 'varchar(50)', nullable: true, key: '', default: null },
      { column: 'translations', type: 'jsonb', nullable: true, key: '', default: "'{}'::jsonb" },
      { column: 'is_popular', type: 'boolean', nullable: false, key: '', default: 'false' },
      { column: 'display_order', type: 'integer', nullable: false, key: '', default: '0' },
      { column: 'xmin', type: 'xid', nullable: false, key: 'SYS', default: 'SYSTEM' },
    ],
    product_edit_proposals: [
      { column: 'id', type: 'uuid', nullable: false, key: 'PK', default: 'gen_random_uuid()' },
      { column: 'product_id', type: 'uuid', nullable: false, key: 'FK', default: null, index: 'ix_proposals_product_id' },
      { column: 'proposer_id', type: 'uuid', nullable: false, key: 'FK', default: null },
      { column: 'status', type: 'varchar(20)', nullable: false, key: '', default: "'Pending'", index: 'ix_proposals_status' },
      { column: 'delta_changes', type: 'jsonb', nullable: false, key: '', default: null },
      { column: 'review_notes', type: 'text', nullable: true, key: '', default: null },
      { column: 'reviewed_by_id', type: 'uuid', nullable: true, key: 'FK', default: null },
      { column: 'created_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()' },
      { column: 'reviewed_at', type: 'timestamptz', nullable: true, key: '', default: null },
    ],
    audit_logs: [
      { column: 'id', type: 'bigserial', nullable: false, key: 'PK', default: null },
      { column: 'action', type: 'varchar(100)', nullable: false, key: '', default: null, index: 'ix_audit_logs_action' },
      { column: 'entity_name', type: 'varchar(80)', nullable: false, key: '', default: null },
      { column: 'entity_id', type: 'varchar(100)', nullable: true, key: '', default: null },
      { column: 'level', type: 'varchar(20)', nullable: false, key: '', default: "'INFO'", index: 'ix_audit_logs_level' },
      { column: 'category', type: 'varchar(30)', nullable: false, key: '', default: "'SYSTEM'" },
      { column: 'actor_name', type: 'varchar(100)', nullable: false, key: '', default: null },
      { column: 'actor_email', type: 'varchar(150)', nullable: true, key: '', default: null },
      { column: 'actor_ip', type: 'inet', nullable: true, key: '', default: null },
      { column: 'trace_id', type: 'varchar(64)', nullable: false, key: '', default: null, index: 'ix_audit_logs_trace_id' },
      { column: 'old_values', type: 'jsonb', nullable: true, key: '', default: null },
      { column: 'new_values', type: 'jsonb', nullable: true, key: '', default: null },
      { column: 'created_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()', index: 'ix_audit_logs_created_at (BRIN)' },
    ],
    users: [
      { column: 'id', type: 'uuid', nullable: false, key: 'PK', default: 'gen_random_uuid()' },
      { column: 'email', type: 'varchar(255)', nullable: false, key: 'UNI', default: null, index: 'ix_users_email (B-Tree)' },
      { column: 'username', type: 'varchar(60)', nullable: false, key: 'UNI', default: null, index: 'ix_users_username (B-Tree)' },
      { column: 'password_hash', type: 'varchar(255)', nullable: false, key: '', default: null },
      { column: 'role', type: 'varchar(30)', nullable: false, key: '', default: "'member'" },
      { column: 'is_banned', type: 'boolean', nullable: false, key: '', default: 'false' },
      { column: 'reputation', type: 'integer', nullable: false, key: '', default: '100' },
      { column: 'created_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()' },
    ],
  };

  return schemas[tableName] || [
    { column: 'id', type: 'uuid', nullable: false, key: 'PK', default: 'gen_random_uuid()' },
    { column: 'name', type: 'varchar(255)', nullable: false, key: '', default: null },
    { column: 'created_at', type: 'timestamptz', nullable: false, key: '', default: 'clock_timestamp()' },
  ];
}

// --- EF Core Migrations Timeline ---
export function adminGetMigrations() {
  return [
    {
      migrationId: '20260920084512_InitialCreate',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-20 08:45:12 UTC',
      status: 'APPLIED',
      description: 'Initial schema setup: Products, Categories, Users, Roles, Comments',
    },
    {
      migrationId: '20260922113000_AddProductEditProposals',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-22 11:30:00 UTC',
      status: 'APPLIED',
      description: 'Added ProductEditProposals table with JSONB delta storage & review workflows',
    },
    {
      migrationId: '20260924141520_AddFullTextSearchTsVector',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-24 14:15:20 UTC',
      status: 'APPLIED',
      description: 'Generated tsvector SearchVector column with PostgreSQL GIN index on products',
    },
    {
      migrationId: '20260925091244_AddAuditConcurrencyXmin',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-25 09:12:44 UTC',
      status: 'APPLIED',
      description: 'Configured xmin shadow property for optimistic concurrency token & Audit revert',
    },
    {
      migrationId: '20260927160533_AddCategoryTaxonomyHierarchy',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-27 16:05:33 UTC',
      status: 'APPLIED',
      description: 'Hierarchical category taxonomies and multi-lingual translation JSONB columns',
    },
    {
      migrationId: '20260928172000_BootstrapAdminUniqueIndexFix',
      productVersion: 'Microsoft.EntityFrameworkCore.PostgreSQL 10.0.0',
      appliedAt: '2026-09-28 17:20:00 UTC',
      status: 'APPLIED',
      description: 'PostgreSQL advisory locks & deterministic unique index for BootstrapAdminManager',
    },
  ];
}

// --- Safe Read-Only SQL Query Runner ---
export function adminExecuteQuery(query, context = {}) {
  const start = performance.now();
  const cleanQuery = (query || '').trim().replace(/;+$/, '');
  const upper = cleanQuery.toUpperCase();

  // Safety checks
  const destructiveKeywords = ['DROP ', 'TRUNCATE ', 'ALTER ', 'DELETE FROM', 'UPDATE ', 'INSERT INTO'];
  for (const kw of destructiveKeywords) {
    if (upper.includes(kw)) {
      throw new Error(`Write/Destructive query [${kw.trim()}] is blocked. Admin Query Explorer operates in Safe Read-Only (SELECT) mode.`);
    }
  }

  const { allTools = [], allCategories = [], allUsers = [] } = context;
  const auditLogs = adminGetLogs();
  const proposals = adminGetProposals();

  let columns = [];
  let rows = [];

  if (upper.includes('FROM PRODUCTS') || upper.includes('FROM "PRODUCTS"')) {
    columns = ['id', 'name', 'category', 'pricing', 'rating', 'views', 'verified'];
    rows = (allTools.length ? allTools : [
      { id: 'neurogen-studio', name: 'NeuroGen Studio', category: 'generative-art', pricing: 'Freemium', rating: 4.8, views: '1.2M', verified: true },
      { id: 'cursor-editor', name: 'Cursor AI', category: 'developer-tools', pricing: 'Freemium', rating: 4.9, views: '840k', verified: true },
      { id: 'midjourney', name: 'Midjourney', category: 'generative-art', pricing: 'Paid', rating: 4.9, views: '3.1M', verified: true },
      { id: 'vllm-engine', name: 'vLLM', category: 'developer-tools', pricing: 'Free & Open Source', rating: 4.95, views: '450k', verified: true },
    ]).map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      pricing: t.pricing || 'Freemium',
      rating: t.rating || 4.5,
      views: t.views || '10k',
      verified: Boolean(t.verified?.admin || t.verified),
    }));
  } else if (upper.includes('FROM CATEGORIES') || upper.includes('FROM "CATEGORIES"')) {
    columns = ['id', 'name', 'color', 'isPopular', 'toolsCount'];
    rows = adminGetCategories().map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color || '#8A38F5',
      isPopular: Boolean(c.popular),
      toolsCount: allTools.filter((t) => t.category === c.id).length,
    }));
  } else if (upper.includes('FROM AUDIT_LOGS') || upper.includes('FROM "AUDIT_LOGS"')) {
    columns = ['id', 'action', 'entity', 'level', 'actor', 'traceId', 'timestamp'];
    rows = auditLogs.slice(0, 20).map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.target || l.entityName,
      level: l.level || 'INFO',
      actor: l.actor,
      traceId: l.traceId || 'N/A',
      timestamp: l.timestamp,
    }));
  } else if (upper.includes('FROM PRODUCT_EDIT_PROPOSALS') || upper.includes('FROM PROPOSALS')) {
    columns = ['id', 'toolName', 'proposer', 'status', 'summary', 'submittedAt'];
    rows = proposals.map((p) => ({
      id: p.id,
      toolName: p.toolName,
      proposer: p.proposer,
      status: p.status,
      summary: p.summary,
      submittedAt: p.submittedAt,
    }));
  } else if (upper.includes('FROM USERS') || upper.includes('FROM "USERS"')) {
    columns = ['id', 'username', 'email', 'role', 'reputation', 'joinedDate'];
    rows = (allUsers.length ? allUsers : [
      { id: 'usr_admin_01', username: 'tahsincr', email: 'tahsincrs@gmail.com', role: 'admin', reputation: 980, joinedDate: 'Sept 2024' },
      { id: 'usr_mod_04', username: 'DenizMod', email: 'deniz@guidora.ai', role: 'moderator', reputation: 640, joinedDate: 'Oct 2024' },
      { id: 'usr_dev_09', username: 'alex_frontend', email: 'alex@devstack.org', role: 'creator', reputation: 320, joinedDate: 'Jan 2025' },
    ]).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      reputation: u.reputation || 100,
      joinedDate: u.joinedDate || 'Recently',
    }));
  } else {
    // Default fallback sample query result
    columns = ['metric_key', 'metric_value', 'status'];
    rows = [
      { metric_key: 'pg_active_connections', metric_value: '8 / 50', status: 'HEALTHY' },
      { metric_key: 'buffer_cache_hit_ratio', metric_value: '99.42%', status: 'OPTIMAL' },
      { metric_key: 'total_tables_count', metric_value: '10 tables', status: 'SYNCED' },
      { metric_key: 'last_checkpoint_lsn', metric_value: '0/1F8A9020', status: 'COMMITTED' },
    ];
  }

  const durationMs = Math.round((performance.now() - start) + 4 + Math.random() * 8);

  return {
    query: cleanQuery,
    columns,
    rows,
    rowCount: rows.length,
    executionTimeMs: durationMs,
    timestamp: new Date().toISOString(),
  };
}

// --- Time Series Data for Analytics Charts (14-Day Traffic & Latency) ---
export function adminGetTimeSeriesData(days = 14) {
  const result = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const dateStr = d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });

    // Deterministic organic wave for stats
    const wave = Math.sin(i * 0.45) * 1.5;
    const baseRequests = 14.2 + wave + (i % 3 === 0 ? 1.8 : 0.4);
    const baseLatency = 16.5 - wave * 1.8 + (i % 2 === 0 ? 2.1 : -1.2);
    const errorRate = Math.max(0.01, (0.04 - wave * 0.01).toFixed(2));

    result.push({
      date: dateStr,
      isoDate: d.toISOString().split('T')[0],
      requestsK: parseFloat(baseRequests.toFixed(1)),
      p95LatencyMs: Math.round(baseLatency),
      errorRatePercent: parseFloat(errorRate),
      activeSessions: Math.round(28 + wave * 4 + (i % 2) * 5),
    });
  }

  return result;
}

// --- Backup & Restore & Reset ---
export function adminExportAllData() {
  const data = {
    database: 'guidora_production_pg18',
    categories: localStorage.getItem(CATEGORIES_KEY),
    deletedTools: localStorage.getItem(DELETED_TOOLS_KEY),
    toolOverrides: localStorage.getItem(TOOL_OVERRIDES_KEY),
    reports: localStorage.getItem(REPORTS_KEY),
    proposals: localStorage.getItem(PROPOSALS_KEY),
    organizations: localStorage.getItem('guidora_organizations'),
    users: localStorage.getItem('guidora_all_users'),
    customTools: localStorage.getItem('guidora_custom_tools'),
    auditLogs: localStorage.getItem(ADMIN_LOGS_KEY),
    exportDate: new Date().toISOString(),
    version: '2.0-pg18',
  };
  return JSON.stringify(data, null, 2);
}

export function adminImportAllData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.categories) localStorage.setItem(CATEGORIES_KEY, parsed.categories);
    if (parsed.deletedTools) localStorage.setItem(DELETED_TOOLS_KEY, parsed.deletedTools);
    if (parsed.toolOverrides) localStorage.setItem(TOOL_OVERRIDES_KEY, parsed.toolOverrides);
    if (parsed.reports) localStorage.setItem(REPORTS_KEY, parsed.reports);
    if (parsed.proposals) localStorage.setItem(PROPOSALS_KEY, parsed.proposals);
    if (parsed.organizations) localStorage.setItem('guidora_organizations', parsed.organizations);
    if (parsed.users) localStorage.setItem('guidora_all_users', parsed.users);
    if (parsed.customTools) localStorage.setItem('guidora_custom_tools', parsed.customTools);
    if (parsed.auditLogs) localStorage.setItem(ADMIN_LOGS_KEY, parsed.auditLogs);
    adminAddLog('BACKUP_RESTORED', 'Platform Storage JSON archive', 'warning');
    return true;
  } catch (e) {
    throw new Error('Geçersiz JSON yedek dosyası.');
  }
}

export function adminResetToDefaults() {
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(TAGS_KEY);
  localStorage.removeItem(DELETED_TOOLS_KEY);
  localStorage.removeItem(TOOL_OVERRIDES_KEY);
  localStorage.removeItem(REPORTS_KEY);
  localStorage.removeItem(PROPOSALS_KEY);
  localStorage.removeItem('guidora_organizations');
  localStorage.removeItem('guidora_all_users');
  localStorage.removeItem('guidora_custom_tools');
  localStorage.removeItem(ADMIN_LOGS_KEY);
  localStorage.removeItem(VACUUM_STATUS_KEY);
  return true;
}



