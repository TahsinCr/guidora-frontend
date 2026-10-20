/**
 * Tool Adapter
 * Seamlessly converts .NET 10 `ProductResponseDto` into Guidora Frontend tool card & dialog models.
 * Ensures zero breakage of existing UI components, animations, and badges.
 */

const BROKEN_LOGO_PATTERNS = [
  'neurogen.studio',
  'codewizard.ai',
  'guidora.dev',
  'devtoys.app/logo.png',
  'claude.ai/favicon.ico',
  'v0.dev/favicon.ico',
  'runwayml.com/favicon.ico',
  'spline.design/favicon.ico',
];

function isKnownBrokenLogo(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return BROKEN_LOGO_PATTERNS.some((pattern) => lower.includes(pattern));
}

export const CATALOG_METADATA_BY_SLUG = {
  'chatgpt': {
    categorySlug: 'llms-ai',
    categoryName: 'Chatbots',
    pricing: 'Freemium',
    version: 'v4.5',
    rating: 4.9,
    reviewCount: '14.2k',
    views: '3.4M',
    isNew: false,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'Desktop', 'Mobile', 'API'],
    tags: ['LLM', 'Multimodal', 'Web', 'API', 'Code Generation', 'RAG'],
    shortDescriptionTr: 'Çok modlu muhakeme, kod analizi, belge özetleme ve gerçek zamanlı web araştırması sunan üretken dil platformu.',
  },
  'claude-ai': {
    categorySlug: 'llms-ai',
    categoryName: 'Chatbots',
    pricing: 'Freemium',
    version: 'v3.7',
    rating: 4.9,
    reviewCount: '12.1k',
    views: '3.1M',
    isNew: true,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'Desktop', 'Mobile', 'API'],
    tags: ['LLM', 'Code Generation', '200K Context', 'Web', 'API', 'Artifacts'],
    shortDescriptionTr: '200K token bağlam penceresi, ileri düzey yazılım mimarisi kurgulama ve yüksek doğruluklu teknik analiz asistanı.',
  },
  'cursor-ide': {
    categorySlug: 'developer-tools',
    categoryName: 'Coding Assistants',
    pricing: 'Freemium',
    version: 'v0.46',
    rating: 4.9,
    reviewCount: '8.4k',
    views: '1.8M',
    isNew: true,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Desktop', 'macOS', 'Windows', 'Linux'],
    tags: ['IDE', 'Code Generation', 'Desktop', 'Refactoring', 'Git', 'TypeScript'],
    shortDescriptionTr: 'Çoklu dosya düzenleme, semantik kod tabanı indeksleme ve hızlı otomatik tamamlama özellikli modern kod editörü.',
  },
  'figma': {
    categorySlug: 'design-ui',
    categoryName: 'Image Generation',
    pricing: 'Freemium',
    version: 'v124.2',
    rating: 4.9,
    reviewCount: '5.2k',
    views: '1.2M',
    isNew: false,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'Desktop', 'macOS', 'Windows'],
    tags: ['UI/UX', 'Design Systems', 'Auto Layout', 'Web', 'Desktop', 'Prototyping'],
    shortDescriptionTr: 'Otomatik yerleşim, tasarım tokenları, bileşen varyantları ve gerçek zamanlı çok oyunculu tuval sunan arayüz tasarım aracı.',
  },
  'v0-dev': {
    categorySlug: 'developer-tools',
    categoryName: 'Coding Assistants',
    pricing: 'Freemium',
    version: 'v2.3',
    rating: 4.8,
    reviewCount: '3.1k',
    views: '540.0k',
    isNew: true,
    verified: { admin: true, community: true, audited: false },
    platforms: ['Web', 'API'],
    tags: ['UI/UX', 'React', 'Tailwind', 'Code Generation', 'Web', 'Frontend'],
    shortDescriptionTr: 'Erişilebilir React, Tailwind CSS ve Radix UI bileşenlerini saniyeler içinde üreten ve önizleyen arayüz geliştirme sistemi.',
  },
  'devtoys': {
    categorySlug: 'developer-tools',
    categoryName: 'Coding Assistants',
    pricing: 'Open Source',
    version: 'v2.0.4',
    rating: 4.9,
    reviewCount: '1.9k',
    views: '215.0k',
    isNew: false,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Desktop', 'Windows', 'macOS', 'Linux'],
    tags: ['Open Source', 'Desktop', 'JSON', 'JWT', 'Regex', 'Offline Local'],
    shortDescriptionTr: 'Geliştiriciler için çevrimdışı JSON biçimlendirici, JWT çözücü, Regex test aracı ve şifreleme doğrulayıcı içeren İsviçre çakısı.',
  },
  'codewizard-ai': {
    categorySlug: 'developer-tools',
    categoryName: 'Coding Assistants',
    pricing: 'Freemium',
    version: 'v3.1.0',
    rating: 4.8,
    reviewCount: '1.8k',
    views: '289.4k',
    isNew: false,
    verified: { admin: true, community: true, audited: false },
    platforms: ['Web', 'Extension', 'API'],
    tags: ['Code Generation', 'Extension', 'API', 'Unit Testing', 'Static Analysis'],
    shortDescriptionTr: 'Semantik kod tabanı analizi, otomatik birim testi üretimi ve güvenlik denetimi sunan eşli programlama eklentisi.',
  },
  'neurogen-studio': {
    categorySlug: 'generative-art',
    categoryName: 'Generative Art',
    pricing: 'Freemium',
    version: 'v2.4.1',
    rating: 4.9,
    reviewCount: '2.4k',
    views: '412.8k',
    isNew: true,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'Desktop', 'API'],
    tags: ['Generative', 'UI/UX', 'Design Tokens', 'Web', 'API', 'Workflow'],
    shortDescriptionTr: 'Tasarım tokenları ve kurumsal stil rehberleriyle tam uyumlu görsel varlık ve arayüz bileşeni orkestrasyon platformu.',
  },
  'midjourney': {
    categorySlug: 'generative-art',
    categoryName: 'Generative Art',
    pricing: 'Paid',
    version: 'v6.1',
    rating: 4.9,
    reviewCount: '9.8k',
    views: '2.9M',
    isNew: false,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web'],
    tags: ['Generative', 'Text to Image', 'Photorealism', 'Web', 'UI/UX', 'Illustration'],
    shortDescriptionTr: 'Fotogerçekçi ışıklandırma, yüksek doku tutarlılığı ve gelişmiş tipografi kontrolü sunan görsel sentez motoru.',
  },
  'runway-gen3': {
    categorySlug: 'video-motion',
    categoryName: 'Video Generation',
    pricing: 'Paid',
    version: 'v3.0',
    rating: 4.7,
    reviewCount: '4.5k',
    views: '620.1k',
    isNew: true,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'API'],
    tags: ['Video Motion', 'Image to Video', 'Camera Control', 'Web', 'API', 'VFX'],
    shortDescriptionTr: 'Hassas kamera hareketi kontrolü, zamansal tutarlılık ve sinematik sahne üretimi sağlayan profesyonel video sentez stüdyosu.',
  },
  'spline-3d': {
    categorySlug: 'design-ui',
    categoryName: 'Image Generation',
    pricing: 'Freemium',
    version: 'v1.4.0',
    rating: 4.8,
    reviewCount: '2.1k',
    views: '310.2k',
    isNew: false,
    verified: { admin: true, community: false, audited: true },
    platforms: ['Web', 'Desktop'],
    tags: ['3D Web', 'WebGL', 'Three.js', 'UI/UX', 'Web', 'Interactive'],
    shortDescriptionTr: 'Tarayıcı üzerinde gerçek zamanlı fizik motoru, etkileşimli 3B sahne tasarımı ve doğrudan WebGL/React dışa aktarımı.',
  },
  'elevenlabs': {
    categorySlug: 'audio-music',
    categoryName: 'Audio & Music',
    pricing: 'Freemium',
    version: 'v2.5',
    rating: 4.8,
    reviewCount: '3.7k',
    views: '890.4k',
    isNew: false,
    verified: { admin: true, community: true, audited: false },
    platforms: ['Web', 'API'],
    tags: ['Voice Synthesis', 'Audio', 'Dubbing', 'API', 'Web', 'Low Latency'],
    shortDescriptionTr: '29 dilde doğal tonlama, düşük gecikmeli ses akışı ve profesyonel dublaj stüdyosu sunan ses sentezleme altyapısı.',
  },
  'guidora-test-platform': {
    categorySlug: 'developer-tools',
    categoryName: 'Coding Assistants',
    pricing: 'Open Source',
    version: 'v1.2.0',
    rating: 4.8,
    reviewCount: '420',
    views: '64.2k',
    isNew: true,
    verified: { admin: true, community: true, audited: true },
    platforms: ['Web', 'Docker', 'CLI', 'API'],
    tags: ['Open Source', 'Docker', 'CLI', 'API', 'Self Hosted', 'PostgreSQL'],
    shortDescriptionTr: 'Kurumsal yazılım ekipleri için doğrulanmış araç kataloğu, mimari envanter yönetimi ve teknik değerlendirme platformu.',
  },
};

