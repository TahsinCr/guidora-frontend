import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  adminGetDatabaseStats,
  adminTriggerVacuum,
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

describe('Admin Service & Database Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('PostgreSQL 18 Database Management', () => {
    it('returns comprehensive database stats with live table metrics', () => {
      const stats = adminGetDatabaseStats([
        { id: 't-1', name: 'Tool 1', category: 'generative-art' },
        { id: 't-2', name: 'Tool 2', category: 'developer-tools' },
      ], [{ id: 'all' }, { id: 'dev' }], [{ id: 'u-1' }]);

      expect(stats.databaseName).toBe('guidora_production_pg18');
      expect(stats.serverVersion).toContain('PostgreSQL 18');
      expect(stats.cacheHitRatio).toBe('99.4%');
      expect(stats.tables.length).toBeGreaterThanOrEqual(8);

      const productsTable = stats.tables.find((t) => t.name === 'products');
      expect(productsTable).toBeDefined();
      expect(productsTable.rowCount).toBe(2);
      expect(productsTable.engine).toContain('PostgreSQL 18');
    });

    it('triggers VACUUM ANALYZE on a table, resets dead tuples, and records audit log', () => {
      const result = adminTriggerVacuum('products');
      expect(result.deadTuples).toBe(0);
      expect(result.lastVacuum).toBe('Just now');

      const logs = adminGetLogs();
      const vacuumLog = logs.find((l) => l.action === 'DATABASE_VACUUM_EXECUTED');
      expect(vacuumLog).toBeDefined();
      expect(vacuumLog.category).toBe('DATABASE');
    });

    it('returns PostgreSQL column schema for products table including GIN index and xmin token', () => {
      const schema = adminGetTableSchema('products');
      expect(Array.isArray(schema)).toBe(true);

      const idCol = schema.find((c) => c.column === 'id');
      expect(idCol.type).toBe('uuid');
      expect(idCol.key).toBe('PK');

      const xminCol = schema.find((c) => c.column === 'xmin');
      expect(xminCol).toBeDefined();
      expect(xminCol.type).toBe('xid');

      const searchVectorCol = schema.find((c) => c.column === 'search_vector');
      expect(searchVectorCol).toBeDefined();
      expect(searchVectorCol.type).toBe('tsvector');
    });

    it('returns applied EF Core 10 migrations history', () => {
      const migrations = adminGetMigrations();
      expect(migrations.length).toBeGreaterThanOrEqual(5);
      expect(migrations[0].productVersion).toContain('Microsoft.EntityFrameworkCore.PostgreSQL');
      expect(migrations[0].status).toBe('APPLIED');
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
