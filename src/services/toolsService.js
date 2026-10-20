import * as productsApi from './api/productsApi';
import * as taxonomiesApi from './api/taxonomiesApi';
import { adaptProductDtoToTool } from './api/toolAdapter';
import { getCategoryColor } from '@/constants/categoryIcons';
import { isMockMode } from './config/modeService';
const useMock = () => isMockMode();
let backendTools = [];

export { loadBackendCatalog };

async function loadBackendCatalog(forceRefresh = false) {
  if (!forceRefresh && backendTools.length > 0) {
    return getAllTools();
  }
  try {
    const categories = await taxonomiesApi.fetchCategories().catch(() => []);
    const categoryMap = {};

    if (Array.isArray(categories) && categories.length > 0) {
      await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await productsApi.fetchProducts({ page: 1, pageSize: 100, categoryId: cat.categoryId });
            const list = res?.items || (Array.isArray(res) ? res : []);
            list.forEach((p) => {
              if (!categoryMap[p.productId]) {
                categoryMap[p.productId] = {
                  categorySlug: cat.slug,
                  categoryName: cat.categoryName,
                  categorySlugs: [cat.slug],
                  categoryIds: [cat.categoryId],
                };
              } else {
                if (!categoryMap[p.productId].categorySlugs.includes(cat.slug)) {
                  categoryMap[p.productId].categorySlugs.push(cat.slug);
                  categoryMap[p.productId].categoryIds.push(cat.categoryId);
                }
              }
            });
          } catch {
            // ignore individual category fetch errors
          }
        })
      );
    }

    const items = [];
    let page = 1;
    let result;
    do {
      result = await productsApi.fetchProducts({ page, pageSize: 100 });
      const fetchedList = result?.items || (Array.isArray(result) ? result : []);
      items.push(...fetchedList.map((dto) => adaptProductDtoToTool(dto, categoryMap)));
      page += 1;
    } while (items.length < (result?.totalCount ?? 0) && (result?.items?.length ?? 0) > 0);
    backendTools = items;
    return getAllTools();
  } catch (err) {
    if (import.meta.env?.VITE_ALLOW_MOCK_FALLBACK !== 'false') {
      return getAllTools();
    }
    throw err;
  }
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
  const custom = getStoredCustomTools();
  const deletedIds = getDeletedToolIds();
  const overrides = getToolOverrides();
  const baseList = useMock() ? TOOLS_DATA : backendTools;

  const seen = new Set();
  const combined = [...custom, ...baseList].filter((t) => {
    if (!t) return false;
    if (deletedIds.includes(t.id) || (t.numericId && deletedIds.includes(String(t.numericId)))) {
      return false;
    }
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

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

  if (!useMock() && backendTools.length === 0) {
    await loadBackendCatalog();
  }
  let filtered = getAllTools();

  // Primary Category filter (from top hero/slider)
  if (category && category !== 'all') {
    filtered = filtered.filter(
      (t) => t.categoryId === category || (Array.isArray(t.categories) && t.categories.includes(category))
    );
  }

  // Multi-Category filter (from filter drawer/panel)
  if (selectedCategories && selectedCategories.length > 0) {
    filtered = filtered.filter(
      (t) =>
        selectedCategories.includes(t.categoryId) ||
        (Array.isArray(t.categories) && t.categories.some((c) => selectedCategories.includes(c)))
    );
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
    const allCurrent = getAllTools();
    let cached = allCurrent.find((t) => t.id === id || String(t.numericId) === String(id));
    if (!cached && backendTools.length === 0) {
      await loadBackendCatalog();
      cached = getAllTools().find((t) => t.id === id || String(t.numericId) === String(id));
    }

    const numericId = cached?.numericId || (/^\d+$/.test(String(id)) ? Number(id) : null);
    if (!numericId) {
      if (cached) {
        return enrichToolDetail(cached, getAllTools());
      }
      throw new Error(`Tool not found: ${id}`);
    }

    try {
      const [dto, verification] = await Promise.all([
        productsApi.fetchProductById(numericId),
        productsApi.fetchProductVerificationSummary(numericId).catch(() => null),
      ]);
      const categoryMap = cached
        ? {
            [numericId]: {
              categorySlug: cached.categoryId || cached.category,
              categoryName: cached.categoryName,
              categorySlugs: cached.categories || [cached.categoryId || cached.category],
              tags: cached.tags,
              pricing: cached.pricing,
            },
          }
        : {};
      const adapted = adaptProductDtoToTool(dto, categoryMap);
      if (adapted) {
        const overrides = getToolOverrides()[adapted.id] || {};
        const merged = {
          ...adapted,
          ...overrides,
          verified: {
            admin: Boolean(verification?.adminVerified ?? adapted.verified?.admin),
            community: Boolean(verification?.communityVerified ?? adapted.verified?.community),
            bot: Boolean(overrides.verified?.bot ?? adapted.verified?.bot),
            ...(overrides.verified || {}),
          },
        };
        return enrichToolDetail(merged, getAllTools());
      }
    } catch (e) {
      if (cached) {
        return enrichToolDetail(cached, getAllTools());
      }
      throw e;
    }
  }

  await simulateDelay(80);
  const all = getAllTools();
  const tool = all.find((t) => t.id === id || String(t.numericId) === String(id));
  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }

  return enrichToolDetail(tool, all);
}

