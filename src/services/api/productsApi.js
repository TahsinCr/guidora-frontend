import { apiRequest } from './httpClient';

/**
 * Products & Catalog API Service (.NET 10 /api/products)
 */

export async function fetchProducts({ page = 1, pageSize = 20, categoryId = null } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const endpoint = categoryId
    ? `products/by-category/${categoryId}?${query.toString()}`
    : `products?${query.toString()}`;

  return await apiRequest(endpoint, { method: 'GET' });
}

export async function fetchProductById(id) {
  return await apiRequest(`products/${id}`, { method: 'GET' });
}

export async function createProduct(payload) {
  return await apiRequest('products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload) {
  return await apiRequest(`products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id) {
  return await apiRequest(`products/${id}`, {
    method: 'DELETE',
  });
}

// Child resources
export async function fetchProductComments(productId, { page = 1, pageSize = 20 } = {}) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return await apiRequest(`products/${productId}/comments?${query.toString()}`, { method: 'GET' });
}

export async function addProductComment(productId, commentText) {
  return await apiRequest(`products/${productId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ commentText }),
  });
}

export async function fetchProductChangelogs(productId) {
  return await apiRequest(`products/${productId}/changelogs`, { method: 'GET' });
}

export async function fetchProductDocuments(productId) {
  return await apiRequest(`products/${productId}/documents`, { method: 'GET' });
}

export async function fetchProductVerificationSummary(productId) {
  return await apiRequest(`products/${productId}/verification`, { method: 'GET' });
}

export async function reportProduct(productId, { reason, details, contactEmail = '' }) {
  return await apiRequest(`product-reports/products/${productId}`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      details,
      contactEmail,
    }),
  });
}
