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

// --- Platform Stats Overview ---
export function adminGetStats(allTools = [], allUsers = []) {
  const categories = adminGetCategories();
  const organizations = getOrganizations();
  const reports = adminGetReports();
  const pendingReports = reports.filter((r) => !r.status || r.status === 'pending');

  const verifiedTools = allTools.filter((t) => t.verified?.admin || t.verified?.audited);

  return {
    totalTools: allTools.length,
    verifiedTools: verifiedTools.length,
    totalCategories: categories.length - 1, // exclude 'all'
    totalOrganizations: organizations.length,
    totalUsers: allUsers.length || 3,
    pendingReports: pendingReports.length,
  };
}