function enrichToolDetail(tool, allTools = []) {
  const sameCategory = allTools.filter(
    (t) =>
      t.id !== tool.id &&
      String(t.numericId) !== String(tool.numericId) &&
      (t.categoryId === tool.categoryId || t.category === tool.category)
  );
  const otherTools = allTools.filter(
    (t) => t.id !== tool.id && String(t.numericId) !== String(tool.numericId)
  );
  const candidates = sameCategory.length >= 2 ? sameCategory : [...sameCategory, ...otherTools];
  const similar = candidates.slice(0, 3).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.categoryName || t.category || 'Software',
    pricing: t.pricing || 'Freemium',
  }));

  const rawTags = (tool.tags || [])
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.id))
    .filter(Boolean);

  return {
    ...tool,
    rank: tool.rank || '#4',
    rating: tool.rating || 4.8,
    monthlyVisits: tool.monthlyVisits || '1.2M',
    license: tool.license || 'MIT / Commercial',
    platformDisplay: tool.platforms ? tool.platforms.slice(0, 2).join(', ') : 'Web, API',
    access: tool.access || 'Public',
    updated: tool.updated || 'Recently',
    creator: tool.creator || {
      name: `${tool.name.split(' ')[0]} Team`,
      initials: tool.name.slice(0, 2).toUpperCase(),
      verified: true,
    },
    similarTools:
      Array.isArray(tool.similarTools) && tool.similarTools.length > 0
        ? tool.similarTools
        : similar,
    overviewText: tool.overviewText || {
      lead: `${tool.name} is a high-performance software platform engineered for modern development and operational workflows.`,
      detail:
        tool.description ||
        `Integrates cleanly with existing engineering toolchains, CI/CD pipelines, and team workspaces.`,
    },
    keyFeatures: tool.keyFeatures || [
      'Low-latency execution & real-time workspace synchronization',
      'Extensible CLI, REST API, and webhook automation hooks',
      'Enterprise-grade access control & modular configuration',
    ],
    capabilities:
      tool.capabilities ||
      (rawTags.length > 0
        ? rawTags
        : ['Developer Tool', 'API Integration', 'Workflow Automation']),
  };
}

/**
 * Fetch a single tool synchronously from active catalog memory.
 * Eliminates skeleton flashes and layout shift on instant card clicks.
 */
export function getToolByIdSync(id) {
  if (!id) return null;
  const all = getAllTools();
  const tool = all.find((t) => t.id === id || String(t.numericId) === String(id));
  if (!tool) return null;
  return enrichToolDetail(tool, all);
}

/**
 * Add a new tool to the catalog and persist it in localStorage (with optional backend sync).
 */
