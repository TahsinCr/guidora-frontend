/**
 * Mock API Server for Docker & Local QA Testing
 * Emulates the essential .NET 10 WebAPI contracts:
 * - /health/live & /health/ready
 * - POST /api/auth/login, POST /api/auth/register, POST /api/auth/refresh, POST /api/auth/logout
 * - GET /api/categories
 * - GET /api/products, GET /api/products/:id
 */

import http from 'http';

const PORT = process.env.PORT || 8080;

function sendJson(res, statusCode, data, headers = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = url;
  const method = req.method.toUpperCase();

  // Health checks
  if (pathname === '/health/live' || pathname === '/health/ready' || pathname === '/health') {
    return sendJson(res, 200, { status: 'Healthy', version: '1.0.0-mock' });
  }

  // Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseJsonBody(req);
    const email = body.email || 'demo@guidora.io';

    return sendJson(
      res,
      200,
      {
        success: true,
        message: 'Giriş başarılı.',
        data: {
          accessToken: {
            token: `mock_jwt_access_token_${Date.now()}`,
            expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            sessionId: '8e4d729d-b2d1-4ff5-ba21-e916c3c16ac2',
          },
          isPersistentSession: true,
          refreshTokenExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        'Set-Cookie': 'guidora_refresh=mock_refresh_token_xyz; Path=/; HttpOnly; SameSite=Lax',
      }
    );
  }

  // Auth: Refresh
  if (pathname === '/api/auth/refresh' && method === 'POST') {
    return sendJson(
      res,
      200,
      {
        success: true,
        message: 'Oturum yenilendi.',
        data: {
          accessToken: {
            token: `mock_jwt_refreshed_token_${Date.now()}`,
            expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            sessionId: '8e4d729d-b2d1-4ff5-ba21-e916c3c16ac2',
          },
          isPersistentSession: true,
          refreshTokenExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        'Set-Cookie': 'guidora_refresh=mock_refreshed_token_xyz; Path=/; HttpOnly; SameSite=Lax',
      }
    );
  }

  // Auth: Logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    res.writeHead(204, {
      'Set-Cookie': 'guidora_refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
    });
    return res.end();
  }

  // Categories
  if (pathname === '/api/categories' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      message: 'Kategoriler getirildi.',
      data: [
        { categoryId: 1, categoryName: 'Generative Art', slug: 'generative-art', isActive: true },
        { categoryId: 2, categoryName: 'Coding Assistants', slug: 'developer-tools', isActive: true },
        { categoryId: 3, categoryName: 'Image Generation', slug: 'design-ui', isActive: true },
        { categoryId: 4, categoryName: 'Chatbots & LLMs', slug: 'llms-ai', isActive: true },
        { categoryId: 5, categoryName: 'Productivity & SaaS', slug: 'productivity', isActive: true },
      ],
    });
  }

  // Products
  if (pathname === '/api/products' && method === 'GET') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    return sendJson(res, 200, {
      success: true,
      message: 'Ürünler listelendi.',
      data: {
        items: [
          {
            productId: 101,
            name: 'NeuroGen Studio',
            slug: 'neurogen-studio',
            shortDescription: 'Enterprise Generative Art and Diffusion Canvas suite.',
            description: 'State-of-the-art multimodal AI generative platform with low-latency API pipelines.',
            websiteUrl: 'https://neurogen.ai',
            logoUrl: null,
            createdAt: '2026-01-15T00:00:00Z',
            updatedAt: '2026-09-20T00:00:00Z',
          },
          {
            productId: 102,
            name: 'CodeWizard AI',
            slug: 'codewizard-ai',
            shortDescription: 'Intelligent pair programming and code synthesis engine.',
            description: 'Ultra-fast LLM tailored for refactoring, test generation, and deep debugging.',
            websiteUrl: 'https://codewizard.dev',
            logoUrl: null,
            createdAt: '2026-02-10T00:00:00Z',
            updatedAt: '2026-09-22T00:00:00Z',
          },
        ],
        page,
        pageSize,
        totalCount: 2,
      },
    });
  }

  // Fallback 404
  return sendJson(res, 404, {
    success: false,
    message: `Mock endpoint '${pathname}' bulunamadı.`,
    statusCode: 404,
  });
});

server.listen(PORT, () => {
  console.log(`[Guidora Mock API Server] Running on port ${PORT}`);
});
