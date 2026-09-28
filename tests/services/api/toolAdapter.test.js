import { describe, it, expect } from 'vitest';
import { adaptProductDtoToTool, adaptToolToCreateProductRequest } from '@/services/api/toolAdapter';

describe('Tool Adapter - .NET 10 DTO Mapping Layer', () => {
  const sampleDotNetDto = {
    productId: 101,
    name: 'NeuroGen Studio',
    slug: 'neurogen-studio',
    shortDescription: 'Advanced generative diffusion canvas',
    description: 'Deep neural network powered creative studio for generative art and video synthesis.',
    websiteUrl: 'https://neurogen.ai',
    logoUrl: 'https://cdn.guidora.io/logos/neurogen.png',
    categorySlug: 'generative-art',
    categoryName: 'Generative Art',
    tags: ['generative', 'ai-art', 'diffusion'],
    rating: 4.9,
    reviewCount: 342,
    pricing: 'Freemium',
    pricingModel: 'freemium',
    isAdminVerified: true,
    isCommunityVerified: true,
    platform: ['Web', 'macOS', 'Windows'],
    monthlyVisits: '1.2M',
    license: 'Proprietary',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  };

  it('correctly adapts a full .NET 10 ProductResponseDto to frontend ToolItem', () => {
    const tool = adaptProductDtoToTool(sampleDotNetDto);

    expect(tool).not.toBeNull();
    expect(tool.id).toBe('neurogen-studio');
    expect(tool.numericId).toBe(101);
    expect(tool.name).toBe('NeuroGen Studio');
    expect(tool.tagline).toBe('Advanced generative diffusion canvas');
    expect(tool.website).toBe('https://neurogen.ai');
    expect(tool.category).toBe('generative-art');
    expect(tool.categoryName).toBe('Generative Art');
    expect(tool.rating).toBe(4.9);
    expect(tool.reviewCount).toBe(342);
    expect(tool.verified.admin).toBe(true);
    expect(tool.verified.community).toBe(true);
    expect(tool.verified.bot).toBe(false);
    expect(tool.platform).toEqual(['Web', 'macOS', 'Windows']);
  });

  it('safely handles missing or null fields with resilient defaults', () => {
    const minimalDto = {
      productId: 404,
      name: 'Minimal Bot',
      // slug, shortDescription, rating, tags, etc. are missing
    };

    const tool = adaptProductDtoToTool(minimalDto);

    expect(tool).not.toBeNull();
    expect(tool.id).toBe('404');
    expect(tool.name).toBe('Minimal Bot');
    expect(tool.tagline).toBe('');
    expect(tool.website).toBe('#');
    expect(tool.logo).toBeNull();
    expect(tool.category).toBe('developer-tools');
    expect(tool.rating).toBe(4.8);
    expect(tool.tags).toEqual(['productivity', 'developer']);
    expect(tool.verified.admin).toBe(true);
    expect(tool.verified.community).toBe(false);
  });

  it('returns null when given null or undefined input', () => {
    expect(adaptProductDtoToTool(null)).toBeNull();
    expect(adaptProductDtoToTool(undefined)).toBeNull();
  });

  it('adapts a frontend ToolItem to a valid .NET 10 CreateProductRequest payload', () => {
    const frontendTool = {
      id: 'quantum-forge',
      name: 'Quantum Forge AI',
      tagline: 'Quantum algorithm simulator',
      description: 'Full-stack cloud simulation engine for hybrid quantum-classical algorithms.',
      website: 'https://quantumforge.io',
      logo: 'https://cdn.guidora.io/logos/qf.png',
      categoryIds: [3],
      tagIds: [12, 18],
    };

    const requestPayload = adaptToolToCreateProductRequest(frontendTool, 3);

    expect(requestPayload.name).toBe('Quantum Forge AI');
    expect(requestPayload.slug).toBe('quantum-forge');
    expect(requestPayload.shortDescription).toBe('Quantum algorithm simulator');
    expect(requestPayload.websiteUrl).toBe('https://quantumforge.io');
    expect(requestPayload.categoryIds).toEqual([3]);
    expect(requestPayload.tagIds).toEqual([12, 18]);
  });
});