export async function addTool(toolData) {
  if (useMock()) {
    await simulateDelay(100);
  }

  const cleanName = sanitizePlainText(toolData.name || '');
  const id =
    toolData.id ||
    cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const allCats = adminGetCategories();
  const categoryObj =
    allCats.find((c) => c.id === toolData.categoryId) ||
    CATEGORIES.find((c) => c.id === toolData.categoryId) ||
    CATEGORIES[1];

  const newTool = {
    id,
    name: cleanName,
    category: categoryObj.name || categoryObj.label || 'Developer Tools',
    categoryName: categoryObj.name || categoryObj.label || 'Developer Tools',
    categoryId: categoryObj.id,
    categories: [categoryObj.id],
    tag: sanitizePlainText(toolData.tag || toolData.tags?.[0]?.name || 'Developer Tool'),
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
      name: toolData.creatorName || `${cleanName} Team`,
      initials:
        toolData.creatorInitials ||
        (toolData.creatorName || cleanName || 'GT').slice(0, 2).toUpperCase(),
      verified: toolData.creatorVerified !== undefined ? toolData.creatorVerified : true,
    },
    capabilities: toolData.capabilities || ['Workflow Automation', 'Developer Tool'],
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

function extractMentions(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/@([a-zA-Z0-9_.-]+)/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

function getDefaultSeededReviews(toolId) {
  return [
    {
      id: 'rev-1',
      toolId,
      userId: 'usr_alex_01',
      author: 'Alex Mercer',
      username: 'alexmercer',
      role: 'Senior Systems Engineer',
      avatar: 'AM',
      rating: 5,
      parentId: null,
      replyTo: null,
      mentions: [],
      date: '3 days ago',
      content: 'Incredible integration into our daily pipeline. The latency is practically non-existent and the API documentation is top-notch.',
      helpful: 24,
      verified: true,
    },
    {
      id: 'rev-1-sub-1',
      toolId,
      userId: 'usr_admin_01',
      author: 'Tahsin Cr',
      username: 'tahsincr',
      role: 'Lead Software & Platform Architect',
      avatar: 'TC',
      rating: null,
      parentId: 'rev-1',
      replyTo: 'alexmercer',
      mentions: ['alexmercer'],
      date: '2 days ago',
      content: '@alexmercer Kesinlikle katılıyorum, özellikle CI/CD katmanındaki webhook gecikmeleri ve SDK entegrasyonu önceki çözümlere kıyasla çok daha kararlı çalışıyor.',
      helpful: 7,
      verified: true,
    },
    {
      id: 'rev-2',
      toolId,
      userId: 'usr_sarah_02',
      author: 'Sarah Chen',
      username: 'sarahchen',
      role: 'Fullstack Architect',
      avatar: 'SC',
      rating: 4,
      parentId: null,
      replyTo: null,
      mentions: [],
      date: '1 week ago',
      content: 'Solid feature set and very clean UI. Would love to see more CLI automation options in future updates, but overall highly recommended.',
      helpful: 12,
      verified: true,
    },
    {
      id: 'rev-2-sub-1',
      toolId,
      userId: 'usr_elena_02',
      author: 'Elena Rostova',
      username: 'elena',
      role: 'Principal Systems & Interface Designer',
      avatar: 'ER',
      rating: null,
      parentId: 'rev-2',
      replyTo: 'sarahchen',
      mentions: ['sarahchen'],
      date: '5 days ago',
      content: '@sarahchen Son sürüm notlarında CLI üzerinden toplu yapılandırma (batch config) desteğinin eklendiğini belirtmişler, iş akışlarında oldukça pratik.',
      helpful: 5,
      verified: true,
    },
    {
      id: 'rev-3',
      toolId,
      userId: 'usr_marcus_03',
      author: 'Marcus Vance',
      username: 'marcusvance',
      role: 'Product Lead',
      avatar: 'MV',
      rating: 5,
      parentId: null,
      replyTo: null,
      mentions: [],
      date: '2 weeks ago',
      content: 'Compared to alternatives in this space, the auto-layout and context window handling is substantially more reliable.',
      helpful: 8,
      verified: false,
    },
  ];
}

function getStoredReviewsForTool(toolId) {
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r) => ({
          ...r,
          toolId: r.toolId || toolId,
          username: r.username || (r.author || 'user').toLowerCase().replace(/[^a-z0-9_]/g, ''),
          parentId: r.parentId || null,
          replyTo: r.replyTo || null,
          mentions: Array.isArray(r.mentions) ? r.mentions : extractMentions(r.content),
        }));
      }
    }
  } catch (e) {
    // fallback
  }
  const seeds = getDefaultSeededReviews(toolId);
  try {
    localStorage.setItem(key, JSON.stringify(seeds));
  } catch (e) {}
  return seeds;
}

