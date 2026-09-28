/**
 * Guidora Mock API Engine & Route Handler
 * 
 * Provides an in-process, zero-dependency mock implementation of the .NET 10 WebAPI contracts.
 * Used by:
 * 1. Vite dev server middleware (eliminates ECONNREFUSED proxy errors in local dev)
 * 2. Standalone Node.js server (infra/mock-server/server.mjs)
 * 3. Docker demo container (docker compose backend service)
 */

function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
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
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data, headers = {}) {
  const payload = JSON.stringify(data);
  const responseHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  };

  if (!res.headersSent) {
    res.writeHead(statusCode, responseHeaders);
  }
  res.end(payload);
}

// Initial Mock Datasets
const MOCK_CATEGORIES = [
  { categoryId: 1, categoryName: 'Generative Art', slug: 'generative-art', isActive: true, count: 14, color: '#A855F7' },
  { categoryId: 2, categoryName: 'Coding Assistants', slug: 'developer-tools', isActive: true, count: 16, color: '#10B981' },
  { categoryId: 3, categoryName: 'Image Generation', slug: 'design-ui', isActive: true, count: 12, color: '#06B6D4' },
  { categoryId: 4, categoryName: 'Chatbots & LLMs', slug: 'llms-ai', isActive: true, count: 15, color: '#EAB308' },
  { categoryId: 5, categoryName: 'Video Generation', slug: 'video-motion', isActive: true, count: 12, color: '#EC4899' },
  { categoryId: 6, categoryName: 'Productivity & SaaS', slug: 'productivity', isActive: true, count: 11, color: '#8B5CF6' },
  { categoryId: 7, categoryName: 'Audio & Music', slug: 'audio-music', isActive: true, count: 8, color: '#F97316' },
];

const MOCK_PRODUCTS = [
  {
    productId: 101,
    id: 'neurogen-studio',
    name: 'NeuroGen Studio',
    slug: 'neurogen-studio',
    shortDescription: 'Enterprise Generative Art and Diffusion Canvas suite with multi-agent control.',
    description: 'State-of-the-art multimodal AI generative platform with low-latency API pipelines, custom LoRA weight blending, and node-based prompt graphs.',
    websiteUrl: 'https://neurogen.ai',
    logoUrl: null,
    categoryId: 'generative-art',
    rating: 4.8,
    reviewsCount: 128,
    pricing: 'Freemium',
    tags: ['generative-art', 'freemium', 'web', 'api'],
    isVerified: true,
    verificationType: 'admin',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  },
  {
    productId: 102,
    id: 'codewizard-ai',
    name: 'CodeWizard AI',
    slug: 'codewizard-ai',
    shortDescription: 'Intelligent pair programming and code synthesis engine with zero latency.',
    description: 'Ultra-fast LLM tailored for full-stack refactoring, unit test generation, AST manipulation, and automated bug regression isolation.',
    websiteUrl: 'https://codewizard.dev',
    logoUrl: null,
    categoryId: 'developer-tools',
    rating: 4.9,
    reviewsCount: 312,
    pricing: 'Free Trial',
    tags: ['developer-tools', 'free-trial', 'cli', 'extension', 'wsl'],
    isVerified: true,
    verificationType: 'community',
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z',
  },
  {
    productId: 103,
    id: 'vision-forge',
    name: 'VisionForge',
    slug: 'vision-forge',
    shortDescription: 'Real-time text-to-image and 3D Gaussian splatting studio.',
    description: 'Hardware-accelerated neural rendering pipeline supporting cinematic 4K exports and instant spatial mesh generation.',
    websiteUrl: 'https://visionforge.app',
    logoUrl: null,
    categoryId: 'design-ui',
    rating: 4.7,
    reviewsCount: 84,
    pricing: 'Paid',
    tags: ['design-ui', 'paid', 'macos', 'windows', 'web'],
    isVerified: false,
    verificationType: null,
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z',
  },
  {
    productId: 104,
    id: 'synapse-copilot',
    name: 'Synapse Copilot',
    slug: 'synapse-copilot',
    shortDescription: 'Autonomous workspace workflow orchestration and multi-LLM summarizer.',
    description: 'Connects internal corporate knowledge bases with hybrid local models to automate documentation, meeting summaries, and ticket triaging.',
    websiteUrl: 'https://synapsecopilot.io',
    logoUrl: null,
    categoryId: 'productivity',
    rating: 4.6,
    reviewsCount: 95,
    pricing: 'Free',
    tags: ['productivity', 'free', 'web', 'api', 'docker'],
    isVerified: true,
    verificationType: 'admin',
    createdAt: '2026-04-12T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z',
  },
];

