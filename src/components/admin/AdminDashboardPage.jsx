import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  LayoutDashboard,
  Wrench,
  FolderTree,
  Building2,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Bot,
  Eye,
  Edit2,
  X,
} from 'lucide-react';
import {
  adminGetCategories,
  adminAddCategory,
  adminDeleteCategory,
  adminUpdateTool,
  adminDeleteTool,
  adminGetReports,
  adminResolveReport,
  adminDismissReport,
  adminGetStats,
} from '@/services/adminService';
import { getAllTools } from '@/services/toolsService';
import {
  getOrganizations,
  adminCreateOrganization,
  adminDeleteOrganization,
  adminToggleOrgVerification,
  getAllUsers,
  adminUpdateUserRole,
} from '@/services/userService';
import styles from './AdminDashboardPage.module.scss';

export default function AdminDashboardPage({ onBack, onOpenTool }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tools' | 'categories' | 'organizations' | 'users' | 'reports'

  // Data states
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  // Filter / Search states
  const [toolSearch, setToolSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8A38F5');
  const [newCatPopular, setNewCatPopular] = useState(false);

  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');

  // Refresh all dashboard datasets
  const refreshData = () => {
    const allT = getAllTools();
    const allC = adminGetCategories();
    const allO = getOrganizations();
    const allU = getAllUsers();
    const allR = adminGetReports();

    setTools(allT);
    setCategories(allC);
    setOrganizations(allO);
    setUsers(allU);
    setReports(allR);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    return adminGetStats(tools, users);
  }, [tools, users, categories, organizations, reports]);

  // --- Category Handlers ---
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      adminAddCategory({
        name: newCatName.trim(),
        color: newCatColor,
        isPopular: newCatPopular,
      });
      setNewCatName('');
      setIsAddCatModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        adminDeleteCategory(id);
        refreshData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // --- Organization Handlers ---
  const handleAddOrganization = (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    adminCreateOrganization({
      name: newOrgName.trim(),
      website: newOrgWebsite.trim() || 'https://example.com',
      description: newOrgDesc.trim() || 'Verified ecosystem organization.',
    });
    setNewOrgName('');
    setNewOrgWebsite('');
    setNewOrgDesc('');
    setIsAddOrgModalOpen(false);
    refreshData();
  };

  const handleDeleteOrg = (id) => {
    if (window.confirm('Delete this organization from the directory?')) {
      adminDeleteOrganization(id);
      refreshData();
    }
  };

  const handleToggleOrgVer = (id) => {
    adminToggleOrgVerification(id);
    refreshData();
  };

  // --- Tool Handlers ---
  const handleToggleToolBadge = (tool, badgeType) => {
    const nextVer = {
      ...(tool.verified || {}),
      [badgeType]: !tool.verified?.[badgeType],
    };
    adminUpdateTool(tool.id, { verified: nextVer });
    refreshData();
  };

  const handleDeleteTool = (toolId) => {
    if (window.confirm('Remove this tool from the live directory?')) {
      adminDeleteTool(toolId);
      refreshData();
    }
  };

  // --- User Handlers ---
  const handleRoleChange = (userId, nextRole) => {
    adminUpdateUserRole(userId, nextRole);
    refreshData();
  };

  // --- Report Handlers ---
  const handleResolveReport = (reportId) => {
    adminResolveReport(reportId, 'Resolved by Admin');
    refreshData();
  };

  const handleDismissReport = (reportId) => {
    adminDismissReport(reportId);
    refreshData();
  };

  // Filtered Lists
  const filteredTools = useMemo(() => {
    return tools.filter((t) =>
      t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(toolSearch.toLowerCase())
    );
  }, [tools, toolSearch]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categories, catSearch]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((o) =>
      o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      o.slug.toLowerCase().includes(orgSearch.toLowerCase())
    );
  }, [organizations, orgSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  return (
    <div className={styles.adminContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>

        <div className={styles.adminBadgeHeader}>
          <ShieldCheck size={16} />
          <span>Admin Portal Active</span>
        </div>
      </div>

      {/* Hero Title */}
      <div className={styles.heroSection}>
        <h1 className={styles.pageTitle}>Platform Administration</h1>
        <p className={styles.pageSubtitle}>
          Manage directory content, approve and verify AI tools, configure categories & organizations, and monitor community reports.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Tools</span>
            <div className={styles.statIconWrap}>
              <Wrench size={18} color="var(--primary-color)" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalTools}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Verified Tools</span>
            <div className={styles.statIconWrap}>
              <CheckCircle2 size={18} color="#10B981" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.verifiedTools}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Categories</span>
            <div className={styles.statIconWrap}>
              <FolderTree size={18} color="#3B82F6" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalCategories}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Organizations</span>
            <div className={styles.statIconWrap}>
              <Building2 size={18} color="#EAB308" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalOrganizations}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Pending Reports</span>
            <div className={styles.statIconWrap}>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.pendingReports}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'tools' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <Wrench size={16} />
          <span>Tools ({tools.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderTree size={16} />
          <span>Categories ({categories.length - 1})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'organizations' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} />
          <span>Organizations ({organizations.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Users ({users.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <AlertTriangle size={16} />
          <span>Reports</span>
          {stats.pendingReports > 0 && (
            <span className={`${styles.tabBadge} ${styles.highlight}`}>
              {stats.pendingReports}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Welcome to Guidora Command Center</h2>
              <p className={styles.sectionSubtitle}>
                Select an administration section above to inspect tools, adjust categories or manage verified organizations.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tools')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Manage Directory Tools</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Toggle verification badges, audit community submissions, or remove outdated entries.</p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>Open Tools &rarr;</button>
            </div>

            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('categories')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Configure Categories</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create custom categories, set accent colors and toggle popular slider tags.</p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>Open Categories &rarr;</button>
            </div>

            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('organizations')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Verified Organizations</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create organizations, manage enterprise affiliations and verification status.</p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>Open Organizations &rarr;</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOOLS MANAGEMENT */}
      {activeTab === 'tools' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Live Directory Tools</h2>
              <p className={styles.sectionSubtitle}>Toggle trust badges, inspect details, or remove tools from the live catalog.</p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search tool or category..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Category</th>
                  <th>Pricing</th>
                  <th>Admin Verified</th>
                  <th>Community</th>
                  <th>Bot Audited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className={styles.toolCell}>
                        <div className={styles.toolInitialBadge}>
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.toolNameText}>{t.name}</div>
                          <div className={styles.toolSubText}>{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.category}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.purple}`}>
                        {t.pricing}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${t.verified?.admin ? styles.activeBadge : ''}`}
                        onClick={() => handleToggleToolBadge(t, 'admin')}
                        title="Toggle Admin Verification"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${t.verified?.community ? styles.activeBadge : ''}`}
                        onClick={() => handleToggleToolBadge(t, 'community')}
                        title="Toggle Community Choice"
                      >
                        <Sparkles size={16} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${t.verified?.audited ? styles.activeBadge : ''}`}
                        onClick={() => handleToggleToolBadge(t, 'audited')}
                        title="Toggle Bot Audit"
                      >
                        <Bot size={16} />
                      </button>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => onOpenTool?.(t.id)}
                          title="Preview Detail Page"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.delete}`}
                          onClick={() => handleDeleteTool(t.id)}
                          title="Remove Tool"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Directory Categories</h2>
              <p className={styles.sectionSubtitle}>
                Add, manage, and customize categories displayed in the hero carousel and filter drawers.
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setIsAddCatModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Identifier</th>
                  <th>Accent Color</th>
                  <th>Slider / Popular</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.filter((c) => c.id !== 'all').map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {c.name}
                    </td>
                    <td>
                      <code>{c.id}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            backgroundColor: c.color || '#8A38F5',
                          }}
                        />
                        <span>{c.color || '#8A38F5'}</span>
                      </div>
                    </td>
                    <td>
                      {c.isPopular ? (
                        <span className={`${styles.badge} ${styles.success}`}>Featured</span>
                      ) : (
                        <span className={`${styles.badge}`}>Standard</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.delete}`}
                        onClick={() => handleDeleteCategory(c.id)}
                        title="Delete Category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORGANIZATIONS */}
      {activeTab === 'organizations' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Verified Organizations</h2>
              <p className={styles.sectionSubtitle}>
                Organizations verified by Guidora Admins. Tools can be attributed to these verified owners.
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setIsAddOrgModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add Organization</span>
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Website</th>
                  <th>Verification</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className={styles.toolCell}>
                        <div
                          className={styles.toolInitialBadge}
                          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                        >
                          {o.initials || o.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.toolNameText}>{o.name}</div>
                          <div className={styles.toolSubText}>{o.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        href={o.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--brand-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {o.website.replace('https://', '')}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${o.verified ? styles.activeBadge : ''}`}
                        onClick={() => handleToggleOrgVer(o.id)}
                        title="Toggle Verification"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.purple}`}>
                        {o.verificationSource || 'admin'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.delete}`}
                        onClick={() => handleDeleteOrg(o.id)}
                        title="Delete Organization"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>User & Role Management</h2>
              <p className={styles.sectionSubtitle}>
                Manage permissions and user privileges across the Guidora network.
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.toolCell}>
                        <div className={styles.toolInitialBadge}>
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.toolNameText}>{u.name}</div>
                          <div className={styles.toolSubText}>{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.joinedDate || 'Recent'}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className={`${styles.badge} ${styles.purple}`}>
                          <ShieldCheck size={12} /> Admin
                        </span>
                      ) : u.role === 'creator' ? (
                        <span className={`${styles.badge} ${styles.warning}`}>Creator</span>
                      ) : (
                        <span className={`${styles.badge}`}>Member</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12.5px',
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="creator">Creator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS */}
      {activeTab === 'reports' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Community Reports & Flags</h2>
              <p className={styles.sectionSubtitle}>
                Review submissions and reported issues flagged by community members.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={36} color="#10B981" />
              <p>No community reports pending. All clean!</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Tool ID</th>
                    <th>Reason</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <code>{r.id}</code>
                      </td>
                      <td>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-blue)',
                            cursor: 'pointer',
                            fontWeight: '600',
                          }}
                          onClick={() => onOpenTool?.(r.toolId)}
                        >
                          {r.toolId} &rarr;
                        </button>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.warning}`}>{r.reason}</span>
                      </td>
                      <td style={{ maxWidth: '280px', wordBreak: 'break-word' }}>
                        {r.details || 'No additional details provided.'}
                      </td>
                      <td>
                        {r.status === 'resolved' ? (
                          <span className={`${styles.badge} ${styles.success}`}>Resolved</span>
                        ) : r.status === 'dismissed' ? (
                          <span className={`${styles.badge}`}>Dismissed</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.danger}`}>Pending</span>
                        )}
                      </td>
                      <td>
                        {(!r.status || r.status === 'pending') && (
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className={`${styles.iconActionBtn} ${styles.activeBadge}`}
                              onClick={() => handleResolveReport(r.id)}
                              title="Mark as Resolved"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              type="button"
                              className={styles.iconActionBtn}
                              onClick={() => handleDismissReport(r.id)}
                              title="Dismiss Report"
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Category */}
      {isAddCatModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddCatModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Category</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddCatModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory}>
              <div className={styles.formGroup}>
                <label>Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic Voice, Agent Ops..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Accent Color</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{ height: '42px', padding: '2px', cursor: 'pointer' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Featured</label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newCatPopular}
                      onChange={(e) => setNewCatPopular(e.target.checked)}
                    />
                    <span>Show on Top Slider</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddCatModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Organization */}
      {isAddOrgModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddOrgModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Verified Organization</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddOrgModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOrganization}>
              <div className={styles.formGroup}>
                <label>Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mistral AI, Cohere..."
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Website URL</label>
                <input
                  type="url"
                  placeholder="https://company.ai"
                  value={newOrgWebsite}
                  onChange={(e) => setNewOrgWebsite(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description / Focus</label>
                <textarea
                  placeholder="Short description of the company or team..."
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddOrgModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
