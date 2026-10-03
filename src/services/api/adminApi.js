import { apiRequest } from './httpClient';

/**
 * Admin API Service
 * Directly interacts with .NET 10 WebAPI governance, taxonomy, and moderation endpoints.
 */

// --- Categories ---
export async function fetchCategoriesForManagement() {
  const result = await apiRequest('categories/management', { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function fetchCategories() {
  const result = await apiRequest('categories', { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function createCategory({ name, slug, description = '' }) {
  return await apiRequest('categories', {
    method: 'POST',
    body: JSON.stringify({
      categoryName: name,
      slug,
      description,
    }),
  });
}

export async function updateCategory(id, { name, slug, description = '' }) {
  return await apiRequest(`categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      categoryName: name,
      slug,
      description,
    }),
  });
}

export async function deleteCategory(id) {
  return await apiRequest(`categories/${id}`, { method: 'DELETE' });
}

// --- Product Edit Proposals ---
export async function fetchPendingProposals({ page = 1, pageSize = 100 } = {}) {
  const result = await apiRequest(`product-edit-proposals/pending?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
  });
  return result?.data?.items || result?.items || (Array.isArray(result) ? result : []);
}

export async function acceptProposal(id) {
  return await apiRequest(`product-edit-proposals/${id}/accept`, { method: 'POST' });
}

export async function rejectProposal(id, note = '') {
  return await apiRequest(`product-edit-proposals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note: note || 'Rejected by moderator/admin' }),
  });
}

// --- Product Reports ---
export async function fetchOpenReports({ page = 1, pageSize = 100 } = {}) {
  const result = await apiRequest(`product-reports/open?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
  });
  return result?.data?.items || result?.items || (Array.isArray(result) ? result : []);
}

export async function resolveReport(id, resolutionNote = '') {
  return await apiRequest(`product-reports/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ note: resolutionNote || 'Resolved by moderator/admin' }),
  });
}

export async function dismissReport(id, dismissalReason = '') {
  return await apiRequest(`product-reports/${id}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ note: dismissalReason || 'Dismissed by moderator/admin' }),
  });
}

// --- Tag Categories & Tags ---
export async function fetchTagCategories() {
  const result = await apiRequest('tag-categories', { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function fetchTags(tagCategoryId = null) {
  const query = tagCategoryId ? `?tagCategoryId=${tagCategoryId}` : '';
  const result = await apiRequest(`tags${query}`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function createTagCategory({ name, isSingleSelect = false }) {
  return await apiRequest('tag-categories', {
    method: 'POST',
    body: JSON.stringify({ name, isSingleSelect: Boolean(isSingleSelect) }),
  });
}

export async function updateTagCategory(id, { name, isSingleSelect = false }) {
  return await apiRequest(`tag-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, isSingleSelect: Boolean(isSingleSelect) }),
  });
}

export async function deleteTagCategory(id) {
  return await apiRequest(`tag-categories/${id}`, { method: 'DELETE' });
}

export async function createTag({ name, tagCategoryId }) {
  return await apiRequest('tags', {
    method: 'POST',
    body: JSON.stringify({ name, tagCategoryId: Number(tagCategoryId) }),
  });
}

export async function updateTag(id, { name, tagCategoryId }) {
  return await apiRequest(`tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, tagCategoryId: Number(tagCategoryId) }),
  });
}

export async function deleteTag(id) {
  return await apiRequest(`tags/${id}`, { method: 'DELETE' });
}

// --- Roles & Permissions ---
export async function fetchRoles() {
  const result = await apiRequest('roles', { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function fetchOperationClaims() {
  const result = await apiRequest('roles/permissions', { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function fetchRolePermissions(roleId) {
  const result = await apiRequest(`roles/${roleId}/permissions`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function fetchUserPermissions(userId) {
  const result = await apiRequest(`roles/users/${userId}/permissions`, { method: 'GET' });
  return Array.isArray(result) ? result : result?.data || [];
}

export async function grantUserPermission(userId, operationClaimId) {
  return await apiRequest(`roles/users/${userId}/permissions/${operationClaimId}`, { method: 'PUT' });
}

export async function revokeUserPermission(userId, operationClaimId) {
  return await apiRequest(`roles/users/${userId}/permissions/${operationClaimId}`, { method: 'DELETE' });
}

export async function assignUserRole(roleId, userId) {
  return await apiRequest(`roles/${roleId}/users/${userId}`, { method: 'PUT' });
}

export async function removeUserRole(roleId, userId) {
  return await apiRequest(`roles/${roleId}/users/${userId}`, { method: 'DELETE' });
}

// --- Audit Log Revert ---
export async function revertAuditLog(auditLogId) {
  return await apiRequest(`audit/${auditLogId}/revert`, { method: 'POST' });
}

// --- Telemetry & Health Checks ---
export async function checkSystemHealth() {
  const start = performance.now();
  try {
    const live = await apiRequest('health/live', { method: 'GET', timeoutMs: 3000 });
    const elapsed = Math.round(performance.now() - start);
    return {
      isOnline: true,
      latencyMs: elapsed,
      status: 'ONLINE',
      live: live || 'Healthy',
    };
  } catch (err) {
    return {
      isOnline: false,
      latencyMs: 0,
      status: 'OFFLINE',
      error: err.message,
    };
  }
}
