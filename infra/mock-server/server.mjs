/**
 * Mock API Server for Docker & Standalone Execution
 * Emulates the essential .NET 10 WebAPI contracts using mockHandler.js
 */

import http from 'http';
import { createMockApiHandler } from './mockHandler.js';

const PORT = process.env.PORT || process.env.MOCK_API_PORT || 8080;

const mockHandler = createMockApiHandler({
  adminUsername: process.env.MOCK_ADMIN_USERNAME || process.env.BOOTSTRAP_ADMIN_USERNAME,
  adminEmail: process.env.MOCK_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL,
  adminPassword: process.env.MOCK_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD,
});

const server = http.createServer(async (req, res) => {
  const handled = await mockHandler(req, res);
  if (!handled) {
    const payload = JSON.stringify({
      success: false,
      message: `Mock endpoint '${req.url}' bulunamadı.`,
      statusCode: 404,
    });
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
  }
});

server.listen(PORT, () => {
  console.log(`[Guidora Mock API Server] Running on http://localhost:${PORT}`);
});
