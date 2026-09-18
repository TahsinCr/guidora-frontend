import { TOOLS_DATA, CATEGORIES } from './mockData';

// Simulated artificial network latency for realistic async behavior (100ms)
const simulateDelay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch list of tools with optional search query, category, and sorting filters.
 * Once a real backend is ready, replace this logic with `fetch('/api/v1/tools', ...)`
 */
export async function getTools({
  search = '',
  category = 'all',
  sort = 'relevance',
  filterVerified = false,
  verification = { admin: false, community: false, bot: false },
  filterPricing = 'all',
  platform = 'all',
  page = 1,
  limit = 12,
} = {}) {
  await simulateDelay(80);

  let filtered = [...TOOLS_DATA];

  // Category filter
  if (category && category !== 'all') {
    filtered = filtered.filter((t) => t.categoryId === category);
  }

  // Search filter
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  // Detailed Verification filter
  if (verification?.admin || verification?.community || verification?.bot) {
    filtered = filtered.filter((t) => {
      if (verification.admin && !t.verified.admin) return false;
      if (verification.community && !t.verified.community) return false;
      if (verification.bot && !t.verified.audited) return false;
      return true;
    });
  } else if (filterVerified) {
    filtered = filtered.filter((t) => t.verified.admin || t.verified.community);
  }

  // Pricing filter
  if (filterPricing && filterPricing !== 'all') {
    filtered = filtered.filter((t) => t.pricing.toLowerCase() === filterPricing.toLowerCase());
  }

  // Platform filter
  if (platform && platform !== 'all') {
    filtered = filtered.filter((t) =>
      t.platforms ? t.platforms.map((p) => p.toLowerCase()).includes(platform.toLowerCase()) : true
    );
  }

  // Sorting
  if (sort === 'highest-rated') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'most-viewed') {
    filtered.sort((a, b) => parseFloat(b.views) - parseFloat(a.views));
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
 * Once real backend is ready: `fetch(`/api/v1/tools/${id}`)`
 */
export async function getToolById(id) {
  await simulateDelay(100);
  const tool = TOOLS_DATA.find((t) => t.id === id);
  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }

  // Find 2 similar tools from the same or other categories
  const similar = TOOLS_DATA
    .filter((t) => t.id !== id)
    .slice(0, 2)
    .map((t) => ({
      id: t.id,
      name: t.name.replace(/ (AI|Studio|Labs)$/i, ''),
      category: t.category.split(' ')[0],
      pricing: t.pricing.split(' ')[0],
    }));

  return {
    ...tool,
    rank: tool.rank || '#4',
    rating: tool.rating || 4.8,
    monthlyVisits: tool.monthlyVisits || '1.2M',
    license: tool.license || 'Proprietary',
    platformDisplay: tool.platforms ? tool.platforms.slice(0, 2).join(', ') : 'Web, API',
    access: tool.access || 'Waitlist',
    updated: tool.updated || '2 days ago',
    creator: tool.creator || {
      name: `${tool.name.split(' ')[0]}Labs Inc.`,
      initials: tool.name.slice(0, 2).toUpperCase(),
      verified: true,
    },
    similarTools: similar.length >= 2 ? similar : [
      { id: 'codewizard-ai', name: 'CodeWizard', category: 'Coding', pricing: 'Free' },
      { id: 'figma', name: 'DataMind', category: 'Analytics', pricing: 'Paid' },
    ],
    overviewText: {
      lead: `${tool.name} is a cutting-edge platform designed to bridge the gap between creative ideation and final production. Unlike standard LLM wrappers, ${tool.name} provides a context-aware workspace where your code repositories, design assets, and marketing guidelines live together.`,
      detail: `Whether you are a developer looking to auto-generate unit tests or a marketer crafting a month's worth of social content, our fine-tuned models adapt to your specific brand voice and coding standards.`,
    },
    keyFeatures: [
      'Unified Context Window (100k token memory)',
      'Multi-Modal Pipeline (Image to Code)',
      'Real-time Team Sync & Collaboration',
    ],
    capabilities: [
      'Text Generation',
      'Image Synthesis',
      'Code Completion',
      'Data Analysis',
      'Workflow Automation',
      'Semantic Search',
    ],
  };
}

/**
 * Fetch list of categories
 */
export async function getCategories() {
  await simulateDelay(50);
  return [...CATEGORIES];
}