/**
 * Fetch reviews and sub-message replies for a tool with localStorage + backend sync.
 */
export async function getReviews(toolId) {
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const localList = getStoredReviewsForTool(toolId);

  if (!useMock()) {
    let tool = backendTools.find((t) => t.id === toolId || String(t.numericId) === String(toolId));
    if (!tool && backendTools.length === 0) {
      await loadBackendCatalog();
      tool = backendTools.find((t) => t.id === toolId || String(t.numericId) === String(toolId));
    }
    const numericId = tool?.numericId || (/^\d+$/.test(String(toolId)) ? Number(toolId) : null);
    if (!numericId) return localList;
    try {
      const result = await productsApi.fetchProductComments(numericId);
      const rawList = Array.isArray(result) ? result : (result?.items || []);
      const deletedKey = `guidora_deleted_reviews_${toolId}`;
      const deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]').map(String);

      const backendMapped = rawList
        .filter((c) => !deletedIds.includes(String(c.commentId || c.id)))
        .map((c, idx) => {
          const rawText = c.content || c.text || '';
          const authorName = c.author || c.userName || (c.userId ? `Üye #${c.userId}` : 'Doğrulanmış Üye');
          const username = (c.userName || authorName).toLowerCase().replace(/[^a-z0-9_]/g, '') || `uye${c.userId || idx}`;
          return {
            id: String(c.commentId || c.id || `comment-${idx}`),
            toolId,
            userId: c.userId || null,
            author: authorName,
            username,
            role: c.role || 'Topluluk Üyesi',
            rating: typeof c.rating === 'number' && !isNaN(c.rating) ? c.rating : 5,
            parentId: c.parentId ? String(c.parentId) : null,
            replyTo: c.replyTo || null,
            mentions: extractMentions(rawText),
            date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Son zamanlarda',
            content: rawText,
            title: c.title || '',
            helpful: c.helpful || 0,
            verified: true,
          };
        });

      // Merge backend comments that are not already tracked in localList (matching by id or content)
      const merged = [...localList];
      for (const bComment of backendMapped) {
        const exists = merged.some(
          (m) => String(m.id) === String(bComment.id) || (m.content && bComment.content && m.content.trim() === bComment.content.trim())
        );
        if (!exists) {
          merged.push(bComment);
        }
      }
      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    } catch (e) {
      return localList;
    }
  }

  await simulateDelay(40);
  return localList;
}

/**
 * Add a top-level review or nested sub-message reply to a tool.
 */
