/**
 * Tool Adapter
 * Seamlessly converts .NET 10 `ProductResponseDto` into Guidora Frontend tool card & dialog models.
 * Ensures zero breakage of existing UI components, animations, and badges.
 */

export function adaptProductDtoToTool(dto, categoryMap = {}) {
  if (!dto) return null;

  const id = dto.slug || String(dto.productId);
  const numericId = dto.productId;
  const name = dto.name || 'İsimsiz Araç';
  const tagline = dto.shortDescription || '';
  const description = dto.description || dto.shortDescription || '';
  const website = dto.websiteUrl || '#';
  const logo = dto.logoUrl || null;

  return {
    id,
    numericId,
    name,
    tagline,
    description,
    website,
    websiteUrl: website,
    categoryId: dto.categorySlug || null,
    platforms: dto.platform || [],
    logo,
    category: dto.categorySlug || 'developer-tools',
    categoryName: dto.categoryName || 'Developer Tools',
    tags: dto.tags || [],
    rating: dto.rating ?? null,
    reviewCount: dto.reviewCount ?? 0,
    pricing: dto.pricing || '',
    pricingModel: dto.pricingModel || '',
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

export function adaptToolToCreateProductRequest(tool, categoryId = 1) {
  return {
    name: tool.name,
    slug: tool.id || slugify(tool.name),
    shortDescription: tool.tagline || tool.description?.slice(0, 200) || '',
    description: tool.description || '',
    websiteUrl: tool.websiteUrl || tool.website || '',
    logoUrl: tool.logoUrl || tool.logo || '',
    categoryIds: tool.categoryIds || [categoryId],
    tagIds: tool.tagIds || [],
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
