import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  adminGetEntitySchemas,
  adminGetApiEndpoints,
  adminGetSystemHealth,
  adminGetDatabaseStats,
  adminGetTableSchema,
  adminGetMigrations,
  adminExecuteQuery,
  adminGetProposals,
  adminResolveProposal,
  adminGetLogs,
  adminAddLog,
  adminRevertAuditLog,
  adminGetTimeSeriesData,
  adminExportAllData,
  adminImportAllData,
  adminResetToDefaults,
} from '@/services/adminService';

describe('Admin Service — Domain Entities, REST API Contracts & Platform Governance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Domain Entity Schemas & Architecture (Backend-Agnostic)', () => {
    it('returns all 8 core domain models with field definitions and relationships', () => {
      const schemas = adminGetEntitySchemas();
      expect(typeof schemas).toBe('object');
      const entities = Object.values(schemas);
      expect(entities.length).toBe(8);

      const entityIds = entities.map((e) => e.id);
      expect(entityIds).toContain('products');
      expect(entityIds).toContain('categories');
      expect(entityIds).toContain('tags');
      expect(entityIds).toContain('users');
      expect(entityIds).toContain('product_edit_proposals');
      expect(entityIds).toContain('reviews');
      expect(entityIds).toContain('reports');
      expect(entityIds).toContain('audit_logs');

      // Verify product entity schema
      const productEntity = schemas.products;
      expect(productEntity).toBeDefined();
      expect(productEntity.fields.length).toBeGreaterThanOrEqual(10);
      expect(productEntity.relationships.length).toBeGreaterThanOrEqual(3);
      expect(productEntity.samplePayload).toBeDefined();

      const pkField = productEntity.fields.find((f) => f.isPrimaryKey);
      expect(pkField).toBeDefined();
      expect(pkField.name).toBe('id');
      expect(pkField.type).toBe('uuid');
    });

    it('returns schema for a specific entity using adminGetTableSchema', () => {
      const schema = adminGetTableSchema('products');
      expect(Array.isArray(schema)).toBe(true);
      expect(schema.length).toBeGreaterThan(5);

      const idCol = schema.find((c) => c.column === 'id');
      expect(idCol).toBeDefined();
      expect(idCol.key).toBe('PK');
      expect(idCol.nullable).toBe(false);

      const nameCol = schema.find((c) => c.column === 'name');
      expect(nameCol).toBeDefined();
      expect(nameCol.type).toBe('varchar(200)');
    });

    it('returns comprehensive database & entity stats with live entity counts', () => {
      const mockTools = [
        { id: 't-1', name: 'Tool 1', category: 'generative-art' },
        { id: 't-2', name: 'Tool 2', category: 'developer-tools' },
      ];
      const mockCategories = [{ id: 'all' }, { id: 'dev' }];
      const mockUsers = [{ id: 'u-1' }];

      const stats = adminGetDatabaseStats(mockTools, mockCategories, mockUsers);
      expect(stats.databaseName).toBe('guidora_production_schema');
      expect(stats.serverVersion).toContain('Backend-Agnostic Entity Layer v2.0');
      expect(stats.cacheHitRatio).toBe('99.4%');
      expect(stats.tables.length).toBe(8);

      const productsTable = stats.tables.find((t) => t.name === 'products');
      expect(productsTable).toBeDefined();
      expect(productsTable.rowCount).toBe(2);
      expect(productsTable.engine).toContain('REST Entity Model');
    });

    it('returns schema evolution timeline milestones', () => {
      const migrations = adminGetMigrations();
      expect(migrations.length).toBeGreaterThanOrEqual(4);
      expect(migrations[0].status).toBe('APPLIED');
      expect(migrations[0].description).toBeDefined();
    });
  });

  describe('REST API Contracts & System Health', () => {
    it('returns 12 standard REST API endpoint contracts across modules', () => {
      const endpoints = adminGetApiEndpoints();
      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints.length).toBe(12);

      const methods = new Set(endpoints.map((e) => e.method));
      expect(methods.has('GET')).toBe(true);
      expect(methods.has('POST')).toBe(true);
      expect(methods.has('PUT')).toBe(true);
      expect(methods.has('DELETE')).toBe(true);

      const getProducts = endpoints.find((e) => e.path === '/api/products' && e.method === 'GET');
      expect(getProducts).toBeDefined();
      expect(getProducts.authLevel).toBe('Public');
      expect(getProducts.queryParams.length).toBeGreaterThanOrEqual(4);
      expect(getProducts.sampleResponse).toBeDefined();

      const createProduct = endpoints.find((e) => e.path === '/api/products' && e.method === 'POST');
      expect(createProduct).toBeDefined();
      expect(createProduct.authLevel).toBe('Member / Admin');
      expect(createProduct.requestBodySchema).toBeDefined();
    });

    it('returns system health with circuit breaker and API latency metrics', () => {
      const health = adminGetSystemHealth();
      expect(health.apiStatus).toBe('HEALTHY');
      expect(health.latencyMs).toBeGreaterThan(0);
      expect(health.circuitBreaker).toBe('CLOSED');
      expect(health.cacheHitRatio).toBe('99.4%');
    });

    it('safely executes SELECT queries against products in Query Explorer', () => {
      const mockTools = [
        { id: 'neurogen', name: 'NeuroGen', category: 'art', pricing: 'Free', rating: 4.8 },
      ];
      const result = adminExecuteQuery('SELECT id, name, category FROM products;', { allTools: mockTools });
      expect(result.rowCount).toBe(1);
      expect(result.columns).toContain('name');
      expect(result.rows[0].name).toBe('NeuroGen');
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('blocks destructive queries (DROP, DELETE, TRUNCATE) in read-only Query Explorer', () => {
      expect(() => {
        adminExecuteQuery('DROP TABLE products;');
      }).toThrow(/Safe Read-Only/i);

      expect(() => {
        adminExecuteQuery('TRUNCATE audit_logs;');
      }).toThrow(/Safe Read-Only/i);
    });
  });

  describe('Product Edit Proposals & Governance', () => {
    it('seeds and retrieves pending proposals queue', () => {
      const proposals = adminGetProposals();
      expect(proposals.length).toBeGreaterThanOrEqual(2);
      expect(proposals[0].status).toBe('pending');
      expect(proposals[0].changes).toBeDefined();
    });

    it('resolves proposal as accepted, updates status, and logs event', () => {
      const proposals = adminGetProposals();
      const targetId = proposals[0].id;

      const { updated } = adminResolveProposal(targetId, 'accepted', 'Looks verified and accurate.');
      const resolved = updated.find((p) => p.id === targetId);
      expect(resolved.status).toBe('accepted');
      expect(resolved.reviewNotes).toBe('Looks verified and accurate.');

      const logs = adminGetLogs();
      const propLog = logs.find((l) => l.action === 'PROPOSAL_ACCEPTED_AND_APPLIED');
      expect(propLog).toBeDefined();
    });
  });

  describe('Audit Logs & Concurrency Revert', () => {
    it('retrieves detailed audit logs with level, category, and trace IDs', () => {
      const logs = adminGetLogs();
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs[0].traceId).toBeDefined();
      expect(logs[0].level).toBeDefined();
      expect(logs[0].category).toBeDefined();
    });

    it('records a new audit log successfully', () => {
      const logs = adminAddLog(
        'TOOL_VERIFIED_MANUALLY',
        'tool_neurogen',
        'info',
        { actor: 'Admin User', category: 'GOVERNANCE' }
      );

      expect(Array.isArray(logs)).toBe(true);
      const newLog = logs[0];
      expect(newLog.action).toBe('TOOL_VERIFIED_MANUALLY');
      expect(newLog.id).toBeDefined();
      expect(newLog.traceId).toContain('trace-');
    });

    it('reverts audit log entry if oldValues exist and records a revert log', () => {
      const logs = adminGetLogs();
      const logWithOldValues = logs.find((l) => l.oldValues !== null);
      expect(logWithOldValues).toBeDefined();

      const { success, revertLog } = adminRevertAuditLog(logWithOldValues.id);
      expect(success).toBe(true);
      expect(revertLog.action).toBe('AUDIT_RECORD_REVERTED');
      expect(revertLog.oldValues).toEqual(logWithOldValues.newValues);
    });
  });

  describe('Time Series Analytics & Backups', () => {
    it('generates 14-day time series metrics for interactive SVG charts', () => {
      const timeSeries = adminGetTimeSeriesData(14);
      expect(timeSeries.length).toBe(14);
      expect(timeSeries[0].requestsK).toBeGreaterThan(0);
      expect(timeSeries[0].p95LatencyMs).toBeGreaterThan(0);
      expect(timeSeries[0].date).toBeDefined();
    });

    it('exports and imports full platform JSON backup correctly', () => {
      const json = adminExportAllData();
      expect(json).toContain('guidora_production');
      expect(json).toContain('version');

      const imported = adminImportAllData(json);
      expect(imported).toBe(true);
    });

    it('resets platform state to defaults cleanly', () => {
      const reset = adminResetToDefaults();
      expect(reset).toBe(true);
    });
  });
});
