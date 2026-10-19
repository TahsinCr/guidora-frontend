import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import SubmitToolPage from '@/components/submit/SubmitToolPage';
import { adaptToolToCreateProductRequest } from '@/services/api/toolAdapter';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

describe('SubmitToolPage Component & Adapter', () => {
  it('renders SubmitToolPage with auth banner when unauthenticated', () => {
    const html = renderToString(
      <ThemeProvider>
        <LanguageProvider>
          <SubmitToolPage
            currentUser={null}
            onOpenAuth={() => {}}
            onBack={() => {}}
            onToolCreated={() => {}}
          />
        </LanguageProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Please sign in to submit your tool');
    expect(html).toContain('Submit a New Software Tool');
  });

  it('renders SubmitToolPage cleanly when authenticated', () => {
    const fakeUser = {
      id: 242,
      username: 'tahsincr',
      email: 'tahsincrs@gmail.com',
      role: 'admin',
    };

    const html = renderToString(
      <ThemeProvider>
        <LanguageProvider>
          <SubmitToolPage
            currentUser={fakeUser}
            onOpenAuth={() => {}}
            onBack={() => {}}
            onToolCreated={() => {}}
          />
        </LanguageProvider>
      </ThemeProvider>
    );

    // Should not contain the auth prompt notice
    expect(html).not.toContain('Please sign in to submit your tool');
    expect(html).toContain('Submit a New Software Tool');
  });

  it('adapts tool submission to valid .NET 10 CreateProductRequest contract', () => {
    const toolPayload = {
      name: 'VLLM Engine',
      categoryId: 'developer-tools',
      category: 'Coding Assistants',
      categoryIds: [89],
      tagline: 'High-throughput LLM serving engine',
      description: 'High-throughput and memory-efficient LLM serving engine.',
      websiteUrl: 'https://vllm.ai',
      logoUrl: 'https://vllm.ai/logo.svg',
      selectedTags: [
        { id: 'web', name: 'Web' },
        { id: 'api', name: 'API' },
      ],
      readme: '# vLLM Engine\n\nFast LLM serving with PagedAttention.',
    };

    const request = adaptToolToCreateProductRequest(toolPayload);

    expect(request.name).toBe('VLLM Engine');
    expect(request.slug).toBe('vllm-engine');
    expect(request.categoryIds).toEqual([89]);
    expect(request.websiteUrl).toBe('https://vllm.ai');
    expect(request.logoUrl).toBe('https://vllm.ai/logo.svg');
    expect(request.shortDescription).toContain('High-throughput');
    expect(request.description).toContain('PagedAttention');
    expect(Array.isArray(request.tagIds)).toBe(true);
    // Known tags 'web' -> 23, 'api' -> 25
    expect(request.tagIds).toContain(23);
    expect(request.tagIds).toContain(25);
  });

  it('supplies fallback logo and category when fields are omitted', () => {
    const minimalTool = {
      name: 'Minimal Platform',
      tagline: 'Fast tools',
      categoryId: 'generative-art',
    };

    const request = adaptToolToCreateProductRequest(minimalTool);

    expect(request.categoryIds).toEqual([88]); // Maps 'generative-art' to 88
    expect(request.logoUrl).toBe('https://guidora.dev/logo.svg');
    expect(request.websiteUrl).toBe('https://minimal-platform.com');
  });
});