export async function addReview(toolId, reviewData) {
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const existing = await getReviews(toolId);

  const authorName = reviewData.author || 'Anonymous Practitioner';
  const username =
    reviewData.username ||
    authorName.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'member';
  const isReply = Boolean(reviewData.parentId);

  const newReview = {
    id: isReply ? `sub-${Date.now()}` : `rev-${Date.now()}`,
    toolId,
    toolName: reviewData.toolName || toolId,
    userId: reviewData.userId || null,
    author: authorName,
    username,
    role: reviewData.role || 'Verified User',
    title: reviewData.title || '',
    avatar: reviewData.avatar || authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    rating: isReply ? null : (reviewData.rating || 5),
    parentId: reviewData.parentId || null,
    replyTo: reviewData.replyTo || null,
    mentions: extractMentions(reviewData.content),
    date: 'Just now',
    content: reviewData.content,
    helpful: 0,
    verified: true,
  };

  // Place top-level reviews at the top, and sub-message replies in chronological order
  const updated = isReply ? [...existing, newReview] : [newReview, ...existing];
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}

  if (!useMock()) {
    try {
      let tool = backendTools.find((t) => t.id === toolId || String(t.numericId) === String(toolId));
      if (!tool) {
        tool = await getToolById(toolId);
      }
      if (tool?.numericId) {
        await productsApi.addProductComment(tool.numericId, reviewData.content);
      }
    } catch (e) {
      // Backend comment endpoint requires backend JWT or may be unreachable; local thread store already persisted
    }
  } else {
    await simulateDelay(60);
  }

  return updated;
}

/**
 * Toggle helpful count on a review or sub-message and persist.
 */
export async function toggleReviewHelpful(toolId, reviewId, delta = 1) {
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const existing = await getReviews(toolId);
  const updated = existing.map((r) => {
    if (String(r.id) === String(reviewId)) {
      return { ...r, helpful: Math.max(0, (r.helpful || 0) + delta) };
    }
    return r;
  });
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

/**
 * Delete a review (and its nested sub-messages) from a tool.
 */
export async function deleteReview(toolId, reviewId) {
  const key = `${REVIEWS_KEY_PREFIX}${toolId}`;
  const existing = await getReviews(toolId);
  const targetId = String(reviewId);
  const updated = existing.filter(
    (r) => String(r.id) !== targetId && String(r.parentId) !== targetId
  );
  try {
    localStorage.setItem(key, JSON.stringify(updated));
    const deletedKey = `guidora_deleted_reviews_${toolId}`;
    const deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');
    if (!deletedIds.includes(targetId)) {
      deletedIds.push(targetId);
      localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
    }
  } catch (e) {}

  if (!useMock()) {
    try {
      if (/^\d+$/.test(targetId)) {
        await productsApi.deleteProductComment(targetId);
      }
    } catch (e) {
      // Local store already updated
    }
  } else {
    await simulateDelay(40);
  }
  return updated;
}

/**
 * Get all reviews across all tools (for Admin Moderation Panel & User Profile)
 */
export async function getAllReviews() {
  if (useMock()) {
    await simulateDelay(50);
  }
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
            toolCategory: tool.categoryName || tool.category,
          });
        });
      }
    } catch (e) {}
  }

  // Seed initial reviews for top catalog tools if none have been visited yet
  if (aggregated.length === 0 && allTools.length > 0) {
    const seedTargets = allTools.slice(0, Math.min(2, allTools.length));
    for (const targetTool of seedTargets) {
      const seeded = await getReviews(targetTool.id);
      seeded.forEach((rev) => {
        aggregated.push({
          ...rev,
          toolId: targetTool.id,
          toolName: targetTool.name,
          toolCategory: targetTool.categoryName || targetTool.category,
        });
      });
    }
  }

  return aggregated.sort((a, b) => (String(b.id) > String(a.id) ? 1 : -1));
}

/**
 * Get all reviews authored by a specific user across all tools
 */
export async function getUserReviews(userId) {
  const all = await getAllReviews();
  if (!userId) return [];
  return all.filter(
    (r) =>
      r.userId === userId ||
      r.author === userId ||
      (r.username && String(r.username).toLowerCase() === String(userId).toLowerCase())
  );
}

/**
 * Submit a report for a tool.
 */