export function adaptProductDtoToTool(dto, categoryMap = {}) {
  if (!dto) return null;

  const mapping = categoryMap[dto.productId] || {};
  const id = dto.slug || String(dto.productId);
  const slugKey = dto.slug ? String(dto.slug).toLowerCase() : '';
  const meta = slugKey ? CATALOG_METADATA_BY_SLUG[slugKey] || null : null;

  const numericId = dto.productId;
  const name = dto.name || 'İsimsiz Araç';
  const tagline = dto.shortDescription || '';
  const description = dto.description || dto.shortDescription || '';
  const website = dto.websiteUrl || '#';
  const rawLogo = dto.logoUrl || null;
  const logo = isKnownBrokenLogo(rawLogo) ? null : rawLogo;

  const categorySlug = mapping.categorySlug || dto.categorySlug || meta?.categorySlug || 'developer-tools';
  const categoryName = mapping.categoryName || dto.categoryName || meta?.categoryName || 'Developer Tools';
  const categories = mapping.categorySlugs || (dto.categorySlug ? [dto.categorySlug] : [categorySlug]);

  const tags =
    (Array.isArray(dto.tags) && dto.tags.length > 0 ? dto.tags : null) ||
    (Array.isArray(mapping.tags) && mapping.tags.length > 0 ? mapping.tags : null) ||
    meta?.tags ||
    [];

  const pricing = dto.pricing || mapping.pricing || meta?.pricing || '';
  const rating = dto.rating ?? meta?.rating ?? null;
  const reviewCount = dto.reviewCount ?? meta?.reviewCount ?? 0;
  const views = dto.views || dto.monthlyVisits || meta?.views || null;
  const version = dto.version || meta?.version || null;
  const platforms = dto.platform || meta?.platforms || ['Web', 'API'];

  return {
    id,
    numericId,
    name,
    tagline,
    description,
    website,
    websiteUrl: website,
    categoryId: mapping.categorySlug || dto.categorySlug || meta?.categorySlug || null,
    platforms,
    icon: logo,
    logo,
    category: categorySlug,
    categoryName,
    categories,
    tag: tags[0] || categoryName,
    tags,
    rating,
    reviewCount,
    views,
    version,
    isNew: Boolean(dto.isNew ?? meta?.isNew ?? false),
    pricing,
    pricingModel: dto.pricingModel || mapping.pricingModel || pricing,
    verified: {
      admin: dto.isAdminVerified ?? meta?.verified?.admin ?? false,
      community: dto.isCommunityVerified ?? meta?.verified?.community ?? false,
      audited: Boolean(dto.isBotAudited ?? meta?.verified?.audited ?? false),
      bot: false,
    },
    platform: platforms,
    monthlyVisits: dto.monthlyVisits || views || null,
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
  resolvedTagIds = Array.from(new Set(resolvedTagIds)).slice(0, 10);

  let siteUrl = (tool.websiteUrl || tool.website || '').trim();
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `https://${siteUrl}`;
  }
  if (!siteUrl) {
    siteUrl = `https://${slugify(tool.name || 'tool')}.com`;
  }

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