export function createMockApiHandler(options = {}) {
  // Configured admin credentials from environment or options
  const adminEmail = (
    options.adminEmail ||
    process.env.MOCK_ADMIN_EMAIL ||
    process.env.BOOTSTRAP_ADMIN_EMAIL ||
    'tahsincrs@gmail.com'
  ).toLowerCase().trim();

  const adminPassword = (
    options.adminPassword ||
    process.env.MOCK_ADMIN_PASSWORD ||
    process.env.BOOTSTRAP_ADMIN_PASSWORD ||
    '9PS1CgoOmsBIj5O9V7SQfDZMIibHvI4Q'
  ).trim();

  const adminUsername = (
    options.adminUsername ||
    process.env.MOCK_ADMIN_USERNAME ||
    process.env.BOOTSTRAP_ADMIN_USERNAME ||
    'tahsincr'
  ).trim();

  // In-memory mock sessions map
  const activeSessions = new Map();

  return async function handleMockRequest(req, res) {
    const rawUrl = req.url || '/';
    let url;
    try {
      url = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    } catch {
      return false;
    }

    const { pathname, searchParams } = url;
    const method = (req.method || 'GET').toUpperCase();

    // Check if this route is relevant for mock API
    const isHealthRoute = pathname === '/health' || pathname === '/health/live' || pathname === '/health/ready' ||
                          pathname === '/api/health' || pathname === '/api/health/live' || pathname === '/api/health/ready';
    const isApiRoute = pathname.startsWith('/api/');

    if (!isHealthRoute && !isApiRoute) {
      return false;
    }

    // CORS preflight
    const corsHeaders = {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control',
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return true;
    }

    // 1. Health Checks (/health/live, /health/ready, /health, /api/health/live, etc.)
    if (isHealthRoute) {
      sendJson(res, 200, {
        status: 'Healthy',
        version: '1.0.0-mock',
        timestamp: new Date().toISOString(),
      }, corsHeaders);
      return true;
    }

    // 2. Auth: Login (POST /api/auth/login)
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const emailInput = (body.email || body.username || '').toLowerCase().trim();
      const passwordInput = (body.password || '').trim();

      const isAdminMatch = (emailInput === adminEmail || emailInput === adminUsername.toLowerCase()) &&
                           passwordInput === adminPassword;

      if (!isAdminMatch) {
        // Return 400 Bad Request matching .NET FluentValidation format
        sendJson(res, 400, {
          success: false,
          message: 'Geçersiz e-posta veya şifre.',
          errors: [
            { propertyName: 'Password', errorMessage: 'Geçersiz e-posta veya şifre.' },
          ],
        }, corsHeaders);
        return true;
      }

      const sessionId = `guidora_mock_sess_${Date.now()}`;
      activeSessions.set(sessionId, {
        userId: 'usr_admin_01',
        email: adminEmail,
        username: adminUsername,
        role: 'admin',
        created: Date.now(),
      });

      sendJson(
        res,
        200,
        {
          success: true,
          message: 'Giriş başarılı.',
          data: {
            accessToken: {
              token: `mock_jwt_access_token_admin_${Date.now()}`,
              expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              sessionId,
              role: 'admin',
            },
            user: {
              id: 'usr_admin_01',
              name: 'Tahsin Cr',
              username: adminUsername,
              email: adminEmail,
              role: 'admin',
              avatar: 'TC',
              title: 'Lead AI Engineer & Product Architect',
            },
            isPersistentSession: Boolean(body.rememberMe || body.isPersistentSession),
            refreshTokenExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          ...corsHeaders,
          'Set-Cookie': `guidora_refresh=mock_refresh_${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
        }
      );
      return true;
    }

    // 3. Auth: Silent Refresh (POST /api/auth/refresh)
    if (pathname === '/api/auth/refresh' && method === 'POST') {
      const cookies = parseCookies(req.headers.cookie);
      const refreshCookie = cookies.guidora_refresh;

      // In mock development: if cookie exists OR if we have at least one active session
      if (refreshCookie || activeSessions.size > 0) {
        const newSessionId = `guidora_mock_sess_${Date.now()}`;
        activeSessions.set(newSessionId, {
          userId: 'usr_admin_01',
          email: adminEmail,
          username: adminUsername,
          role: 'admin',
          created: Date.now(),
        });

        sendJson(
          res,
          200,
          {
            success: true,
            message: 'Oturum yenilendi.',
            data: {
              accessToken: {
                token: `mock_jwt_refreshed_token_${Date.now()}`,
                expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                sessionId: newSessionId,
                role: 'admin',
              },
              user: {
                id: 'usr_admin_01',
                name: 'Tahsin Cr',
                username: adminUsername,
                email: adminEmail,
                role: 'admin',
                avatar: 'TC',
              },
              isPersistentSession: true,
              refreshTokenExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          {
            ...corsHeaders,
            'Set-Cookie': `guidora_refresh=mock_refresh_${newSessionId}; Path=/; HttpOnly; SameSite=Lax`,
          }
        );
        return true;
      }

      // No session cookie present (first startup without active session) -> clean 401
      sendJson(res, 401, {
        success: false,
        message: 'Oturum çerezi bulunamadı.',
      }, corsHeaders);
      return true;
    }

    // 4. Auth: Logout (POST /api/auth/logout)
    if (pathname === '/api/auth/logout' && method === 'POST') {
      activeSessions.clear();
      res.writeHead(204, {
        ...corsHeaders,
        'Set-Cookie': 'guidora_refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
      });
      res.end();
      return true;
    }

    // 5. Auth: Register (POST /api/auth/register)
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.email || !body.password) {
        sendJson(res, 400, {
          success: false,
          message: 'E-posta ve şifre zorunludur.',
          errors: [
            { propertyName: 'Email', errorMessage: 'E-posta adresi zorunludur.' },
            { propertyName: 'Password', errorMessage: 'Şifre zorunludur.' },
          ],
        }, corsHeaders);
        return true;
      }

      sendJson(res, 200, {
        success: true,
        message: 'Kayıt başarılı. Hoş geldiniz!',
        data: {
          accessToken: {
            token: `mock_jwt_registered_token_${Date.now()}`,
            expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            sessionId: `sess_reg_${Date.now()}`,
          },
        },
      }, corsHeaders);
      return true;
    }

    // 6. Categories (GET /api/categories & GET /api/categories/management)
    if ((pathname === '/api/categories' || pathname === '/api/categories/management') && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        message: 'Kategoriler listelendi.',
        data: MOCK_CATEGORIES,
      }, corsHeaders);
      return true;
    }

    // 7. Products List (GET /api/products)
    if (pathname === '/api/products' && method === 'GET') {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
      const search = (searchParams.get('search') || '').toLowerCase().trim();
      const categoryId = searchParams.get('categoryId');

      let filtered = [...MOCK_PRODUCTS];

      if (categoryId && categoryId !== 'all') {
        filtered = filtered.filter((p) => p.categoryId === categoryId);
      }

      if (search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search) ||
          p.shortDescription.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search))
        );
      }

      const totalCount = filtered.length;
      const startIndex = (page - 1) * pageSize;
      const items = filtered.slice(startIndex, startIndex + pageSize);

      sendJson(res, 200, {
        success: true,
        message: 'Ürünler listelendi.',
        data: {
          items,
          page,
          pageSize,
          totalCount,
        },
      }, corsHeaders);
      return true;
    }

    // 8. Single Product (GET /api/products/:id or GET /api/products/:slug)
    const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch && method === 'GET') {
      const idOrSlug = productMatch[1];
      const product = MOCK_PRODUCTS.find((p) => p.slug === idOrSlug || String(p.productId) === idOrSlug || p.id === idOrSlug);

      if (!product) {
        sendJson(res, 404, {
          success: false,
          message: 'Ürün bulunamadı.',
        }, corsHeaders);
        return true;
      }

      sendJson(res, 200, {
        success: true,
        message: 'Ürün detayları getirildi.',
        data: product,
      }, corsHeaders);
      return true;
    }

    // 9. Submit Product (POST /api/products)
    if (pathname === '/api/products' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newProduct = {
        productId: Date.now(),
        id: body.slug || `tool-${Date.now()}`,
        name: body.name || 'Yeni Araç',
        slug: body.slug || `tool-${Date.now()}`,
        shortDescription: body.shortDescription || body.tagline || '',
        description: body.description || body.overview || '',
        websiteUrl: body.websiteUrl || body.website || 'https://example.com',
        categoryId: body.categoryId || 'generative-art',
        tags: body.tags || [],
        rating: 5.0,
        reviewsCount: 1,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_PRODUCTS.unshift(newProduct);

      sendJson(res, 201, {
        success: true,
        message: 'Ürün başarıyla oluşturuldu ve onay kuyruğuna alındı.',
        data: newProduct,
      }, corsHeaders);
      return true;
    }

    // 10. Product Reports (POST /api/products/:id/reports)
    const reportMatch = pathname.match(/^\/api\/products\/([^/]+)\/reports$/);
    if (reportMatch && method === 'POST') {
      sendJson(res, 200, {
        success: true,
        message: 'Şikayetiniz moderasyon ekibine başarıyla iletildi.',
      }, corsHeaders);
      return true;
    }

    // 11. Product Community Votes (POST /api/products/:id/votes)
    const voteMatch = pathname.match(/^\/api\/products\/([^/]+)\/votes$/);
    if (voteMatch && method === 'POST') {
      sendJson(res, 200, {
        success: true,
        message: 'Topluluk doğrulama oyunuz kaydedildi.',
        data: {
          eligibleVotes: 19,
          targetVotes: 30,
        },
      }, corsHeaders);
      return true;
    }

    // 12. Product Verification Status (GET /api/products/:id/verification)
    const verifMatch = pathname.match(/^\/api\/products\/([^/]+)\/verification$/);
    if (verifMatch && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        data: {
          isVerified: true,
          verificationType: 'community',
          eligibleVotes: 18,
          targetVotes: 30,
        },
      }, corsHeaders);
      return true;
    }

    // Default API 404 for unhandled /api routes
    sendJson(res, 404, {
      success: false,
      message: `Mock endpoint '${pathname}' tanımlanmamış.`,
      statusCode: 404,
    }, corsHeaders);
    return true;
  };
}
