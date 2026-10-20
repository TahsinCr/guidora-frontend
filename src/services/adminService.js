import { CATEGORIES, TAG_CATEGORIES } from './mockData';
import { getOrganizations, adminUpdateOrganization } from './userService';
import { isMockMode } from './config/modeService';
import { getCategoryColor } from '@/constants/categoryIcons';
import * as adminApi from './api/adminApi';

export { adminUpdateOrganization };

export const CATEGORIES_KEY = 'guidora_custom_categories';
export const TAGS_KEY = 'guidora_custom_tags';
const DELETED_CATEGORIES_KEY = 'guidora_deleted_categories';
const DELETED_TOOLS_KEY = 'guidora_deleted_tool_ids';
const TOOL_OVERRIDES_KEY = 'guidora_tool_overrides';
const REPORTS_KEY = 'guidora_reports';
const USERS_KEY = 'guidora_all_users';

let cachedBackendCategories = null;
let cachedBackendTagCategories = null;
let cachedBackendProposals = null;
let cachedBackendReports = null;

export function adminClearBackendCache() {
  cachedBackendCategories = null;
  cachedBackendTagCategories = null;
  cachedBackendProposals = null;
  cachedBackendReports = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('guidora_mode_change', () => {
    adminClearBackendCache();
  });
}

function notifyTaxonomyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_taxonomy_change'));
  }
}

