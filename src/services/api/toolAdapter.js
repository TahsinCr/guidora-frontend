/**
 * Tool Adapter
 * Seamlessly converts .NET 10 `ProductResponseDto` into Guidora Frontend tool card & dialog models.
 * Ensures zero breakage of existing UI components, animations, and badges.
 */

export function adaptProductDtoToTool(dto, categoryMap = {}) {
  if (!dto) return null;

  const mapping = categoryMap[dto.productId] || {};
  const id = dto.slug || String(dto.productId);
  const numericId = dto.productId;
  const name = dto.name || 'İsimsiz Araç';
  const tagline = dto.shortDescription || '';
  const description = dto.description || dto.shortDescription || '';
  const website = dto.websiteUrl || '#';
  const logo = dto.logoUrl || null;
  const categorySlug = mapping.categorySlug || dto.categorySlug || 'developer-tools';
  const categoryName = mapping.categoryName || dto.categoryName || 'Developer Tools';
  const categories = mapping.categorySlugs || (dto.categorySlug ? [dto.categorySlug] : [categorySlug]);

  return {
    id,
    numericId,
    name,
    tagline,
    description,
    website,
    websiteUrl: website,
    categoryId: mapping.categorySlug || dto.categorySlug || null,
    platforms: dto.platform || ['Web', 'API'],
    icon: logo,
    logo,
    category: categorySlug,
    categoryName,
    categories,
    tags: dto.tags || mapping.tags || [],
    rating: dto.rating ?? null,
    reviewCount: dto.reviewCount ?? 0,
    pricing: dto.pricing || mapping.pricing || '',
    pricingModel: dto.pricingModel || mapping.pricingModel || '',
    verified: {
      admin: dto.isAdminVerified ?? false,
      community: dto.isCommunityVerified ?? false,
      bot: false,
    },
    platform: dto.platform || ['Web', 'API'],
    monthlyVisits: dto.monthlyVisits || null,
    license: dto.license || '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

const DEFAULT_CATEGORY_SLUG_MAP = {
  'generative-art': 88,
  'developer-tools': 89,
  'design-ui': 90,
  'llms-ai': 91,
  'video-motion': 92,
  'data-science': 93,
  'audio-music': 94,
  'productivity': 95,
  '3d-motion': 96,
};

const DEFAULT_TAG_SLUG_MAP = {
  'free': 19,
  'freemium': 20,
  'paid': 21,
  'open-source': 22,
  'web': 23,
  'desktop': 24,
  'api': 25,
  'extension': 26,
  'llm': 27,
  'generative': 28,
  'code-gen': 29,
  'uiux': 30,
};

export function adaptToolToCreateProductRequest(tool, categoryId = 88) {
  // Resolve category IDs: check explicit numbers, numeric strings, or slug lookup
  let resolvedCategoryIds = [];
  if (Array.isArray(tool.categoryIds) && tool.categoryIds.length > 0) {
    resolvedCategoryIds = tool.categoryIds
      .map((id) => (typeof id === 'number' ? id : parseInt(id, 10)))
      .filter((id) => Number.isInteger(id) && id > 0);
  } else if (tool.categoryId) {
    const raw = tool.categoryId;
    if (typeof raw === 'number' && raw > 0) {
      resolvedCategoryIds = [raw];
    } else if (typeof raw === 'string') {
      const parsed = parseInt(raw, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        resolvedCategoryIds = [parsed];
      } else if (DEFAULT_CATEGORY_SLUG_MAP[raw.toLowerCase()]) {
        resolvedCategoryIds = [DEFAULT_CATEGORY_SLUG_MAP[raw.toLowerCase()]];
      }
    }
  }

  if (resolvedCategoryIds.length === 0) {
    resolvedCategoryIds = [categoryId || 88];
  }

  // Resolve tag IDs to positive integers
  let resolvedTagIds = [];
  const rawTags = tool.tagIds || tool.tags || tool.selectedTags || [];
  if (Array.isArray(rawTags)) {
    rawTags.forEach((t) => {
      if (typeof t === 'number' && t > 0) {
        resolvedTagIds.push(t);
      } else if (typeof t === 'string') {
        const parsed = parseInt(t, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
          resolvedTagIds.push(parsed);
        } else if (DEFAULT_TAG_SLUG_MAP[t.toLowerCase()]) {
          resolvedTagIds.push(DEFAULT_TAG_SLUG_MAP[t.toLowerCase()]);
        }
      } else if (t && typeof t === 'object') {
        if (typeof t.numericId === 'number' && t.numericId > 0) {
          resolvedTagIds.push(t.numericId);
        } else if (typeof t.id === 'string' && DEFAULT_TAG_SLUG_MAP[t.id.toLowerCase()]) {
          resolvedTagIds.push(DEFAULT_TAG_SLUG_MAP[t.id.toLowerCase()]);
        }
      }
    });
  }
  // Deduplicate and cap at 10 tags
  resolvedTagIds = Array.from(new Set(resolvedTagIds)).slice(0, 10);

  // Normalize website URL
  let siteUrl = (tool.websiteUrl || tool.website || '').trim();
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `https://${siteUrl}`;
  }
  if (!siteUrl) {
    siteUrl = `https://${slugify(tool.name || 'tool')}.com`;
  }

  // Normalize logo URL
  let logoUrl = (tool.logoUrl || tool.logo || tool.icon || '').trim();
  if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
    logoUrl = `https://${logoUrl}`;
  }
  if (!logoUrl) {
    logoUrl = 'https://guidora.dev/logo.svg';
  }

  const shortDesc = (tool.tagline || tool.shortDescription || tool.description || tool.name || '').trim().slice(0, 500);
  const fullDesc = (tool.readme || tool.description || tool.tagline || tool.name || '').trim().slice(0, 20000);

  return {
    name: (tool.name || 'Unnamed Tool').trim(),
    slug: (tool.slug || tool.id || slugify(tool.name || 'unnamed-tool')).trim(),
    shortDescription: shortDesc || 'Developer and designer productivity software.',
    description: fullDesc || 'Comprehensive software suite and developer tool.',
    websiteUrl: siteUrl,
    logoUrl: logoUrl,
    categoryIds: resolvedCategoryIds,
    tagIds: resolvedTagIds,
  };
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

