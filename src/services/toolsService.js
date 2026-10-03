import * as productsApi from './api/productsApi';
import * as taxonomiesApi from './api/taxonomiesApi';
import { adaptProductDtoToTool, adaptToolToCreateProductRequest } from './api/toolAdapter';
const useMock = () => import.meta.env.VITE_USE_MOCK === 'true';
let backendTools = [];

async function loadBackendCatalog() {
  const items = [];
  let page = 1;
  let result;
  do {
    result = await productsApi.fetchProducts({ page, pageSize: 100 });
    items.push(...result.items.map(adaptProductDtoToTool));
    page += 1;
  } while (items.length < result.totalCount && result.items.length);
  backendTools = items;
  return items;
}

import { TOOLS_DATA, CATEGORIES, TAG_CATEGORIES, ALL_TAGS } from './mockData';
import { adminGetCategories, adminGetTagCategories, getDeletedToolIds, getToolOverrides } from './adminService';
import { sanitizePlainText, sanitizeUrl } from '@/utils/security';
import { waitDemoDelay, isDemoDelayActive } from '@/utils/demoDelay';

// Simulated network latency only when 10s demo delay mode is enabled
const simulateDelay = async (ms = 0) => {
  if (isDemoDelayActive()) {
    await waitDemoDelay(ms);
  }
};

const CUSTOM_TOOLS_KEY = 'guidora_custom_tools';
const REVIEWS_KEY_PREFIX = 'guidora_reviews_';
const REPORTS_KEY = 'guidora_reports';