function getLocalStoredCategoriesRaw() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalStoredTagsRaw() {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// --- Async Backend Fetchers ---

export async function adminFetchCategories() {
  if (isMockMode()) {
    return adminGetCategories();
  }
  const localStored = getLocalStoredCategoriesRaw();
  const localMap = new Map(localStored.map((c) => [c.id, c]));
  const deletedCats = JSON.parse(localStorage.getItem(DELETED_CATEGORIES_KEY) || '[]');

  try {
    const list = await adminApi.fetchCategoriesForManagement();
    const mapped = (list || [])
      .map((dto, idx) => {
        const slug = dto.slug || String(dto.id);
        const localOverride = localMap.get(slug);
        const resolvedColor =
          localOverride?.color || dto.color || getCategoryColor(slug) || '#8A38F5';
        const resolvedPopular =
          localOverride?.isPopular !== undefined ? Boolean(localOverride.isPopular) : idx < 6;
        return {
          id: slug,
          numericId: dto.id,
          name: localOverride?.name || dto.name,
          translations: localOverride?.translations || {},
          count: localOverride?.count || 0,
          color: resolvedColor,
          isPopular: resolvedPopular,
          popular: resolvedPopular,
          isActive: dto.isActive !== false,
          description: localOverride?.description ?? dto.description ?? '',
        };
      })
      .filter((c) => !deletedCats.includes(c.id));

    for (const lc of localStored) {
      if (lc.id !== 'all' && !deletedCats.includes(lc.id) && !mapped.some((m) => m.id === lc.id)) {
        mapped.push({
          ...lc,
          color: lc.color || getCategoryColor(lc.id),
        });
      }
    }

    if (!mapped.some((c) => c.id === 'all')) {
      mapped.unshift({
        id: 'all',
        name: 'Tüm Araçlar',
        translations: { en: 'All Tools', ru: 'Все инструменты' },
        count: 0,
        color: '#8A38F5',
        isPopular: true,
        popular: true,
      });
    }
    cachedBackendCategories = mapped;
    return cachedBackendCategories;
  } catch (err) {
    console.warn('[adminService] adminFetchCategories error, fallback to local/mock:', err);
    return adminGetCategories();
  }
}

export async function adminFetchTagCategories() {
  if (isMockMode()) {
    return adminGetTagCategories();
  }
  const localStored = getLocalStoredTagsRaw();
  try {
    const [cats, tags] = await Promise.all([
      adminApi.fetchTagCategories(),
      adminApi.fetchTags(),
    ]);
    const mapped = (cats || []).map((c) => {
      const catId = c.id ?? c.tagCategoryId;
      const catName = c.name ?? c.tagCategoryName ?? `Group #${catId}`;
      const groupTags = (tags || []).filter((t) => t.tagCategoryId === catId);
      const localMatch = localStored.find(
        (lg) =>
          String(lg.id) === String(catId) ||
          lg.numericId === catId ||
          lg.name?.toLowerCase() === catName.toLowerCase()
      );
      const mergedTags = groupTags.map((t) => {
        const tId = t.id ?? t.tagId;
        const tName = t.name ?? t.tagName;
        return {
          id: t.slug || String(tId),
          numericId: tId,
          name: tName,
          translations: {},
          only: Boolean(localMatch?.isSingleSelect ?? c.isSingleSelect),
        };
      });

      if (localMatch && Array.isArray(localMatch.tags)) {
        for (const lt of localMatch.tags) {
          if (
            !mergedTags.some(
              (mt) => mt.id === lt.id || mt.name?.toLowerCase() === lt.name?.toLowerCase()
            )
          ) {
            mergedTags.push(lt);
          }
        }
      }

      return {
        id: localMatch?.id || String(catId),
        numericId: catId,
        name: localMatch?.name || catName,
        translations: localMatch?.translations || {},
        isSingleSelect: Boolean(localMatch?.isSingleSelect ?? c.isSingleSelect),
        tags: mergedTags,
      };
    });

    for (const lg of localStored) {
      if (
        !mapped.some(
          (m) =>
            String(m.id) === String(lg.id) ||
            m.name?.toLowerCase() === lg.name?.toLowerCase()
        )
      ) {
        mapped.push(lg);
      }
    }

    cachedBackendTagCategories = mapped;
    return cachedBackendTagCategories;
  } catch (err) {
    console.warn('[adminService] adminFetchTagCategories error, fallback to local/mock:', err);
    return adminGetTagCategories();
  }
}

export async function adminFetchProposals() {
  const localProposals = (() => {
    try {
      const raw = localStorage.getItem(PROPOSALS_KEY);
      if (raw) return JSON.parse(raw);
      localStorage.setItem(PROPOSALS_KEY, JSON.stringify(INITIAL_PROPOSALS));
      return [...INITIAL_PROPOSALS];
    } catch {
      return [...INITIAL_PROPOSALS];
    }
  })();

  if (isMockMode()) {
    return localProposals;
  }
  try {
    const items = await adminApi.fetchPendingProposals();
    const statusMap = { 1: 'pending', 2: 'accepted', 3: 'rejected' };
    const mapped = (items || []).map((p) => {
      const localMatch = localProposals.find(
        (lp) => String(lp.id) === String(p.id) || lp.numericId === p.id
      );
      const status =
        localMatch?.status ||
        (typeof p.status === 'number' ? statusMap[p.status] || 'pending' : p.status || 'pending');
      return {
        id: String(p.id),
        numericId: p.id,
        toolId: String(p.productId),
        toolName: p.name || `Tool #${p.productId}`,
        proposer: `User #${p.proposedByUserId || 'Anon'}`,
        proposerEmail: '',
        proposerRole: 'contributor',
        submittedAt: p.createdAt || new Date().toISOString(),
        status,
        summary: p.shortDescription || p.name || 'Öneri',
        changes: {
          name: { old: '', new: p.name || '' },
          slug: { old: '', new: p.slug || '' },
          shortDescription: { old: '', new: p.shortDescription || '' },
          description: { old: '', new: p.description || '' },
          websiteUrl: { old: '', new: p.websiteUrl || '' },
        },
      };
    });

    const merged = [...mapped];
    for (const lp of localProposals) {
      if (!merged.some((m) => String(m.id) === String(lp.id))) {
        merged.push(lp);
      }
    }
    cachedBackendProposals = merged;
    return cachedBackendProposals;
  } catch (err) {
    cachedBackendProposals = localProposals;
    return localProposals;
  }
}

const INITIAL_REPORTS = [
  {
    id: 'rep-seed-101',
    toolId: 'v0-dev',
    toolName: 'v0 by Vercel',
    reason: 'Fiyatlandırma bilgisi güncellenmeli',
    details: 'Kurumsal plan ve takım lisans kotaları son sürümde güncellendi, katalog açıklaması eski kotayı gösteriyor.',
    reporter: 'deniz@guidora.io',
    email: 'deniz@guidora.io',
    reportedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    submittedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    status: 'pending',
    actionTaken: '',
  },
  {
    id: 'rep-seed-102',
    toolId: 'cursor-editor',
    toolName: 'Cursor',
    reason: 'Dokümantasyon bağlantısı yönlendirme yapıyor',
    details: 'API referans adresi docs.cursor.com altına taşındı.',
    reporter: 'alex@community.org',
    email: 'alex@community.org',
    reportedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    submittedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    status: 'resolved',
    actionTaken: 'Dokümantasyon bağlantısı güncellendi',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export async function adminFetchReports() {
  const localReports = (() => {
    try {
      const raw = localStorage.getItem(REPORTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
      return [...INITIAL_REPORTS];
    } catch {
      return [...INITIAL_REPORTS];
    }
  })();

  if (isMockMode()) {
    return localReports;
  }
  try {
    const items = await adminApi.fetchOpenReports();
    const mapped = (items || []).map((r) => {
      const localMatch = localReports.find(
        (lr) => String(lr.id) === String(r.id) || lr.numericId === r.id
      );
      return {
        id: String(r.id),
        numericId: r.id,
        toolId: String(r.productId),
        toolName: localMatch?.toolName || r.productName || `Araç #${r.productId}`,
        reason: r.description || `Bildirim #${r.reportReasonId || 1}`,
        details: r.description || '',
        reporter: `Üye #${r.reportedByUserId || 'Anonim'}`,
        reportedAt: r.createdAt || new Date().toISOString(),
        status: localMatch?.status || (r.resolvedAt ? 'resolved' : 'pending'),
        actionTaken: localMatch?.actionTaken || '',
        resolvedAt: localMatch?.resolvedAt || r.resolvedAt,
      };
    });

    const merged = [...mapped];
    for (const lr of localReports) {
      if (!merged.some((m) => String(m.id) === String(lr.id))) {
        merged.push(lr);
      }
    }
    cachedBackendReports = merged;
    return cachedBackendReports;
  } catch (err) {
    cachedBackendReports = localReports;
    return localReports;
  }
}

export async function adminFetchAll() {
  if (isMockMode()) {
    return {
      categories: adminGetCategories(),
      tagCategories: adminGetTagCategories(),
      proposals: adminGetProposals(),
      reports: adminGetReports(),
    };
  }
  const [categories, tagCategories, proposals, reports] = await Promise.all([
    adminFetchCategories(),
    adminFetchTagCategories(),
    adminFetchProposals(),
    adminFetchReports(),
  ]);
  return { categories, tagCategories, proposals, reports };
}

// --- Tag Categories & Tags Management ---
export function adminGetTagCategories() {
  if (!isMockMode() && cachedBackendTagCategories && cachedBackendTagCategories.length > 0) {
    return cachedBackendTagCategories;
  }
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
  if (!isMockMode()) {
    const numericId = Number(tagCategoryId);
    if (!isNaN(numericId) && numericId > 0) {
      adminApi.updateTagCategory(numericId, { name, isSingleSelect })
        .catch(err => console.warn('[adminService] Backend updateTagCategory error:', err));
    }
  }
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId || group.numericId === Number(tagCategoryId)) {
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
  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminAddTagCategory({ id, name, translations = {}, isSingleSelect = false }) {
  const slug = (id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug || !name?.trim()) {
    throw new Error('Valid category name is required.');
  }
  const currentCategories = adminGetTagCategories();
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
  if (!isMockMode()) {
    adminApi.createTagCategory({ name: name.trim(), isSingleSelect: Boolean(isSingleSelect) })
      .then(res => {
        if (res?.id) newCat.numericId = res.id;
      })
      .catch(err => console.warn('[adminService] Backend createTagCategory error:', err));
  }
  const updated = [...currentCategories, newCat];
  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return newCat;
}

export function adminDeleteTagCategory(tagCategoryId) {
  if (!isMockMode()) {
    const numericId = Number(tagCategoryId);
    if (!isNaN(numericId) && numericId > 0) {
      adminApi.deleteTagCategory(numericId)
        .catch(err => console.warn('[adminService] Backend deleteTagCategory error:', err));
    }
  }
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.filter((g) => g.id !== tagCategoryId && g.numericId !== Number(tagCategoryId));
  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminAddTag(tagCategoryId, { name, translations = {}, isSingleSelect = false }) {
  const currentCategories = adminGetTagCategories();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newTag = {
    id: slug,
    name: name.trim(),
    translations: {
      tr: translations?.tr?.trim() || '',
      ru: translations?.ru?.trim() || '',
    },
    only: isSingleSelect,
  };

  if (!isMockMode()) {
    const numCatId = Number(tagCategoryId);
    if (!isNaN(numCatId) && numCatId > 0) {
      adminApi.createTag({ name: name.trim(), tagCategoryId: numCatId })
        .then(res => {
          if (res?.id) newTag.numericId = res.id;
        })
        .catch(err => console.warn('[adminService] Backend createTag error:', err));
    }
  }
  
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId || group.numericId === Number(tagCategoryId)) {
      if (group.tags.some((t) => t.id === slug || t.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('This tag already exists in this category.');
      }
      return {
        ...group,
        tags: [
          ...group.tags,
          {
            ...newTag,
            only: group.isSingleSelect || isSingleSelect,
          },
        ],
      };
    }
    return group;
  });

  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminDeleteTag(tagCategoryId, tagId) {
  if (!isMockMode()) {
    const numTagId = Number(tagId);
    if (!isNaN(numTagId) && numTagId > 0) {
      adminApi.deleteTag(numTagId)
        .catch(err => console.warn('[adminService] Backend deleteTag error:', err));
    }
  }
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId || group.numericId === Number(tagCategoryId)) {
      return {
        ...group,
        tags: group.tags.filter((t) => t.id !== tagId && t.name !== tagId && t.numericId !== Number(tagId)),
      };
    }
    return group;
  });

  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminUpdateTag(tagCategoryId, tagId, updates) {
  if (!isMockMode()) {
    const numTagId = Number(tagId);
    const numCatId = Number(tagCategoryId);
    if (!isNaN(numTagId) && numTagId > 0 && !isNaN(numCatId) && numCatId > 0) {
      adminApi.updateTag(numTagId, { name: updates.name, tagCategoryId: numCatId })
        .catch(err => console.warn('[adminService] Backend updateTag error:', err));
    }
  }
  const currentCategories = adminGetTagCategories();
  const updated = currentCategories.map((group) => {
    if (group.id === tagCategoryId || group.numericId === Number(tagCategoryId)) {
      return {
        ...group,
        tags: group.tags.map((tag) => {
          if (tag.id === tagId || tag.numericId === Number(tagId)) {
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

  if (!isMockMode()) {
    cachedBackendTagCategories = updated;
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

// --- Categories ---
export function adminGetCategories() {
  if (!isMockMode() && cachedBackendCategories && cachedBackendCategories.length > 0) {
    return cachedBackendCategories;
  }
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

export function adminAddCategory({ name, translations = {}, color = '#8A38F5', isPopular = false, description = '' }) {
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
    popular: Boolean(isPopular),
    description,
  };

  if (!isMockMode()) {
    adminApi.createCategory({ name: name.trim(), slug: id, description })
      .then(res => {
        if (res?.id) newCat.numericId = res.id;
      })
      .catch(err => console.warn('[adminService] Backend createCategory error:', err));
  }

  const updated = [...current, newCat];
  if (!isMockMode()) {
    cachedBackendCategories = updated;
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return newCat;
}

export function adminUpdateCategory(catId, updates) {
  if (!isMockMode()) {
    const numId = Number(catId);
    if (!isNaN(numId) && numId > 0) {
      adminApi.updateCategory(numId, {
        name: updates.name,
        slug: updates.slug || updates.id || catId,
        description: updates.description || '',
      }).catch(err => console.warn('[adminService] Backend updateCategory error:', err));
    }
  }
  const current = adminGetCategories();
  const updated = current.map((c) => {
    if (c.id === catId || c.numericId === Number(catId)) {
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
  if (!isMockMode()) {
    cachedBackendCategories = updated;
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  notifyTaxonomyChange();
  return updated;
}

export function adminDeleteCategory(catId) {
  if (catId === 'all') {
    throw new Error('Cannot delete the root "All Tools" category.');
  }
  if (!isMockMode()) {
    const numId = Number(catId);
    if (!isNaN(numId) && numId > 0) {
      adminApi.deleteCategory(numId)
        .catch(err => console.warn('[adminService] Backend deleteCategory error:', err));
    }
  }
  try {
    const deletedCats = JSON.parse(localStorage.getItem(DELETED_CATEGORIES_KEY) || '[]');
    if (!deletedCats.includes(catId)) {
      deletedCats.push(catId);
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedCats));
    }
  } catch (e) {}
  const current = adminGetCategories();
  const updated = current.filter((c) => c.id !== catId && c.numericId !== Number(catId));
  if (!isMockMode()) {
    cachedBackendCategories = updated;
  }
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
  if (!isMockMode() && cachedBackendReports && cachedBackendReports.length > 0) {
    return cachedBackendReports;
  }
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function adminResolveReport(reportId, actionTaken = 'Reviewed') {
  if (!isMockMode()) {
    const numId = Number(reportId);
    if (!isNaN(numId) && numId > 0) {
      adminApi.resolveReport(numId, actionTaken)
        .catch(err => console.warn('[adminService] Backend resolveReport error:', err));
    }
  }
  const reports = adminGetReports();
  const updated = reports.map((rep) => {
    if (rep.id === reportId || rep.numericId === Number(reportId)) {
      return {
        ...rep,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        actionTaken,
      };
    }
    return rep;
  });
  if (!isMockMode()) {
    cachedBackendReports = updated;
  }
  localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
  return updated;
}

export function adminDismissReport(reportId) {
  if (!isMockMode()) {
    const numId = Number(reportId);
    if (!isNaN(numId) && numId > 0) {
      adminApi.dismissReport(numId)
        .catch(err => console.warn('[adminService] Backend dismissReport error:', err));
    }
  }
  const reports = adminGetReports();
  const updated = reports.map((rep) => {
    if (rep.id === reportId || rep.numericId === Number(reportId)) {
      return {
        ...rep,
        status: 'dismissed',
        resolvedAt: new Date().toISOString(),
      };
    }
    return rep;
  });
  if (!isMockMode()) {
    cachedBackendReports = updated;
  }
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
    action: 'CACHE_WARMUP_COMPLETED',
    entityName: 'CacheCluster',
    entityId: 'catalog-cache-v1',
    target: 'Catalog Edge Cache',
    level: 'INFO',
    category: 'SYSTEM',
    actor: 'System Cache Worker',
    actorEmail: 'system@internal.cluster',
    actorRole: 'system',
    actorIp: '127.0.0.1',
    userAgent: 'GuidoraCacheWorker/1.0',
    traceId: 'trace-guidora-cache-0041',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    badge: 'info',
    oldValues: null,
    newValues: {
      keysPreloaded: 184,
      hitRatio: '99.4%',
      warmupDurationMs: 14.8,
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
    entityId: 'cb-api-cluster',
    target: 'Guidora API /health/live',
    level: 'INFO',
    category: 'SYSTEM',
    actor: 'CircuitBreaker Watcher',
    actorEmail: 'engine@guidora.internal',
    actorRole: 'system',
    actorIp: '127.0.0.1',
    userAgent: 'Guidora-HealthProbe/1.0',
    traceId: 'trace-guidora-cb-0012',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
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

  if (!isMockMode() && (typeof logId === 'number' || (/^\d+$/.test(String(logId)) && !String(logId).startsWith('log-')))) {
    const numId = Number(logId);
    if (!isNaN(numId) && numId > 0) {
      adminApi.revertAuditLog(numId).catch((err) => console.warn('[adminService] Backend revertAuditLog error:', err));
    }
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
  if (!isMockMode() && cachedBackendProposals && cachedBackendProposals.length > 0) {
    return cachedBackendProposals;
  }
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
  if (!isMockMode()) {
    const numId = Number(proposalId);
    if (!isNaN(numId) && numId > 0) {
      if (status === 'accepted') {
        adminApi.acceptProposal(numId).catch(err => console.warn('[adminService] Backend acceptProposal error:', err));
      } else {
        adminApi.rejectProposal(numId, reviewNotes).catch(err => console.warn('[adminService] Backend rejectProposal error:', err));
      }
    }
  }

  const proposals = adminGetProposals();
  let resolvedProposal = null;

  const updated = proposals.map((p) => {
    if (p.id === proposalId || p.numericId === Number(proposalId)) {
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

  if (!isMockMode()) {
    cachedBackendProposals = updated;
  }
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
export function adminGetStats(allTools = [], allUsers = [], extra = {}) {
  const categories = Array.isArray(extra.categories) && extra.categories.length > 0
    ? extra.categories
    : adminGetCategories();
  const organizations = Array.isArray(extra.organizations)
    ? extra.organizations
    : getOrganizations();
  const reports = Array.isArray(extra.reports)
    ? extra.reports
    : adminGetReports();
  const pendingReports = reports.filter((r) => !r.status || r.status === 'pending');
  const proposals = Array.isArray(extra.proposals)
    ? extra.proposals
    : adminGetProposals();
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  const verifiedTools = allTools.filter((t) => t.verified?.admin || t.verified?.audited);
  const totalViews = allTools.reduce((acc, t) => {
    const v = parseFloat((t.views || '0').replace(/[^0-9.]/g, ''));
    return acc + (isNaN(v) ? 0 : v);
  }, 0);

  return {
    totalTools: allTools.length,
    verifiedTools: verifiedTools.length,
    totalCategories: Math.max(0, categories.filter((c) => c.id !== 'all').length),
    totalOrganizations: organizations.length,
    totalUsers: allUsers.length || 4,
    pendingReports: pendingReports.length,
    pendingProposals: pendingProposals.length,
    approxViews: `${totalViews.toFixed(1)}k`,
  };
}

// --- Backend-Agnostic Domain Entity Schemas & REST API Contracts ---

export function adminGetEntitySchemas() {
  return {
    products: {
      id: 'products',
      name: 'Product / ToolItem',
      pluralName: 'Yazılım & Geliştirici Araçları',
      description: 'Guidora platformundaki tüm doğrulanmış ve listelenmiş yazılım ve geliştirici araçlarının temel veri modeli.',
      icon: 'Wrench',
      category: 'Katalog',
      fields: [
        { name: 'id', type: 'uuid', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Benzersiz araç slug veya kimlik belirteci', example: 'neurogen-studio' },
        { name: 'slug', type: 'varchar(150)', required: true, isPrimaryKey: false, isUnique: true, isIndexed: true, description: 'URL dostu benzersiz slug', example: 'neurogen-studio' },
        { name: 'name', type: 'varchar(200)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Aracın resmi pazar adı', example: 'NeuroGen Studio' },
        { name: 'tagline', type: 'varchar(300)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Kısa slogan veya tek cümlelik özet', example: 'Next-gen generative AI canvas' },
        { name: 'description', type: 'text', required: false, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Detaylı tanıtım ve README içeriği', example: 'Deep neural network powered creative studio...' },
        { name: 'category_id', type: 'varchar(50)', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'Bağlı olduğu kategori slug kimliği', example: 'generative-art' },
        { name: 'pricing', type: 'varchar(80)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Fiyatlandırma etiketi', example: 'Freemium' },
        { name: 'rating', type: 'numeric(3,2)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Kullanıcı ortalama puanı (0.0 - 5.0)', example: '4.85' },
        { name: 'views_count', type: 'integer', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Toplam görüntülenme sayısı', example: '12400' },
        { name: 'is_verified', type: 'boolean', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Doğrulama durumu', example: 'true' },
        { name: 'metadata', type: 'json', required: false, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Esnek JSON meta verileri', example: '{"platform": ["Web", "API"]}' },
        { name: 'search_vector', type: 'text', required: false, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Hızlı tam metin arama vektörü', example: 'GENERATED ALWAYS' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Kayıt oluşturulma zaman damgası', example: '2026-01-15T00:00:00Z' },
        { name: 'updated_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Son güncelleme zaman damgası', example: '2026-09-28T12:00:00Z' },
      ],
      relationships: [
        { targetEntity: 'categories', type: 'N:1', foreignKey: 'category_id', description: 'Her araç tek bir ana kategoriye aittir.' },
        { targetEntity: 'reviews', type: '1:N', foreignKey: 'tool_id', description: 'Bir araç birden fazla kullanıcı değerlendirmesine sahip olabilir.' },
        { targetEntity: 'proposals', type: '1:N', foreignKey: 'product_id', description: 'Bir araç için birden fazla düzenleme teklifi verilebilir.' },
      ],
      samplePayload: {
        id: 'neurogen-studio',
        slug: 'neurogen-studio',
        name: 'NeuroGen Studio',
        tagline: 'Next-gen generative AI canvas',
        category_id: 'generative-art',
        pricing: 'Freemium',
        rating: 4.85,
        views_count: 12400,
        is_verified: true,
      },
    },
    categories: {
      id: 'categories',
      name: 'Category',
      pluralName: 'Kategoriler',
      description: 'Araç kataloğunun birincil taksonomi ağacı ve vitrin gruplaması.',
      icon: 'FolderTree',
      category: 'Katalog',
      fields: [
        { name: 'id', type: 'varchar(50)', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Kategori benzersiz slug belirteci', example: 'generative-art' },
        { name: 'name', type: 'varchar(100)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Görünen kategori başlığı', example: 'Generative Art' },
        { name: 'color', type: 'varchar(30)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Arayüz aksan rengi', example: '#8A38F5' },
        { name: 'icon', type: 'varchar(50)', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'İkon bileşeni adı', example: 'Sparkles' },
        { name: 'translations', type: 'json', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'TR, EN, RU çevirileri', example: '{"tr": "Üretici Sanat", "ru": "Генеративное искусство"}' },
        { name: 'is_popular', type: 'boolean', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Ana sayfa öne çıkan vitrin rozeti', example: 'true' },
        { name: 'display_order', type: 'integer', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Görünüm sıralaması', example: '1' },
      ],
      relationships: [
        { targetEntity: 'products', type: '1:N', foreignKey: 'category_id', description: 'Bir kategori altında yüzlerce araç listelenir.' },
      ],
      samplePayload: {
        id: 'generative-art',
        name: 'Generative Art',
        color: '#8A38F5',
        icon: 'Sparkles',
        is_popular: true,
        display_order: 1,
      },
    },
    tags: {
      id: 'tags',
      name: 'Tag & Taxonomy',
      pluralName: 'Etiket Grupları',
      description: 'Çok boyutlu filtreleme sağlayan hiyerarşik taksonomi ve etiket modelleri.',
      icon: 'Tag',
      category: 'Katalog',
      fields: [
        { name: 'id', type: 'varchar(60)', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Etiket kimliği', example: 'tag_freemium' },
        { name: 'name', type: 'varchar(80)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Görünen etiket adı', example: 'Freemium' },
        { name: 'tag_category_id', type: 'varchar(50)', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'Bağlı olduğu etiket grubu', example: 'pricing_model' },
        { name: 'is_single_select', type: 'boolean', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Grup içinde tek seçim kuralı', example: 'true' },
      ],
      relationships: [
        { targetEntity: 'products', type: 'M:N', foreignKey: 'tags', description: 'Araçlar ve etiketler çoktan çoğa ilişkilidir.' },
      ],
      samplePayload: {
        id: 'tag_freemium',
        name: 'Freemium',
        tag_category_id: 'pricing_model',
        is_single_select: true,
      },
    },
    users: {
      id: 'users',
      name: 'User / Identity',
      pluralName: 'Kullanıcı Hesapları',
      description: 'Kimlik doğrulama, oturum yönetimi ve rol bazlı erişim modeli.',
      icon: 'Users',
      category: 'Topluluk',
      fields: [
        { name: 'id', type: 'uuid', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Kullanıcı benzersiz kimliği', example: 'usr_admin_01' },
        { name: 'email', type: 'varchar(255)', required: true, isPrimaryKey: false, isUnique: true, isIndexed: true, description: 'Doğrulanmış e-posta adresi', example: 'tahsincrs@gmail.com' },
        { name: 'username', type: 'varchar(60)', required: true, isPrimaryKey: false, isUnique: true, isIndexed: true, description: 'Benzersiz kullanıcı takma adı', example: 'tahsincr' },
        { name: 'role', type: 'varchar(30)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'admin | moderator | creator | member', example: 'admin' },
        { name: 'is_banned', type: 'boolean', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Engellenme durumu', example: 'false' },
        { name: 'reputation', type: 'integer', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Topluluk itibar puanı', example: '980' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Kayıt tarihi', example: '2024-09-01T00:00:00Z' },
      ],
      relationships: [
        { targetEntity: 'reviews', type: '1:N', foreignKey: 'user_id', description: 'Kullanıcının yazdığı incelemeler.' },
        { targetEntity: 'proposals', type: '1:N', foreignKey: 'proposer_id', description: 'Kullanıcının sunduğu araç düzenleme teklifleri.' },
        { targetEntity: 'audit_logs', type: '1:N', foreignKey: 'actor_name', description: 'Kullanıcının gerçekleştirdiği yönetimsel eylemler.' },
      ],
      samplePayload: {
        id: 'usr_admin_01',
        username: 'tahsincr',
        email: 'tahsincrs@gmail.com',
        role: 'admin',
        reputation: 980,
      },
    },
    product_edit_proposals: {
      id: 'product_edit_proposals',
      name: 'ProductEditProposal',
      pluralName: 'Düzenleme Teklifleri',
      description: 'Topluluk ve oluşturucuların önerdiği değişikliklerin onay kuyruğu modeli.',
      icon: 'GitPullRequest',
      category: 'Topluluk',
      fields: [
        { name: 'id', type: 'uuid', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Teklif kimliği', example: 'prop-101' },
        { name: 'product_id', type: 'uuid', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'İlgili araç slug kimliği', example: 'cursor-editor' },
        { name: 'proposer_id', type: 'uuid', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Teklifi sunan kullanıcı kimliği', example: 'usr_dev_03' },
        { name: 'status', type: 'varchar(20)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Pending | Approved | Rejected', example: 'Pending' },
        { name: 'delta_changes', type: 'json', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: '{ field: { old, new } } fark nesnesi', example: '{"pricing": {"old": "$20", "new": "$16"}}' },
        { name: 'review_notes', type: 'text', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Moderatör değerlendirme notu', example: 'Fiyatlandırma doğrulandı.' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Gönderim zamanı', example: '2026-09-28T18:00:00Z' },
      ],
      relationships: [
        { targetEntity: 'products', type: 'N:1', foreignKey: 'product_id', description: 'Teklif belirli bir aracı hedefler.' },
      ],
      samplePayload: {
        id: 'prop-101',
        product_id: 'cursor-editor',
        status: 'Pending',
        delta_changes: { pricing: { old: '$20/mo', new: '$16/mo (Annual)' } },
      },
    },
    reviews: {
      id: 'reviews',
      name: 'Review',
      pluralName: 'Kullanıcı Değerlendirmeleri',
      description: 'Doğrulanmış kullanıcıların araçlar için yazdığı yıldız puanları ve detaylı incelemeler.',
      icon: 'MessageSquare',
      category: 'Topluluk',
      fields: [
        { name: 'id', type: 'uuid', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Değerlendirme kimliği', example: 'rev-301' },
        { name: 'tool_id', type: 'varchar(150)', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'İncelemenin ait olduğu araç slug kimliği', example: 'neurogen-studio' },
        { name: 'user_id', type: 'varchar(100)', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'Yorumu yazan kullanıcının kimliği', example: 'usr_alex_02' },
        { name: 'author_name', type: 'varchar(120)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Yazar adı', example: 'Alex V.' },
        { name: 'rating', type: 'integer', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Verilen yıldız puanı (1 - 5)', example: '5' },
        { name: 'comment', type: 'text', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'İnceleme metni', example: 'Harika bir platform, latency süresi inanılmaz iyi.' },
        { name: 'helpful_count', type: 'integer', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Faydalı bulan kullanıcı sayısı', example: '14' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Oluşturulma zamanı', example: '2026-09-27T10:00:00Z' },
      ],
      relationships: [
        { targetEntity: 'products', type: 'N:1', foreignKey: 'tool_id', description: 'İncelemenin bağlı olduğu yapay zeka aracı.' },
        { targetEntity: 'users', type: 'N:1', foreignKey: 'user_id', description: 'İncelemeyi yazan kullanıcı.' },
      ],
      samplePayload: {
        id: 'rev-301',
        tool_id: 'neurogen-studio',
        author_name: 'Alex V.',
        rating: 5,
        comment: 'Harika bir platform, latency süresi inanılmaz iyi.',
        helpful_count: 14,
      },
    },
    reports: {
      id: 'reports',
      name: 'Report',
      pluralName: 'Kullanıcı Şikayetleri',
      description: 'Hatalı linkler, telif hakkı veya yanıltıcı bilgiler için iletilen moderasyon bildirimleri.',
      icon: 'AlertTriangle',
      category: 'Moderasyon',
      fields: [
        { name: 'id', type: 'uuid', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Şikayet raporu kimliği', example: 'rep-401' },
        { name: 'tool_id', type: 'varchar(150)', required: true, isPrimaryKey: false, isForeignKey: true, isIndexed: true, description: 'Şikayet edilen araç kimliği', example: 'neurogen-studio' },
        { name: 'reason', type: 'varchar(100)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Şikayet kategorisi / nedeni', example: 'broken_link' },
        { name: 'details', type: 'text', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Kullanıcının eklediği detaylar', example: 'Web sitesi linki 404 dönüyor.' },
        { name: 'reporter_email', type: 'varchar(255)', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Bildirim yapan kişinin e-postası', example: 'user@example.com' },
        { name: 'status', type: 'varchar(30)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'pending | resolved | dismissed', example: 'pending' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Bildirim zamanı', example: '2026-09-28T08:30:00Z' },
      ],
      relationships: [
        { targetEntity: 'products', type: 'N:1', foreignKey: 'tool_id', description: 'Şikayete konu olan araç.' },
      ],
      samplePayload: {
        id: 'rep-401',
        tool_id: 'neurogen-studio',
        reason: 'broken_link',
        details: 'Web sitesi linki 404 dönüyor.',
        status: 'pending',
      },
    },
    audit_logs: {
      id: 'audit_logs',
      name: 'AuditLog',
      pluralName: 'Denetim Günlüğü',
      description: 'Tüm yönetimsel işlemlerin ve veri değişikliklerinin değişmez olay kaydı.',
      icon: 'FileText',
      category: 'Sistem',
      fields: [
        { name: 'id', type: 'bigserial', required: true, isPrimaryKey: true, isUnique: true, isIndexed: true, description: 'Kayıt kimliği', example: 'log-101' },
        { name: 'action', type: 'varchar(100)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Gerçekleştirilen eylem tipi', example: 'PRODUCT_STATUS_VERIFIED' },
        { name: 'entity_name', type: 'varchar(80)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Hedef varlık adı', example: 'Product' },
        { name: 'entity_id', type: 'varchar(100)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'Hedef varlık kimliği', example: 'neurogen-studio' },
        { name: 'level', type: 'varchar(20)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'INFO | AUDIT | WARN | ERROR', example: 'AUDIT' },
        { name: 'actor_name', type: 'varchar(100)', required: true, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Eylemi yapan kişi / servis', example: 'Tahsin Cr' },
        { name: 'trace_id', type: 'varchar(64)', required: false, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'OpenTelemetry dağıtık izleme kimliği', example: 'trace-guidora-b472c1a8' },
        { name: 'old_values', type: 'json', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Önceki durum delta nesnesi', example: '{"verified": false}' },
        { name: 'new_values', type: 'json', required: false, isPrimaryKey: false, isUnique: false, isIndexed: false, description: 'Yeni durum delta nesnesi', example: '{"verified": true}' },
        { name: 'created_at', type: 'timestamp', required: true, isPrimaryKey: false, isUnique: false, isIndexed: true, description: 'İşlem zaman damgası', example: '2026-09-28T18:00:00Z' },
      ],
      relationships: [
        { targetEntity: 'users', type: 'N:1', foreignKey: 'actor_name', description: 'Eylemi yapan kullanıcı.' },
      ],
      samplePayload: {
        id: 'log-101',
        action: 'PRODUCT_STATUS_VERIFIED',
        entity_name: 'Product',
        entity_id: 'neurogen-studio',
        actor_name: 'Tahsin Cr',
        level: 'AUDIT',
      },
    },
  };
}

export function adminGetApiEndpoints() {
  return [
    {
      method: 'GET',
      path: '/api/products',
      summary: 'Katalog Araç Listesi & Filtreleme',
      description: 'Arama terimi, kategori slug, etiketler ve sayfalamayla araç listesini döndürür.',
      authLevel: 'Public',
      queryParams: [
        { name: 'search', type: 'string', required: false, description: 'Arama anahtar kelimesi' },
        { name: 'category', type: 'string', required: false, description: 'Kategori slug filtresi' },
        { name: 'sort', type: 'string', required: false, description: 'relevance | highest-rated | newest' },
        { name: 'page', type: 'integer', required: false, description: 'Sayfa numarası (varsayılan: 1)' },
        { name: 'limit', type: 'integer', required: false, description: 'Sayfa başı kayıt (varsayılan: 12)' },
      ],
      responseCodes: ['200 OK', '400 Bad Request'],
      sampleResponse: {
        items: [{ id: 'neurogen-studio', name: 'NeuroGen Studio', rating: 4.85, category: 'generative-art' }],
        total: 24,
        page: 1,
        limit: 12,
        hasMore: true,
      },
    },
    {
      method: 'GET',
      path: '/api/products/:id',
      summary: 'Araç Detayı',
      description: 'Slug veya numericId ile belirtilen aracın tüm detaylarını, incelemelerini ve ilişkilerini getirir.',
      authLevel: 'Public',
      queryParams: [],
      responseCodes: ['200 OK', '404 Not Found'],
      sampleResponse: {
        id: 'neurogen-studio',
        name: 'NeuroGen Studio',
        tagline: 'Next-gen generative AI canvas',
        category: 'generative-art',
        pricing: 'Freemium',
        rating: 4.85,
      },
    },
    {
      method: 'POST',
      path: '/api/products',
      summary: 'Yeni Araç Oluştur / Gönder',
      description: 'Topluluk veya yönetici tarafından yeni bir yapay zeka aracını kataloğa ekler.',
      authLevel: 'Member / Admin',
      requestBodySchema: {
        name: 'string (required)',
        slug: 'string (optional)',
        tagline: 'string (required)',
        description: 'string',
        website: 'string (URL, required)',
        categoryIds: 'number[]',
        tagIds: 'number[]',
      },
      responseCodes: ['201 Created', '400 Bad Request', '401 Unauthorized'],
      sampleResponse: {
        success: true,
        message: 'Araç başarıyla kaydedildi.',
        data: { id: 'quantum-forge', name: 'Quantum Forge AI' },
      },
    },
    {
      method: 'PUT',
      path: '/api/products/:id',
      summary: 'Araç Bilgilerini Güncelle',
      description: 'Yönetici veya araç sahibi tarafından meta verileri, fiyatlandırmayı ve doğrulamayı günceller.',
      authLevel: 'Admin / Creator',
      responseCodes: ['200 OK', '400 Bad Request', '403 Forbidden', '404 Not Found'],
      sampleResponse: { success: true, message: 'Araç güncellendi.' },
    },
    {
      method: 'DELETE',
      path: '/api/products/:id',
      summary: 'Aracı Arşivle / Sil (Soft Delete)',
      description: 'Aracı aktif katalogdan kaldırır ve arşiv statüsüne taşır.',
      authLevel: 'Admin',
      responseCodes: ['200 OK', '403 Forbidden', '404 Not Found'],
      sampleResponse: { success: true, message: 'Araç arşivlendi.' },
    },
    {
      method: 'GET',
      path: '/api/categories',
      summary: 'Taksonomi Kategorileri',
      description: 'Tüm kategorileri, renk paletlerini, çevirilerini ve popülerlik durumlarını listeler.',
      authLevel: 'Public',
      responseCodes: ['200 OK'],
      sampleResponse: [
        { id: 'generative-art', name: 'Generative Art', color: '#8A38F5', isPopular: true },
        { id: 'developer-tools', name: 'Developer Tools', color: '#3B82F6', isPopular: true },
      ],
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      summary: 'Kullanıcı Oturum Açma (JWT)',
      description: 'E-posta/kullanıcı adı ve şifreyle doğrular; memory access token ve HttpOnly refresh çerezi döndürür.',
      authLevel: 'Public',
      requestBodySchema: {
        email: 'string (required)',
        password: 'string (required)',
        rememberMe: 'boolean',
      },
      responseCodes: ['200 OK', '400 Validation Error', '401 Unauthorized'],
      sampleResponse: {
        success: true,
        data: {
          accessToken: { token: 'jwt.token.string', expiration: '2026-09-28T21:00:00Z', role: 'admin' },
          user: { id: 'usr_admin_01', username: 'tahsincr', role: 'admin' },
        },
      },
    },
    {
      method: 'POST',
      path: '/api/auth/refresh',
      summary: 'Sessiz Token Yenileme',
      description: 'Tarayıcıdaki HttpOnly çerezi okuyarak yeni bir kısa ömürlü access token üretir.',
      authLevel: 'Public (Cookie-based)',
      responseCodes: ['200 OK', '401 Unauthorized'],
      sampleResponse: {
        success: true,
        data: { accessToken: { token: 'new.jwt.token' } },
      },
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      summary: 'Oturumu Kapat',
      description: 'Yenileme çerezini temizler ve oturum tokenını geçersiz kılar.',
      authLevel: 'Public',
      responseCodes: ['200 OK'],
      sampleResponse: { success: true },
    },
    {
      method: 'GET',
      path: '/api/proposals',
      summary: 'Topluluk Değişiklik Teklifleri',
      description: 'Onay bekleyen araç düzenleme tekliflerini alan bazlı delta değişiklikleriyle döndürür.',
      authLevel: 'Moderator / Admin',
      responseCodes: ['200 OK', '403 Forbidden'],
      sampleResponse: [{ id: 'prop-101', toolId: 'cursor-editor', status: 'pending' }],
    },
    {
      method: 'PUT',
      path: '/api/proposals/:id/approve',
      summary: 'Teklifi Onayla & Kataloğa Uygula',
      description: 'Teklifteki delta değişikliklerini atomik olarak hedef araca yansıtır ve durumu onaylandı yapar.',
      authLevel: 'Admin',
      responseCodes: ['200 OK', '400 Bad Request', '404 Not Found'],
      sampleResponse: { success: true, message: 'Teklif onaylandı ve araca uygulandı.' },
    },
    {
      method: 'GET',
      path: '/health/live',
      summary: 'Liveness Sağlık Kontrolü',
      description: 'Sistemin ayakta olduğunu ve HTTP trafiği kabul ettiğini doğrular.',
      authLevel: 'Public',
      responseCodes: ['200 OK Healthy'],
      sampleResponse: { status: 'Healthy', timestamp: '2026-09-28T18:00:00Z' },
    },
  ];
}

export function adminGetSystemHealth() {
  return {
    apiStatus: 'HEALTHY',
    latencyMs: 8,
    uptime: '99.98%',
    activeSessions: 124,
    rateLimitQuota: '99.8%',
    circuitBreaker: 'CLOSED',
    cacheHitRatio: '99.4%',
    architecture: 'RESTful Contract-First',
  };
}

export function adminGetDatabaseStats(allTools = [], allCategories = [], allUsers = []) {
  const schemas = adminGetEntitySchemas();
  const toolsCount = allTools.length || 24;
  const categoriesCount = allCategories.length || 8;
  const usersCount = allUsers.length || 4;
  const logsCount = adminGetLogs().length;
  const proposalsCount = adminGetProposals().length;

  const entities = [
    { name: 'products', modelName: 'ToolItem', count: toolsCount, fieldsCount: schemas.products.fields.length, status: 'HEALTHY' },
    { name: 'categories', modelName: 'Category', count: categoriesCount, fieldsCount: schemas.categories.fields.length, status: 'OPTIMAL' },
    { name: 'tags', modelName: 'Tag', count: 32, fieldsCount: schemas.tags.fields.length, status: 'OPTIMAL' },
    { name: 'users', modelName: 'User', count: usersCount, fieldsCount: schemas.users.fields.length, status: 'OPTIMAL' },
    { name: 'proposals', modelName: 'ProductEditProposal', count: proposalsCount, fieldsCount: schemas.product_edit_proposals.fields.length, status: 'HEALTHY' },
    { name: 'reviews', modelName: 'Review', count: 128, fieldsCount: schemas.reviews.fields.length, status: 'OPTIMAL' },
    { name: 'reports', modelName: 'Report', count: 12, fieldsCount: schemas.reports.fields.length, status: 'HEALTHY' },
    { name: 'audit_logs', modelName: 'AuditLog', count: logsCount, fieldsCount: schemas.audit_logs.fields.length, status: 'OPTIMAL' },
  ];

  return {
    databaseName: 'guidora_production_schema',
    serverVersion: 'Backend-Agnostic Entity Layer v2.0',
    architecture: 'RESTful Entity Architecture',
    apiStatus: 'HEALTHY',
    cacheHitRatio: '99.4%',
    tablesTotalCount: entities.length,
    entitiesTotalCount: entities.length,
    entities,
    // Preserve tables alias for test compatibility
    tables: entities.map((e) => ({
      name: e.name,
      rowCount: e.count,
      engine: 'REST Entity Model',
      status: e.status,
    })),
  };
}

export function adminTriggerVacuum(tableName) {
  adminAddLog(
    'ENTITY_CACHE_PURGED',
    `Cache purged for entity ${tableName}`,
    'info',
    {
      entityName: tableName,
      category: 'SYSTEM',
      newValues: { status: 'SUCCESS' },
    }
  );
  return {
    deadTuples: 0,
    lastVacuum: 'Just now',
  };
}

export function adminGetTableSchema(tableName) {
  const schemas = adminGetEntitySchemas();
  const entity = schemas[tableName] || Object.values(schemas).find((s) => s.id === tableName);
  if (entity) {
    return entity.fields.map((f) => ({
      column: f.name,
      type: f.type,
      nullable: !f.required,
      key: f.isPrimaryKey ? 'PK' : f.isForeignKey ? 'FK' : f.isUnique ? 'UNI' : '',
      default: f.isPrimaryKey ? 'UUID / Auto' : null,
      description: f.description,
      note: f.description,
    }));
  }
  return [
    { column: 'id', type: 'uuid', nullable: false, key: 'PK', default: 'UUID / Auto' },
    { column: 'name', type: 'varchar(255)', nullable: false, key: '', default: null },
    { column: 'created_at', type: 'timestamp', nullable: false, key: '', default: 'CURRENT_TIMESTAMP' },
  ];
}

export function adminGetMigrations() {
  return [
    {
      migrationId: '20260920_InitialSchema',
      productVersion: 'Guidora Schema v1.0',
      appliedAt: '2026-09-20 08:45:12 UTC',
      status: 'APPLIED',
      description: 'Initial domain schema: Products, Categories, Users, Roles, Comments',
    },
    {
      migrationId: '20260922_ProductEditProposals',
      productVersion: 'Guidora Schema v1.1',
      appliedAt: '2026-09-22 11:30:00 UTC',
      status: 'APPLIED',
      description: 'Added ProductEditProposals table with JSON delta storage & review workflows',
    },
    {
      migrationId: '20260924_CategoryTaxonomyHierarchy',
      productVersion: 'Guidora Schema v1.2',
      appliedAt: '2026-09-27 16:05:33 UTC',
      status: 'APPLIED',
      description: 'Hierarchical category taxonomies and multi-lingual translation models',
    },
    {
      migrationId: '20260928_BootstrapAdminUnifiedIdentity',
      productVersion: 'Guidora Schema v2.0',
      appliedAt: '2026-09-28 17:20:00 UTC',
      status: 'APPLIED',
      description: 'Decoupled single admin environment variable architecture and backend-agnostic contracts',
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
      { metric_key: 'db_active_connections', metric_value: '8 / 50', status: 'HEALTHY' },
      { metric_key: 'buffer_cache_hit_ratio', metric_value: '99.42%', status: 'OPTIMAL' },
      { metric_key: 'total_tables_count', metric_value: '10 tables', status: 'SYNCED' },
      { metric_key: 'last_sync_txid', metric_value: '0/1F8A9020', status: 'COMMITTED' },
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
  adminClearBackendCache();
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
  return true;
}



