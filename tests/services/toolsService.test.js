import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllTools,
  getTools,
  getToolById,
  getToolByIdSync,
  getCategories,
  getAllTags,
  validateTagSelection,
} from '@/services/toolsService';
import * as taxonomiesApi from '@/services/api/taxonomiesApi';

describe('ToolsService - Catalog Query & Filtering Engine', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', 'true');
    localStorage.clear();
    vi.spyOn(taxonomiesApi, 'fetchCategories').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('retrieves all catalog tools combined', () => {
    const all = getAllTools();
    expect(all).toBeInstanceOf(Array);
    expect(all.length).toBeGreaterThan(0);

    const first = all[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('categoryId');
    expect(first).toHaveProperty('rating');
  });

  it('filters tools by single category accurately', async () => {
    const response = await getTools({ category: 'generative-art' });
    expect(response).toHaveProperty('items');
    expect(response.items).toBeInstanceOf(Array);
    expect(response.items.length).toBeGreaterThan(0);

    for (const tool of response.items) {
      expect(tool.categoryId).toBe('generative-art');
    }
  });

  it('filters tools by search query across name, description, and tags (case-insensitive)', async () => {
    // Search for "neuro"
    const response = await getTools({ search: 'neuro' });
    expect(response.items.length).toBeGreaterThan(0);

    for (const tool of response.items) {
      const match =
        tool.name.toLowerCase().includes('neuro') ||
        (tool.tagline && tool.tagline.toLowerCase().includes('neuro')) ||
        (tool.description && tool.description.toLowerCase().includes('neuro')) ||
        (tool.tags && tool.tags.some((t) => (typeof t === 'string' ? t : t.name || '').toLowerCase().includes('neuro')));
      expect(match).toBe(true);
    }
  });

  it('sorts tools by highest-rated in descending order', async () => {
    const response = await getTools({ sort: 'highest-rated' });
    const items = response.items;
    expect(items.length).toBeGreaterThan(1);

    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i].rating).toBeGreaterThanOrEqual(items[i + 1].rating);
    }
  });

  it('synchronously retrieves tool by slug (getToolByIdSync)', () => {
    const all = getAllTools();
    const target = all[0];

    const retrieved = getToolByIdSync(target.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe(target.id);
    expect(retrieved.name).toBe(target.name);
  });

  it('throws an error or returns null when tool ID does not exist', async () => {
    expect(getToolByIdSync('non-existent-tool-id-99999')).toBeNull();
    await expect(getToolById('non-existent-tool-id-99999')).rejects.toThrow('Tool not found');
  });

  it('retrieves categories and tag taxonomy correctly', async () => {
    const categories = await getCategories();
    expect(categories).toBeInstanceOf(Array);
    expect(categories.length).toBeGreaterThan(0);

    const tags = await getAllTags();
    expect(tags).toBeInstanceOf(Array);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('validates single-select tag category constraints', () => {
    const tagToAdd = {
      id: 'tag_freemium',
      name: 'Freemium',
      tagCategoryId: 'pricing_model',
      tagCategoryName: 'Pricing Model',
      isCategorySingleSelect: true,
    };

    const currentTags = [
      { id: 'tag_paid', name: 'Paid', tagCategoryId: 'pricing_model' },
    ];
    const conflictResult = validateTagSelection(currentTags, tagToAdd);
    expect(conflictResult.valid).toBe(false);
    expect(conflictResult.reason).toContain('Only one tag from "Pricing Model" can be selected');

    const validResult = validateTagSelection([], tagToAdd);
    expect(validResult.valid).toBe(true);
  });
});