function getStoredCustomTools() {
  try {
    const raw = localStorage.getItem(CUSTOM_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getAllTools() {
  if (!useMock()) return backendTools;
  const custom = getStoredCustomTools();
  const deletedIds = getDeletedToolIds();
  const overrides = getToolOverrides();

  const combined = [...custom, ...TOOLS_DATA].filter((t) => !deletedIds.includes(t.id));

  return combined.map((t) => {
    if (overrides[t.id]) {
      return {
        ...t,
        ...overrides[t.id],
        verified: {
          ...(t.verified || {}),
          ...(overrides[t.id].verified || {}),
        },
      };
    }
    return t;
  });
}

/**
 * Fetch list of tools with optional search query, category, and sorting filters.
 */
export async function getTools({
  search = '',
  category = 'all',
  selectedCategories = [],
  selectedTags = [],
  selectedOrganizations = [],
  sort = 'relevance',
  filterVerified = false,
  verification = { admin: false, community: false, bot: false },
  filterPricing = 'all',
  platform = 'all',
  page = 1,
  limit = 12,
} = {}) {
  await simulateDelay(60);

  let filtered = useMock() ? getAllTools() : await loadBackendCatalog();

  // Primary Category filter (from top hero/slider)
  if (category && category !== 'all') {
    filtered = filtered.filter((t) => t.categoryId === category);
  }

  // Multi-Category filter (from filter drawer/panel)
  if (selectedCategories && selectedCategories.length > 0) {
    filtered = filtered.filter((t) => selectedCategories.includes(t.categoryId));
  }

  // Multi-Organization filter (from filter drawer/panel)
  if (selectedOrganizations && selectedOrganizations.length > 0) {
    filtered = filtered.filter((t) => {
      const toolOrgId = t.organizationId || t.creator?.organizationId;
      const toolCreatorName = (t.creator?.name || '').toLowerCase();
      return selectedOrganizations.some((orgId) => {
        return (
          toolOrgId === orgId ||
          toolCreatorName.includes(orgId.replace('org_', '').toLowerCase())
        );
      });
    });
  }

  // Multi-Tags filter (from filter drawer/panel)
  if (selectedTags && selectedTags.length > 0) {
    filtered = filtered.filter((t) => {
      const toolTags = [
        t.tag?.toLowerCase(),
        ...(t.tags || []).map((x) => (typeof x === 'string' ? x : x.name || x.id || '').toLowerCase()),
        ...(t.platforms || []).map((p) => p.toLowerCase()),
        t.pricing?.toLowerCase(),
        t.license?.toLowerCase(),
        t.deployment?.toLowerCase(),
      ].filter(Boolean);

      return selectedTags.every((st) => {
        const needle = st.toLowerCase().replace(/^#/, '').trim();
        return toolTags.some((tt) => tt.includes(needle) || needle.includes(tt));
      });
    });
  }

  // Search filter
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.tag && t.tag.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // Detailed Verification filter
  if (verification?.admin || verification?.community || verification?.bot) {
    filtered = filtered.filter((t) => {
      if (verification.admin && !t.verified?.admin) return false;
      if (verification.community && !t.verified?.community) return false;
      if (verification.bot && !t.verified?.audited) return false;
      return true;
    });
  } else if (filterVerified) {
    filtered = filtered.filter((t) => t.verified?.admin || t.verified?.community);
  }

  // Pricing filter
  if (filterPricing && filterPricing !== 'all') {
    filtered = filtered.filter((t) => t.pricing?.toLowerCase() === filterPricing.toLowerCase());
  }

  // Platform filter
  if (platform && platform !== 'all') {
    filtered = filtered.filter((t) =>
      t.platforms ? t.platforms.map((p) => p.toLowerCase()).includes(platform.toLowerCase()) : true
    );
  }

  // Sorting
  if (sort === 'highest-rated') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'most-viewed') {
    filtered.sort((a, b) => parseFloat(b.views || 0) - parseFloat(a.views || 0));
  } else if (sort === 'newest') {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  const total = filtered.length;
  const endIndex = page * limit;
  const items = filtered.slice(0, endIndex);
  const hasMore = endIndex < total;

  return {
    items,
    total,
    page,
    limit,
    hasMore,
  };
}

/**
 * Fetch a single tool by its ID.
 */
export async function getToolById(id) {
  if (!useMock()) {
    const cached = backendTools.find((t) => t.id === id || String(t.numericId) === String(id));
    const numericId = cached?.numericId || (/^\d+$/.test(String(id)) ? Number(id) : (await loadBackendCatalog()).find((t) => t.id === id)?.numericId);
    if (!numericId) throw new Error(`Tool not found: ${id}`);
    const [dto, verification] = await Promise.all([productsApi.fetchProductById(numericId), productsApi.fetchProductVerificationSummary(numericId)]);
    const tool = adaptProductDtoToTool(dto);
    tool.verified = { admin: verification.adminVerified, community: verification.communityVerified, bot: false };
    return tool;
  }
  await simulateDelay(80);
  const all = getAllTools();
  const tool = all.find((t) => t.id === id);
  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }

  // Find 2 similar tools
  const similar = all
    .filter((t) => t.id !== id)
    .slice(0, 2)
    .map((t) => ({
      id: t.id,
      name: t.name.replace(/ (AI|Studio|Labs)$/i, ''),
      category: (t.category || 'AI').split(' ')[0],
      pricing: (t.pricing || 'Free').split(' ')[0],
    }));

  return {
    ...tool,
    rank: tool.rank || '#4',
    rating: tool.rating || 4.8,
    monthlyVisits: tool.monthlyVisits || '1.2M',
    license: tool.license || 'Proprietary',
    platformDisplay: tool.platforms ? tool.platforms.slice(0, 2).join(', ') : 'Web, API',
    access: tool.access || 'Public',
    updated: tool.updated || 'Recently',
    creator: tool.creator || {
      name: `${tool.name.split(' ')[0]} Labs`,
      initials: tool.name.slice(0, 2).toUpperCase(),
      verified: true,
    },
    similarTools: similar.length >= 2 ? similar : [
      { id: 'codewizard-ai', name: 'CodeWizard', category: 'Coding', pricing: 'Free' },
      { id: 'datamind-analytics', name: 'DataMind', category: 'Analytics', pricing: 'Paid' },
    ],
    overviewText: tool.overviewText || {
      lead: `${tool.name} is a high-performance platform designed for modern AI and developer workflows.`,
      detail: tool.description || `Integrates seamlessly with existing toolchains and pipelines.`,
    },
    keyFeatures: tool.keyFeatures || [
      'High-throughput real-time processing',
      'Context-aware developer workspace',
      'Open API and webhook integrations',
    ],
    capabilities: tool.capabilities || tool.topics || [
      'Automation',
      'API Integration',
      'Developer Tool',
    ],
  };
}

/**
 * Fetch a single tool synchronously from active catalog memory.
 * Eliminates skeleton flashes and layout shift on instant card clicks.
 */
export function getToolByIdSync(id) {
  if (!useMock()) return backendTools.find((t) => t.id === id) || null;
  if (!id) return null;
  const all = getAllTools();
  const tool = all.find((t) => t.id === id);
  if (!tool) return null;

  const similar = all
    .filter((t) => t.id !== id)
    .slice(0, 2)
    .map((t) => ({
      id: t.id,
      name: t.name.replace(/ (AI|Studio|Labs)$/i, ''),
      category: (t.category || 'AI').split(' ')[0],
      pricing: (t.pricing || 'Free').split(' ')[0],
    }));

  return {
    ...tool,
    rank: tool.rank || '#4',
    rating: tool.rating || 4.8,
    monthlyVisits: tool.monthlyVisits || '1.2M',
    license: tool.license || 'Proprietary',
    platformDisplay: tool.platforms ? tool.platforms.slice(0, 2).join(', ') : 'Web, API',
    access: tool.access || 'Public',
    updated: tool.updated || 'Recently',
    creator: tool.creator || {
      name: `${tool.name.split(' ')[0]} Labs`,
      initials: tool.name.slice(0, 2).toUpperCase(),
      verified: true,
    },
    similarTools: similar.length >= 2 ? similar : [
      { id: 'codewizard-ai', name: 'CodeWizard', category: 'Coding', pricing: 'Free' },
      { id: 'datamind-analytics', name: 'DataMind', category: 'Analytics', pricing: 'Paid' },
    ],
    overviewText: tool.overviewText || {
      lead: `${tool.name} is a high-performance platform designed for modern AI and developer workflows.`,
      detail: tool.description || `Integrates seamlessly with existing toolchains and pipelines.`,
    },
    keyFeatures: tool.keyFeatures || [
      'High-throughput real-time processing',
      'Context-aware developer workspace',
      'Open API and webhook integrations',
    ],
    capabilities: tool.capabilities || tool.topics || [
      'Automation',
      'API Integration',
      'Developer Tool',
    ],
  };
}

/**
 * Add a new tool to the catalog and persist it in localStorage.
 */
export async function addTool(toolData) {
  if (!useMock()) return adaptProductDtoToTool(await productsApi.createProduct(adaptToolToCreateProductRequest(toolData)));
  await simulateDelay(100);

  const cleanName = sanitizePlainText(toolData.name || '');
  const id = toolData.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const categoryObj = CATEGORIES.find((c) => c.id === toolData.categoryId) || CATEGORIES[1];

  const newTool = {
    id,
    name: cleanName,
    category: categoryObj.name || categoryObj.label || 'Generative Art',
    categoryId: categoryObj.id,
    tag: sanitizePlainText(toolData.tag || (toolData.tags?.[0]?.name || 'Developer Tool')),
    tags: toolData.tags || [],
    pricing: toolData.pricing || 'Freemium',
    description: sanitizePlainText(toolData.description || ''),
    websiteUrl: sanitizeUrl(toolData.websiteUrl) || '',
    repoUrl: sanitizeUrl(toolData.repoUrl) || '',
    readme: toolData.readme || '',
    changelog: toolData.changelog || '',
    webhookUrl: sanitizeUrl(toolData.webhookUrl) || '',
    syncFrequency: toolData.syncFrequency || 'Daily',
    rating: 5.0,
    views: '1.0k',
    isNew: true,
    verified: {
      admin: true,
      community: true,
      audited: !!toolData.repoUrl,
    },
    platforms: toolData.platforms || ['Web'],
    license: toolData.license || 'Open Source',
    monthlyVisits: '50.0k',
    rank: '#NEW',
    organizationId: toolData.organizationId || null,
    creator: {
      name: toolData.creatorName || `${toolData.name} Team`,
      initials: toolData.creatorInitials || (toolData.creatorName || toolData.name).slice(0, 2).toUpperCase(),
      verified: toolData.creatorVerified !== undefined ? toolData.creatorVerified : true,
    },
    capabilities: toolData.capabilities || ['AI Automation', 'Developer Tool'],
    keyFeatures: toolData.keyFeatures || [
      'Automated repository integration',
      'Markdown documentation support',
      'Continuous sync and change tracking',
    ],
  };

  const current = getStoredCustomTools();
  const updated = [newTool, ...current.filter((t) => t.id !== id)];
  try {
    localStorage.setItem(CUSTOM_TOOLS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  return newTool;
}

/**
 * Fetch repository data and README/CHANGELOG from GitHub's public API.
 */
export async function fetchGithubRepoData(repoUrl) {
  await simulateDelay(60);

  if (!repoUrl) {
    throw new Error('Repository URL is required');
  }

  // Extract owner and repo from URL or string (e.g., https://github.com/facebook/react or facebook/react)
  let clean = repoUrl.trim();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
  clean = clean.replace(/\/+$/, '');
  const parts = clean.split('/');

  if (parts.length < 2) {
    throw new Error('Invalid GitHub repository format. Use owner/repo (e.g. facebook/react)');
  }

  const owner = parts[0];
  const repo = parts[1];

  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!metaRes.ok) {
      if (metaRes.status === 404) {
        throw new Error(`Repository ${owner}/${repo} was not found on GitHub.`);
      }
      if (metaRes.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please enter details manually.');
      }
      throw new Error(`GitHub API returned status ${metaRes.status}`);
    }

    const meta = await metaRes.json();

    // Fetch README
    let readme = '';
    try {
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`);
      if (readmeRes.ok) {
        readme = await readmeRes.text();
      }
    } catch (e) {
      console.warn('Failed to fetch raw README:', e);
    }

    // Fetch CHANGELOG or Releases
    let changelog = '';
    try {
      const changelogRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/CHANGELOG.md`);
      if (changelogRes.ok) {
        changelog = await changelogRes.text();
      } else {
        // Try releases API
        const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
        if (relRes.ok) {
          const rel = await relRes.json();
          changelog = `## ${rel.name || rel.tag_name}\n\n${rel.body || 'No release notes provided.'}`;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch changelog:', e);
    }

    return {
      name: meta.name ? meta.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : repo,
      description: meta.description || '',
      websiteUrl: meta.homepage || meta.html_url || '',
      repoUrl: meta.html_url,
      stars: meta.stargazers_count,
      license: meta.license?.spdx_id || meta.license?.name || 'MIT',
      topics: meta.topics && meta.topics.length > 0 ? meta.topics : ['Open Source', 'AI', 'Developer Tool'],
      readme: readme || `# ${meta.name}\n\n${meta.description || 'Welcome to this project.'}`,
      changelog: changelog || '## Latest Changes\n\n- Automated sync initialized\n- Initial release',
      ownerName: meta.owner?.login || owner,
      ownerAvatar: meta.owner?.avatar_url || '',
    };
  } catch (err) {
    console.error('GitHub fetch failed:', err);
    throw err;
  }
}

/**
 * Fetch reviews for a tool with localStorage persistence.
 */
export async function getReviews(toolId) {
  if (!useMock()) {
    const tool = backendTools.find((t) => t.id === toolId);
    if (!tool) return [];
    const result = await productsApi.fetchProductComments(tool.numericId);
    return result.items || [];
  }
  await simulateDelay(40);
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // fallback
  }

  // Default seed reviews
  const seeds = [
    {
      id: 'rev-1',
      author: 'Alex Mercer',
      role: 'Senior ML Engineer',
      rating: 5,
      date: '3 days ago',
      content: 'Incredible integration into our daily pipeline. The latency is practically non-existent and the API documentation is top-notch.',
      helpful: 24,
      verified: true,
    },
    {
      id: 'rev-2',
      author: 'Sarah Chen',
      role: 'Fullstack Architect',
      rating: 4,
      date: '1 week ago',
      content: 'Solid feature set and very clean UI. Would love to see more CLI automation options in future updates, but overall highly recommended.',
      helpful: 12,
      verified: true,
    },
    {
      id: 'rev-3',
      author: 'Marcus Vance',
      role: 'Product Lead',
      rating: 5,
      date: '2 weeks ago',
      content: 'Compared to alternatives in this space, the auto-layout and context window handling is substantially more reliable.',
      helpful: 8,
      verified: false,
    },
  ];

  try {
    localStorage.setItem(key, JSON.stringify(seeds));
  } catch (e) {}

  return seeds;
}

/**
 * Add a review to a tool.
 */
export async function addReview(toolId, reviewData) {
  if (!useMock()) {
    const tool = await getToolById(toolId);
    return await productsApi.addProductComment(tool.numericId, reviewData.content);
  }
  await simulateDelay(60);
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const existing = await getReviews(toolId);

  const newReview = {
    id: `rev-${Date.now()}`,
    toolId,
    toolName: reviewData.toolName || toolId,
    userId: reviewData.userId || null,
    author: reviewData.author || 'Anonymous Practitioner',
    role: reviewData.role || 'Verified User',
    title: reviewData.title || '',
    avatar: reviewData.avatar || null,
    rating: reviewData.rating || 5,
    date: 'Just now',
    content: reviewData.content,
    helpful: 0,
    verified: true,
  };

  const updated = [newReview, ...existing];
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}

/**
 * Delete a review from a tool.
 */
export async function deleteReview(toolId, reviewId) {
  if (!useMock()) return await productsApi.deleteProductComment(reviewId);
  await simulateDelay(40);
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const existing = await getReviews(toolId);
  const updated = existing.filter((r) => r.id !== reviewId);
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

/**
 * Get all reviews across all tools (for Admin Moderation Panel)
 */
export async function getAllReviews() {
  if (!useMock()) return [];
  await simulateDelay(50);
  const allTools = await getAllTools();
  let aggregated = [];

  for (const tool of allTools) {
    const key = `${REVIEWS_KEY_PREFIX}${tool.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        list.forEach((rev) => {
          aggregated.push({
            ...rev,
            toolId: tool.id,
            toolName: tool.name,
            toolCategory: tool.category,
          });
        });
      }
    } catch (e) {}
  }

  // Also include seeds for default demo tools if not yet visited
  if (aggregated.length === 0) {
    const neuroReviews = await getReviews('neurogen-studio');
    neuroReviews.forEach((rev) => {
      aggregated.push({
        ...rev,
        toolId: 'neurogen-studio',
        toolName: 'NeuroGen Studio',
        toolCategory: 'Generative AI',
      });
    });
  }

  return aggregated.sort((a, b) => (b.id > a.id ? 1 : -1));
}

/**
 * Get all reviews authored by a specific user across all tools
 */
export async function getUserReviews(userId) {
  const all = await getAllReviews();
  if (!userId) return [];
  return all.filter((r) => r.userId === userId || r.author === userId);
}

/**
 * Submit a report for a tool.
 */
export async function submitReport(toolId, reportData) {
  if (!useMock()) {
    const tool = await getToolById(toolId);
    return await productsApi.reportProduct(tool.numericId, reportData);
  }
  await simulateDelay(80);
  
  // Try sending to .NET 10 API if numeric ID is available
  try {
    const all = getAllTools();
    const targetTool = all.find((t) => t.id === toolId);
    if (targetTool?.numericId) {
      const { reportProduct } = await import('./api/productsApi');
      await reportProduct(targetTool.numericId, {
        reason: reportData.reason,
        details: reportData.details,
        contactEmail: reportData.email || '',
      });
      return { success: true, message: 'Report submitted successfully' };
    }
  } catch (e) {
    // Fallback to local storage
  }

  const report = {
    id: `rep-${Date.now()}`,
    toolId,
    reason: reportData.reason,
    details: reportData.details,
    email: reportData.email || '',
    submittedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch (e) {}

  return { success: true, message: 'Report submitted successfully' };
}

/**
 * Fetch list of categories (queries .NET 10 API first, falls back to local data)
 */
export async function getCategories() {
  if (!useMock()) return (await taxonomiesApi.fetchCategories()).map((c) => ({ id: c.slug || String(c.categoryId), numericId: c.categoryId, name: c.categoryName, count: 0 }));
  await simulateDelay(40);
  try {
    const { fetchCategories } = await import('./api/taxonomiesApi');
    const apiCats = await fetchCategories();
    if (Array.isArray(apiCats) && apiCats.length > 0) {
      return apiCats.map((c) => ({
        id: c.slug || String(c.categoryId),
        numericId: c.categoryId,
        name: c.categoryName,
        count: 0,
      }));
    }
  } catch (e) {
    // API offline, fallback to local categories
  }
  return adminGetCategories();
}

/**
 * Fetch popular categories
 */
export async function getPopularCategories() {
  await simulateDelay(30);
  const all = await getCategories();
  return all.filter((c) => c.isPopular);
}

/**
 * Fetch hierarchical tag categories
 */
export async function getTagCategories() {
  if (!useMock()) return await taxonomiesApi.fetchTagCategories();
  await simulateDelay(40);
  return adminGetTagCategories();
}

/**
 * Fetch all available tags alphabetically
 */
export async function getAllTags() {
  if (!useMock()) return await taxonomiesApi.fetchTags();
  await simulateDelay(30);
  const tagCats = adminGetTagCategories();
  const allFlattened = [];
  tagCats.forEach((group) => {
    (group.tags || []).forEach((t) => {
      allFlattened.push({
        ...t,
        tagCategoryId: group.id,
        tagCategoryName: group.name,
        isCategorySingleSelect: group.isSingleSelect,
      });
    });
  });
  return allFlattened.length > 0 ? allFlattened : [...ALL_TAGS];
}

/**
 * Validates whether a tag can be added to the tool's selected tags
 * according to category single-select and tag 'only' constraints.
 *
 * @param {Array} currentTags - Array of currently selected tag objects or IDs
 * @param {Object} tagToAdd - The tag object user wants to add
 * @returns {Object} { valid: boolean, reason?: string }
 */
export function validateTagSelection(currentTags = [], tagToAdd) {
  if (!tagToAdd) return { valid: false, reason: 'Invalid tag' };

  // If tag is already selected, it can always be clicked to remove it
  const isAlreadySelected = currentTags.some(
    (t) => (typeof t === 'string' ? t === tagToAdd.id : t.id === tagToAdd.id)
  );
  if (isAlreadySelected) {
    return { valid: true, isRemoval: true };
  }

  // Check if tag is restricted by 'only' or its category is isSingleSelect
  const isSingle = tagToAdd.only || tagToAdd.isCategorySingleSelect;
  if (!isSingle) {
    return { valid: true };
  }

  // Check if any tag from the same category is already selected
  const conflict = currentTags.find((t) => {
    const existingCatId = typeof t === 'string'
      ? ALL_TAGS.find((at) => at.id === t)?.tagCategoryId
      : t.tagCategoryId;
    return existingCatId === tagToAdd.tagCategoryId;
  });

  if (conflict) {
    const existingName = typeof conflict === 'string'
      ? ALL_TAGS.find((at) => at.id === conflict)?.name || conflict
      : conflict.name;
    const catName = tagToAdd.tagCategoryName || 'this category';

    return {
      valid: false,
      reason: `Only one tag from "${catName}" can be selected (already selected: #${existingName}). Remove it first to switch.`,
    };
  }

  return { valid: true };
}
