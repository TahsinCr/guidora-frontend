import { apiRequest } from './httpClient';

/**
 * Taxonomies API Service (.NET 10 /api/categories, /api/tags, /api/tag-categories)
 */

export async function fetchCategories() {
  return await apiRequest('categories', { method: 'GET' });
}

export async function fetchCategoriesForManagement() {
  return await apiRequest('categories/management', { method: 'GET' });
}

export async function fetchTags(tagCategoryId = null) {
  const query = tagCategoryId ? `?tagCategoryId=${tagCategoryId}` : '';
  return await apiRequest(`tags${query}`, { method: 'GET' });
}

export async function fetchTagCategories() {
  return await apiRequest('tag-categories', { method: 'GET' });
}
