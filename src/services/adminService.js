import { CATEGORIES } from './mockData';
import { getOrganizations } from './userService';

const CATEGORIES_KEY = 'guidora_custom_categories';
const DELETED_TOOLS_KEY = 'guidora_deleted_tool_ids';
const TOOL_OVERRIDES_KEY = 'guidora_tool_overrides';
const REPORTS_KEY = 'guidora_reports';
const USERS_KEY = 'guidora_all_users';

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

export function adminAddCategory({ name, color = '#8A38F5', isPopular = false }) {
  const current = adminGetCategories();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (current.some((c) => c.id === id)) {
    throw new Error('A category with this name already exists.');
  }

  const newCat = {
    id,
    name: name.trim(),
    count: 0,
    color,
    isPopular: Boolean(isPopular),
  };

  const updated = [...current, newCat];
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return newCat;
}

export function adminUpdateCategory(catId, updates) {
  const current = adminGetCategories();
  const updated = current.map((c) => {
    if (c.id === catId) {
      return { ...c, ...updates };
    }
    return c;
  });
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
}

export function adminDeleteCategory(catId) {
  if (catId === 'all') {
    throw new Error('Cannot delete the root "All Tools" category.');
  }
  const current = adminGetCategories();
  const updated = current.filter((c) => c.id !== catId);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
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
const ADMIN_LOGS_KEY = 'guidora_admin_audit_logs';

export function adminGetLogs() {
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 'log-1', action: 'System Initialized', target: 'Guidora Engine', admin: 'Tahsin Can', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), badge: 'info' },
      { id: 'log-2', action: 'Tool Verified', target: 'NeuroGen Studio', admin: 'Tahsin Can', timestamp: new Date(Date.now() - 3600000).toISOString(), badge: 'success' },
      { id: 'log-3', action: 'Role Updated', target: 'Elena Rostova (Creator)', admin: 'Tahsin Can', timestamp: new Date(Date.now() - 1800000).toISOString(), badge: 'warning' },
    ];
  } catch (e) {
    return [];
  }
}

export function adminAddLog(action, target, badge = 'info') {
  const logs = adminGetLogs();
  const newLog = {
    id: `log-${Date.now()}`,
    action,
    target,
    admin: 'Tahsin Can',
    timestamp: new Date().toISOString(),
    badge,
  };
  const updated = [newLog, ...logs].slice(0, 50); // keep last 50
  try {
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// --- Platform Stats Overview ---
export function adminGetStats(allTools = [], allUsers = []) {
  const categories = adminGetCategories();
  const organizations = getOrganizations();
  const reports = adminGetReports();
  const pendingReports = reports.filter((r) => !r.status || r.status === 'pending');

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
    totalUsers: allUsers.length || 3,
    pendingReports: pendingReports.length,
    approxViews: `${totalViews.toFixed(1)}k`,
  };
}

// --- Backup & Restore & Reset ---
export function adminExportAllData() {
  const data = {
    categories: localStorage.getItem(CATEGORIES_KEY),
    deletedTools: localStorage.getItem(DELETED_TOOLS_KEY),
    toolOverrides: localStorage.getItem(TOOL_OVERRIDES_KEY),
    reports: localStorage.getItem(REPORTS_KEY),
    organizations: localStorage.getItem('guidora_organizations'),
    users: localStorage.getItem('guidora_all_users'),
    customTools: localStorage.getItem('guidora_custom_tools'),
    exportDate: new Date().toISOString(),
    version: '1.2',
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
    if (parsed.organizations) localStorage.setItem('guidora_organizations', parsed.organizations);
    if (parsed.users) localStorage.setItem('guidora_all_users', parsed.users);
    if (parsed.customTools) localStorage.setItem('guidora_custom_tools', parsed.customTools);
    adminAddLog('Data Backup Restored', 'Platform Storage', 'warning');
    return true;
  } catch (e) {
    throw new Error('Invalid JSON backup file.');
  }
}

export function adminResetToDefaults() {
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(DELETED_TOOLS_KEY);
  localStorage.removeItem(TOOL_OVERRIDES_KEY);
  localStorage.removeItem(REPORTS_KEY);
  localStorage.removeItem('guidora_organizations');
  localStorage.removeItem('guidora_all_users');
  localStorage.removeItem('guidora_custom_tools');
  localStorage.removeItem(ADMIN_LOGS_KEY);
  return true;
}