export async function submitReport(toolId, reportData) {
  if (useMock()) {
    await simulateDelay(80);
  }

  let targetTool = null;
  try {
    targetTool = await getToolById(toolId);
    if (targetTool?.numericId) {
      await productsApi.reportProduct(targetTool.numericId, {
        reason: reportData.reason,
        details: reportData.details,
        contactEmail: reportData.email || '',
      });
    }
  } catch (e) {
    // Fallback to local storage when unauthenticated or offline
  }

  const report = {
    id: `rep-${Date.now()}`,
    toolId,
    toolName: targetTool?.name || reportData.toolName || toolId,
    reason: reportData.reason,
    details: reportData.details,
    email: reportData.email || '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch (e) {}

  return { success: true, message: 'Report submitted successfully', report };
}

/**
 * Fetch list of categories (queries .NET 10 API first, merges local admin overrides/colors)
 */
export async function getCategories() {
  if (!useMock()) {
    const apiCats = await taxonomiesApi.fetchCategories();
    const deletedCats = JSON.parse(localStorage.getItem('guidora_deleted_categories') || '[]');
    return (Array.isArray(apiCats) ? apiCats : [])
      .map((c) => {
        const slug = c.slug || String(c.categoryId);
        return {
          id: slug,
          numericId: c.categoryId,
          name: c.categoryName,
          count: 0,
          color: c.color || getCategoryColor(slug),
        };
      })
      .filter((c) => !deletedCats.includes(c.id));
  }
  await simulateDelay(40);
  try {
    const apiCats = await taxonomiesApi.fetchCategories();
    if (Array.isArray(apiCats) && apiCats.length > 0) {
      return apiCats.map((c) => {
        const slug = c.slug || String(c.categoryId);
        return {
          id: slug,
          numericId: c.categoryId,
          name: c.categoryName,
          count: 0,
          color: c.color || getCategoryColor(slug),
        };
      });
    }
  } catch (e) {
    // API offline, fallback to local categories
  }
  return adminGetCategories().map((c) => ({
    ...c,
    color: c.color || getCategoryColor(c.id),
  }));
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
 * Fetch hierarchical tag categories (normalized across live backend and local admin store)
 */
export async function getTagCategories() {
  if (useMock()) {
    await simulateDelay(40);
    return adminGetTagCategories();
  }
  try {
    const [rawCats, rawTags] = await Promise.all([
      taxonomiesApi.fetchTagCategories(),
      taxonomiesApi.fetchTags(),
    ]);
    if (Array.isArray(rawCats) && rawCats.length > 0) {
      const localGroups = adminGetTagCategories();
      const apiMapped = rawCats.map((cat) => {
        const slugId =
          cat.slug ||
          (cat.tagCategoryName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
          String(cat.tagCategoryId);
        const matchingLocal = localGroups.find(
          (lg) =>
            lg.id === slugId ||
            lg.name?.toLowerCase() === (cat.tagCategoryName || '').toLowerCase()
        );
        const catTags = (Array.isArray(rawTags) ? rawTags : [])
          .filter((t) => t.tagCategoryId === cat.tagCategoryId)
          .map((t) => ({
            id: t.slug || (t.tagName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            numericId: t.tagId,
            name: t.tagName,
            only: Boolean(matchingLocal?.isSingleSelect),
          }));

        // Merge any custom local tags added in Admin Panel under this group
        if (matchingLocal && Array.isArray(matchingLocal.tags)) {
          for (const lt of matchingLocal.tags) {
            if (!catTags.some((ct) => ct.id === lt.id || ct.name.toLowerCase() === lt.name.toLowerCase())) {
              catTags.push(lt);
            }
          }
        }

        return {
          id: matchingLocal?.id || slugId,
          numericId: cat.tagCategoryId,
          name: matchingLocal?.name || cat.tagCategoryName,
          isSingleSelect: Boolean(matchingLocal?.isSingleSelect),
          tags: catTags,
        };
      });

      // Append any custom local tag categories created in Admin Panel
      for (const lg of localGroups) {
        if (
          !apiMapped.some(
            (am) => am.id === lg.id || am.name?.toLowerCase() === lg.name?.toLowerCase()
          )
        ) {
          apiMapped.push(lg);
        }
      }
      return apiMapped;
    }
  } catch (e) {
    // Fallback to local tag categories
  }
  return adminGetTagCategories();
}

/**
 * Fetch all available tags alphabetically
 */
export async function getAllTags() {
  const tagCats = await getTagCategories();
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
