import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  EyeOff,
  Edit2,
  Edit3,
  X,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Sliders,
  CheckSquare,
  Flame,
  Tag,
  MessageSquare,
  Lock,
  Star,
  Globe,
  BadgeCheck,
  Ban,
  UserCheck,
  Filter,
} from 'lucide-react';
import {
  adminGetCategories,
  adminAddCategory,
  adminDeleteCategory,
  adminUpdateCategory,
  adminUpdateTool,
  adminDeleteTool,
  adminGetReports,
  adminResolveReport,
  adminDismissReport,
  adminGetStats,
  adminGetLogs,
  adminAddLog,
  adminExportAllData,
  adminImportAllData,
  adminResetToDefaults,
  adminGetTagCategories,
  adminAddTag,
  adminUpdateTag,
  adminDeleteTag,
  adminUpdateTagCategory,
  adminAddTagCategory,
  adminDeleteTagCategory,
  adminUpdateOrganization,
} from '@/services/adminService';
import { getAllTools, getAllReviews, deleteReview } from '@/services/toolsService';
import {
  getOrganizations,
  adminCreateOrganization,
  adminDeleteOrganization,
  adminToggleOrgVerification,
  getAllUsers,
  adminUpdateUserRole,
  adminCreateUser,
  adminDeleteUser,
  getCurrentUser,
  canUserPerformAction,
  adminUpdateUserDetails,
} from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import UnifiedTranslationModal from '@/components/common/UnifiedTranslationModal';
import styles from './AdminDashboardPage.module.scss';

export default function AdminDashboardPage({ onBack, onOpenTool }) {
  const { t, translateCategory, translateTag, translateTagCategory } = useLanguage();
  const currentUser = getCurrentUser();
  const isModerator = currentUser?.role === 'moderator';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tools' | 'categories' | 'tags' | 'organizations' | 'users' | 'reviews' | 'reports' | 'logs' | 'system'

  // Data states
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [tagCategories, setTagCategories] = useState([]);

  // Filter / Search states
  const [toolSearch, setToolSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewToolFilter, setReviewToolFilter] = useState('all');
  const [tagSearch, setTagSearch] = useState('');

  // Batch Tool Selection
  const [selectedToolIds, setSelectedToolIds] = useState([]);

  // Dynamic Unified Translation Modal
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [translationItemType, setTranslationItemType] = useState('category'); // 'category' | 'tag_category' | 'tag'
  const [translationTitle, setTranslationTitle] = useState('');
  const [translationBaseName, setTranslationBaseName] = useState('');
  const [translationValues, setTranslationValues] = useState({});
  const [onSaveTranslations, setOnSaveTranslations] = useState(null);

  // Category Modal (Add & Edit)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catTranslations, setCatTranslations] = useState({});
  const [catColor, setCatColor] = useState('#8A38F5');
  const [catPopular, setCatPopular] = useState(false);

  // Tag Category Modal (Edit Tag Group)
  const [tagCategoryModalOpen, setTagCategoryModalOpen] = useState(false);
  const [editingTagCategory, setEditingTagCategory] = useState(null);
  const [tagCatName, setTagCatName] = useState('');
  const [tagCatTranslations, setTagCatTranslations] = useState({});
  const [tagCatSingleSelect, setTagCatSingleSelect] = useState(false);

  // Tag Modal (Add & Edit - Tabbed: Tag vs Category)
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null); // { tag, groupId }
  const [addTagActiveTab, setAddTagActiveTab] = useState('tag'); // 'tag' | 'category'
  const [tagGroupId, setTagGroupId] = useState('pricing');
  const [tagName, setTagName] = useState('');
  const [tagTranslations, setTagTranslations] = useState({});
  const [tagSingleSelect, setTagSingleSelect] = useState(false);
  // Add Tag Category fields
  const [newTagCatId, setNewTagCatId] = useState('');
  const [newTagCatName, setNewTagCatName] = useState('');
  const [newTagCatTranslations, setNewTagCatTranslations] = useState({});
  const [newTagCatSingleSelect, setNewTagCatSingleSelect] = useState(false);

  // Tool Edit Studio Dialog (Modal Dialect via ToolStudioForm)
  const [editingTool, setEditingTool] = useState(null);

  // Add User Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('member');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserBio, setNewUserBio] = useState('');
  const [newUserReputation, setNewUserReputation] = useState(100);
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserHandle, setEditUserHandle] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserTitle, setEditUserTitle] = useState('');
  const [editUserRep, setEditUserRep] = useState(100);
  const [editUserBio, setEditUserBio] = useState('');
  const [editUserRole, setEditUserRole] = useState('member');
  const [editUserStatus, setEditUserStatus] = useState('active');
  const [editUserVerified, setEditUserVerified] = useState(false);

  // Modals & Forms (Organization)
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');

  const [editingOrg, setEditingOrg] = useState(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgWebsite, setEditOrgWebsite] = useState('');
  const [editOrgSlug, setEditOrgSlug] = useState('');
  const [editOrgInitials, setEditOrgInitials] = useState('');
  const [editOrgDesc, setEditOrgDesc] = useState('');
  const [editOrgVerified, setEditOrgVerified] = useState(true);

  const fileInputRef = useRef(null);

  // Refresh all dashboard datasets
  const refreshData = async () => {
    const allT = getAllTools();
    const allC = adminGetCategories();
    const allO = getOrganizations();
    const allU = getAllUsers();
    const allR = adminGetReports();
    const allL = adminGetLogs();
    const allTags = adminGetTagCategories();
    const revs = await getAllReviews();

    setTools(allT);
    setCategories(allC);
    setOrganizations(allO);
    setUsers(allU);
    setReports(allR);
    setLogs(allL);
    setTagCategories(allTags);
    setAllReviews(revs || []);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    return adminGetStats(tools, users);
  }, [tools, users, categories, organizations, reports]);

  // --- Dynamic Translation Manager Handlers ---
  const handleOpenTranslations = ({ title, itemType = 'category', baseName, initialTranslations, onSave }) => {
    setTranslationTitle(title || '');
    setTranslationItemType(itemType);
    setTranslationBaseName(baseName || '');
    setTranslationValues({ ...(initialTranslations || {}) });
    setOnSaveTranslations(() => onSave);
    setTranslationModalOpen(true);
  };

  // --- Category Handlers ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatTranslations({});
    setCatColor('#8A38F5');
    setCatPopular(false);
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatTranslations({ ...(cat.translations || {}) });
    setCatColor(cat.color || '#8A38F5');
    setCatPopular(Boolean(cat.isPopular));
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCategory) {
        adminUpdateCategory(editingCategory.id, {
          name: catName.trim(),
          translations: catTranslations,
          color: catColor,
          isPopular: catPopular,
        });
        adminAddLog('Category Updated', catName.trim(), 'info');
      } else {
        adminAddCategory({
          name: catName.trim(),
          translations: catTranslations,
          color: catColor,
          isPopular: catPopular,
        });
        adminAddLog('Category Added', catName.trim(), 'success');
      }
      setCategoryModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = (id) => {
    if (!canUserPerformAction(currentUser, 'delete_category')) {
      alert(t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)'));
      return;
    }
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

  const handleStartEditOrg = (org) => {
    setEditingOrg(org);
    setEditOrgName(org.name || '');
    setEditOrgWebsite(org.website || '');
    setEditOrgSlug(org.slug || '');
    setEditOrgInitials(org.initials || '');
    setEditOrgDesc(org.description || '');
    setEditOrgVerified(Boolean(org.verified));
  };

  const handleSaveEditOrg = (e) => {
    e.preventDefault();
    if (!editingOrg || !editOrgName.trim()) return;
    try {
      adminUpdateOrganization(editingOrg.id, {
        name: editOrgName.trim(),
        website: editOrgWebsite.trim(),
        slug: editOrgSlug.trim() || editOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        initials: editOrgInitials.trim().toUpperCase() || editOrgName.slice(0, 2).toUpperCase(),
        description: editOrgDesc.trim(),
        verified: Boolean(editOrgVerified),
      });
      adminAddLog('Organization Updated', editOrgName, 'info');
      setEditingOrg(null);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to update organization');
    }
  };

  // --- Tool Handlers ---
  const handleToggleToolBadge = (tool, badgeType) => {
    const nextVer = {
      ...(tool.verified || {}),
      [badgeType]: !tool.verified?.[badgeType],
    };
    adminUpdateTool(tool.id, { verified: nextVer });
    adminAddLog(`Tool Badge Updated (${badgeType})`, tool.name, 'info');
    refreshData();
  };

  const handleDeleteTool = (toolId) => {
    const found = tools.find((t) => t.id === toolId);
    if (window.confirm(`Remove "${found?.name || toolId}" from the live directory?`)) {
      adminDeleteTool(toolId);
      adminAddLog('Tool Deleted', found?.name || toolId, 'danger');
      refreshData();
    }
  };

  // Full Tool Edit Studio Dialog Handler (delegates to ToolStudioForm)
  const handleOpenEditTool = (tool) => {
    setEditingTool(tool);
  };

  const handleSaveToolStudio = async (payload) => {
    if (!editingTool) return;
    try {
      adminUpdateTool(editingTool.id, {
        ...payload,
        website: payload.websiteUrl,
        url: payload.websiteUrl,
        verified: {
          admin: payload.adminVerified,
          community: payload.communityChoice,
          audited: payload.botAudited,
        },
        views: payload.monthlyVisits,
      });
      adminAddLog('Tool Studio Updated', payload.name, 'success');
      setEditingTool(null);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to update tool');
    }
  };

  // Batch Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedToolIds.length === filteredTools.length) {
      setSelectedToolIds([]);
    } else {
      setSelectedToolIds(filteredTools.map((t) => t.id));
    }
  };

  const handleToggleSelectTool = (id) => {
    setSelectedToolIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchVerify = () => {
    if (!selectedToolIds.length) return;
    selectedToolIds.forEach((id) => {
      adminUpdateTool(id, {
        verified: { admin: true, community: true, audited: true },
      });
    });
    adminAddLog(`Batch Verified ${selectedToolIds.length} Tools`, 'Tools Catalog', 'success');
    setSelectedToolIds([]);
    refreshData();
  };

  const handleBatchDelete = () => {
    if (!selectedToolIds.length) return;
    const confirmMsg = t('admin.confirmBatchDelete', 'Delete all {count} selected tools?').replace('{count}', selectedToolIds.length);
    if (window.confirm(confirmMsg)) {
      selectedToolIds.forEach((id) => adminDeleteTool(id));
      adminAddLog(`Batch Deleted ${selectedToolIds.length} Tools`, 'Tools Catalog', 'danger');
      setSelectedToolIds([]);
      refreshData();
    }
  };

  // --- Backup & Restore Handlers ---
  const handleExportBackup = () => {
    const jsonStr = adminExportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guidora-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    adminAddLog('Backup Exported', 'System JSON Export', 'info');
  };

  const handleImportBackup = (e) => {
    if (!canUserPerformAction(currentUser, 'system_reset')) {
      alert(t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)'));
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        adminImportAllData(event.target.result);
        alert('Backup data successfully imported!');
        refreshData();
      } catch (err) {
        alert(err.message || 'Error restoring backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetPlatform = () => {
    if (!canUserPerformAction(currentUser, 'system_reset')) {
      alert(t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)'));
      return;
    }
    if (
      window.confirm(
        t('admin.confirmReset', 'DANGER: Are you sure you want to reset all admin configurations, custom tools, and categories back to factory defaults?')
      )
    ) {
      adminResetToDefaults();
      refreshData();
      alert('Platform storage reset to defaults.');
    }
  };

  // --- User Handlers ---
  const handleRoleChange = (userId, nextRole) => {
    if (!canUserPerformAction(currentUser, 'change_user_role')) {
      alert(t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)'));
      return;
    }
    adminUpdateUserRole(userId, nextRole);
    adminAddLog(`Role Changed (${nextRole})`, `User ${userId}`, 'warning');
    refreshData();
  };

  // --- Upgraded User Handlers ---
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserHandle(u.handle || (u.email ? u.email.split('@')[0] : 'user'));
    setEditUserEmail(u.email || '');
    setEditUserTitle(u.title || '');
    setEditUserRep(u.reputation || 100);
    setEditUserBio(u.bio || '');
    setEditUserRole(u.role || 'member');
    setEditUserStatus(u.status || 'active');
    setEditUserVerified(Boolean(u.isVerified || u.verified));
  };

  const handleSaveUserEdit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    adminUpdateUserDetails(editingUser.id, {
      name: editUserName.trim(),
      handle: editUserHandle.trim(),
      email: editUserEmail.trim(),
      title: editUserTitle.trim(),
      reputation: Number(editUserRep) || 0,
      bio: editUserBio.trim(),
      status: editUserStatus,
      isVerified: editUserVerified,
    });
    if (canUserPerformAction(currentUser, 'change_user_role') && editingUser.role !== editUserRole) {
      adminUpdateUserRole(editingUser.id, editUserRole);
    }
    adminAddLog('User Details & Status Updated', editUserName.trim() || editingUser.name, 'info');
    setEditingUser(null);
    refreshData();
  };

  // --- Add User Handlers ---
  const handleOpenAddUser = () => {
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserRole('member');
    setNewUserTitle('');
    setNewUserBio('');
    setNewUserReputation(100);
    setNewUserAvatar('');
    setIsAddUserModalOpen(true);
  };

  const handleSaveAddUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    if (!newUserPassword.trim()) {
      alert(t('auth.passwordRequired', 'Please set an initial password for the user.'));
      return;
    }
    try {
      adminCreateUser({
        name: newUserName.trim(),
        username: newUserUsername.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        title: newUserTitle.trim(),
        bio: newUserBio.trim(),
        reputation: Number(newUserReputation) || 100,
        avatar: newUserAvatar.trim(),
      });
      adminAddLog('User Created', `${newUserName} (${newUserRole})`, 'success');
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(t('admin.confirmDeleteUser', `Are you sure you want to delete user "${userName}"?`))) {
      try {
        adminDeleteUser(userId);
        adminAddLog('User Deleted', userName, 'warning');
        refreshData();
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  // --- Upgraded Tag Management Handlers (Tabbed: Tag & Tag Category) ---
  const handleOpenAddTag = (preferredGroupId, initialTab = 'tag') => {
    setEditingTag(null);
    setAddTagActiveTab(initialTab);
    setTagGroupId(preferredGroupId || tagCategories[0]?.id || 'pricing');
    setTagName('');
    setTagTranslations({});
    setTagSingleSelect(false);
    setNewTagCatId('');
    setNewTagCatName('');
    setNewTagCatTranslations({});
    setNewTagCatSingleSelect(false);
    setTagModalOpen(true);
  };

  const handleOpenEditTag = (group, tag) => {
    setEditingTag({ tag, groupId: group.id });
    setAddTagActiveTab('tag');
    setTagGroupId(group.id);
    setTagName(tag.name || '');
    setTagTranslations({ ...(tag.translations || {}) });
    setTagSingleSelect(Boolean(tag.only));
    setTagModalOpen(true);
  };

  const handleSaveTag = (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        if (!tagName.trim()) return;
        adminUpdateTag(editingTag.groupId, editingTag.tag.id, {
          name: tagName.trim(),
          translations: tagTranslations,
          only: tagSingleSelect,
        });
        adminAddLog('Tag Updated', `${tagName} in ${editingTag.groupId}`, 'info');
      } else if (addTagActiveTab === 'category') {
        if (!newTagCatName.trim()) return;
        adminAddTagCategory({
          id: newTagCatId.trim(),
          name: newTagCatName.trim(),
          translations: newTagCatTranslations,
          isSingleSelect: newTagCatSingleSelect,
        });
        adminAddLog('Tag Category Added', newTagCatName.trim(), 'success');
      } else {
        if (!tagName.trim()) return;
        adminAddTag(tagGroupId, {
          name: tagName.trim(),
          translations: tagTranslations,
          isSingleSelect: tagSingleSelect,
        });
        adminAddLog('Tag Added', `${tagName} to ${tagGroupId}`, 'success');
      }
      setTagModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to save tag or tag category');
    }
  };

  const handleDeleteTag = (categoryId, tagId) => {
    if (window.confirm(t('admin.confirmDeleteTag', 'Delete this tag from the taxonomy?'))) {
      adminDeleteTag(categoryId, tagId);
      adminAddLog('Tag Deleted', `${tagId} removed from ${categoryId}`, 'warning');
      refreshData();
    }
  };

  const handleDeleteTagCategory = (groupId, groupName) => {
    if (window.confirm(t('admin.confirmDeleteTagCategory', `Are you sure you want to delete the "${groupName}" tag group and all its tags?`))) {
      try {
        adminDeleteTagCategory(groupId);
        adminAddLog('Tag Category Deleted', groupName, 'warning');
        refreshData();
      } catch (err) {
        alert(err.message || 'Failed to delete tag category');
      }
    }
  };

  // --- Tag Category (Group) Handlers ---
  const handleOpenEditTagCategory = (group) => {
    setEditingTagCategory(group);
    setTagCatName(group.name || '');
    setTagCatTranslations({ ...(group.translations || {}) });
    setTagCatSingleSelect(Boolean(group.isSingleSelect));
    setTagCategoryModalOpen(true);
  };

  const handleSaveTagCategory = (e) => {
    e.preventDefault();
    if (!editingTagCategory || !tagCatName.trim()) return;
    try {
      adminUpdateTagCategory(editingTagCategory.id, {
        name: tagCatName.trim(),
        translations: tagCatTranslations,
        isSingleSelect: tagCatSingleSelect,
      });
      adminAddLog('Tag Group Updated', tagCatName.trim(), 'info');
      setTagCategoryModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to save tag category');
    }
  };

  // --- Review Moderation Handlers ---
  const handleDeleteReview = async (toolId, reviewId) => {
    if (window.confirm(t('user.confirmDeleteReview', 'Are you sure you want to delete this review?'))) {
      try {
        await deleteReview(toolId, reviewId);
        adminAddLog('Review Deleted', `Review #${reviewId} on tool ${toolId}`, 'warning');
        refreshData();
      } catch (err) {
        alert('Failed to delete review');
      }
    }
  };

  // --- Report Handlers ---
  const handleResolveReport = (reportId) => {
    adminResolveReport(reportId, 'Resolved by Admin');
    adminAddLog('Report Resolved', `Report #${reportId}`, 'success');
    refreshData();
  };

  const handleDismissReport = (reportId) => {
    adminDismissReport(reportId);
    adminAddLog('Report Dismissed', `Report #${reportId}`, 'info');
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

  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      const matchSearch =
        !reviewSearch.trim() ||
        (r.author || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
        (r.toolName || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
        (r.content || '').toLowerCase().includes(reviewSearch.toLowerCase());
      const matchRating =
        reviewRatingFilter === 'all' || Math.round(r.rating) === Number(reviewRatingFilter);
      const matchTool =
        reviewToolFilter === 'all' || r.toolId === reviewToolFilter;
      return matchSearch && matchRating && matchTool;
    });
  }, [allReviews, reviewSearch, reviewRatingFilter, reviewToolFilter]);

  const filteredTagCategories = useMemo(() => {
    if (!tagSearch.trim()) return tagCategories;
    const query = tagSearch.toLowerCase();
    return tagCategories.map((cat) => ({
      ...cat,
      tags: (cat.tags || []).filter(
        (t) => t.name.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)
      ),
    }));
  }, [tagCategories, tagSearch]);

  const totalActiveTagsCount = useMemo(() => {
    return tagCategories.reduce((acc, c) => acc + (c.tags || []).length, 0);
  }, [tagCategories]);

  return (
    <div className={styles.adminContainer}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{t('header.backToDirectory', 'Back to Directory')}</span>
        </button>

        <div className={styles.adminBadgeHeader}>
          <ShieldCheck size={16} />
          <span>
            {isModerator
              ? t('user.moderatorRole', 'Community Moderator')
              : t('user.platformAdmin', 'Platform Admin')}
          </span>
        </div>
      </div>

      {/* Moderator Notice Banner */}
      {isModerator && (
        <div className={styles.moderatorBanner}>
          <AlertTriangle size={20} className={styles.bannerIcon} />
          <div className={styles.bannerText}>
            <strong>{t('user.moderatorRole', 'Community Moderator')}: </strong>
            {t(
              'admin.moderatorBanner',
              'Moderator Session Active: You have content & review moderation permissions. Role changes, database resets, and root taxonomy deletions require Administrator privileges.'
            )}
          </div>
        </div>
      )}

      {/* Hero Title */}
      <div className={styles.heroSection}>
        <h1 className={styles.pageTitle}>{t('admin.dashboard', 'Guidora Command Center')}</h1>
        <p className={styles.pageSubtitle}>
          {t(
            'admin.dashboardSubtitle',
            'Comprehensive platform administration, review moderation, tag taxonomy, and user control.'
          )}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statTotalTools', 'Total Tools')}</span>
            <div className={styles.statIconWrap}>
              <Wrench size={18} color="var(--primary-color)" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalTools}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statVerifiedTools', 'Verified Tools')}</span>
            <div className={styles.statIconWrap}>
              <CheckCircle2 size={18} color="#10B981" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.verifiedTools}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statCategories', 'Categories')}</span>
            <div className={styles.statIconWrap}>
              <FolderTree size={18} color="#3B82F6" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalCategories}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statTags', 'Active Tags')}</span>
            <div className={styles.statIconWrap}>
              <Tag size={18} color="#8A38F5" />
            </div>
          </div>
          <span className={styles.statValue}>{totalActiveTagsCount}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statTotalReviews', 'Total Reviews')}</span>
            <div className={styles.statIconWrap}>
              <MessageSquare size={18} color="#EC4899" />
            </div>
          </div>
          <span className={styles.statValue}>{allReviews.length}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statOrganizations', 'Organizations')}</span>
            <div className={styles.statIconWrap}>
              <Building2 size={18} color="#EAB308" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalOrganizations}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statTotalUsers', 'Users')}</span>
            <div className={styles.statIconWrap}>
              <Users size={18} color="#06B6D4" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.totalUsers}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statPendingReports', 'Pending Reports')}</span>
            <div className={styles.statIconWrap}>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.pendingReports}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('admin.statTraffic', 'Est. Traffic')}</span>
            <div className={styles.statIconWrap}>
              <Flame size={18} color="#F97316" />
            </div>
          </div>
          <span className={styles.statValue}>{stats.approxViews}</span>
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
          <span>{t('admin.tabOverview', 'Overview')}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'tools' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <Wrench size={16} />
          <span>{t('admin.tabTools', 'Tools')} ({tools.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderTree size={16} />
          <span>{t('admin.tabCategories', 'Categories')} ({categories.length - 1})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'tags' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          <Tag size={16} />
          <span>{t('admin.tabTags', 'Tags & Taxonomy')}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <MessageSquare size={16} />
          <span>{t('admin.tabReviews', 'Review Moderation')} ({allReviews.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'organizations' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} />
          <span>{t('admin.tabOrganizations', 'Organizations')} ({organizations.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>{t('admin.tabUsers', 'Users & Roles')} ({users.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <AlertTriangle size={16} />
          <span>{t('admin.tabReports', 'Reports')}</span>
          {stats.pendingReports > 0 && (
            <span className={`${styles.tabBadge} ${styles.highlight}`}>
              {stats.pendingReports}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={16} />
          <span>{t('admin.tabLogs', 'Audit Logs')} ({logs.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'system' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Sliders size={16} />
          <span>{t('admin.tabSystem', 'System & Backup')}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.welcomeTitle', 'Welcome to Guidora Command Center')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.welcomeSubtitle', 'Select an administration section above to inspect tools, adjust categories or manage verified organizations.')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tools')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {t('admin.manageToolsCardTitle', 'Manage Directory Tools')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('admin.manageToolsCardDesc', 'Toggle verification badges, audit community submissions, or remove outdated entries.')}
              </p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>
                {t('admin.openToolsBtn', 'Open Tools →')}
              </button>
            </div>

            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('categories')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {t('admin.configureCategoriesCardTitle', 'Configure Categories')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('admin.configureCategoriesCardDesc', 'Create custom categories, set accent colors and toggle popular slider tags.')}
              </p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>
                {t('admin.openCategoriesBtn', 'Open Categories →')}
              </button>
            </div>

            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('organizations')}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {t('admin.verifiedOrgsCardTitle', 'Verified Organizations')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('admin.verifiedOrgsCardDesc', 'Create organizations, manage enterprise affiliations and verification status.')}
              </p>
              <button className={styles.primaryBtn} style={{ marginTop: '12px' }}>
                {t('admin.openOrganizationsBtn', 'Open Organizations →')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOOLS MANAGEMENT */}
      {activeTab === 'tools' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.liveToolsTitle', 'Live Directory Tools')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.liveToolsSubtitle', 'Toggle trust badges, inspect details, or remove tools from the live catalog.')}
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('admin.searchToolOrCat', 'Search tool or category...')}
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                />
              </div>

              {selectedToolIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleBatchVerify}
                    title="Verify selected tools"
                  >
                    <CheckSquare size={15} color="#10b981" />
                    <span>{t('admin.verifySelected', 'Verify')} ({selectedToolIds.length})</span>
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={handleBatchDelete}
                    title="Delete selected tools"
                  >
                    <Trash2 size={15} />
                    <span>{t('admin.deleteSelected', 'Delete')} ({selectedToolIds.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredTools.length > 0 &&
                        selectedToolIds.length === filteredTools.length
                      }
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th>{t('admin.colTool', 'Tool')}</th>
                  <th>{t('admin.colCategory', 'Category')}</th>
                  <th>{t('admin.colPricing', 'Pricing')}</th>
                  <th>{t('admin.colAdminVerified', 'Admin Verified')}</th>
                  <th>{t('admin.colCommunity', 'Community')}</th>
                  <th>{t('admin.colBotAudited', 'Bot Audited')}</th>
                  <th>{t('admin.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedToolIds.includes(t.id)}
                        onChange={() => handleToggleSelectTool(t.id)}
                      />
                    </td>
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
                          onClick={() => handleOpenEditTool(t)}
                          title="Quick Edit Tool Details"
                        >
                          <Edit3 size={15} />
                        </button>
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
              <h2 className={styles.sectionTitle}>{t('admin.categoriesTitle', 'Directory Categories')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.categoriesSubtitle', 'Add, manage, and customize categories displayed in the hero carousel and filter drawers.')}
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('admin.filterCategories', 'Filter categories...')}
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleOpenAddCategory}
              >
                <Plus size={16} />
                <span>{t('admin.addCategory', 'Add Category')}</span>
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{t('admin.colCategoryName', 'Category Name')}</th>
                  <th>{t('admin.colIdentifier', 'Identifier')}</th>
                  <th>{t('admin.colAccentColor', 'Accent Color')}</th>
                  <th>{t('admin.colSliderPopular', 'Slider / Popular')}</th>
                  <th>{t('admin.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.toolCell}>
                        <div
                          className={styles.catColorDot}
                          style={{ background: c.color || '#8A38F5' }}
                        />
                        <span className={styles.toolNameText}>
                          {translateCategory(c.id, c.name, c)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <code>{c.id}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            background: c.color || '#8A38F5',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        />
                        <span>{c.color || '#8A38F5'}</span>
                      </div>
                    </td>
                    <td>
                      {c.isPopular ? (
                        <span className={`${styles.badge} ${styles.success}`}>{t('admin.featured', 'Featured')}</span>
                      ) : (
                        <span className={`${styles.badge}`}>{t('admin.standard', 'Standard')}</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() =>
                            handleOpenTranslations({
                              itemType: 'category',
                              title: `${t('admin.translateCategory', 'Translate Category')}: "${c.name}"`,
                              baseName: c.name,
                              initialTranslations: c.translations || {},
                              onSave: (vals) => {
                                adminUpdateCategory(c.id, { translations: vals });
                                refreshData();
                              },
                            })
                          }
                          title={`${t('admin.manageTranslations', 'Configure Translations')} (${c.name})`}
                        >
                          <Globe size={15} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => handleOpenEditCategory(c)}
                          title={t('admin.editCategory', 'Edit Category & Translations')}
                        >
                          <Edit2 size={15} />
                        </button>
                        {canUserPerformAction(currentUser, 'delete_category') ? (
                          <button
                            type="button"
                            className={`${styles.iconActionBtn} ${styles.delete}`}
                            onClick={() => handleDeleteCategory(c.id)}
                            title="Delete Category"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.iconActionBtn} ${styles.disabledAction}`}
                            disabled
                            title={t('admin.lockedActionTooltip', 'Restricted for Moderators')}
                          >
                            <Lock size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TAGS & TAXONOMY */}
      {activeTab === 'tags' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.tagsTitle', 'Tag & Taxonomy Management')}</h2>
              <p className={styles.sectionSubtitle}>
                {t(
                  'admin.tagsSubtitle',
                  'Configure capabilities, platforms, pricing types, and license classifications for the directory filter system.'
                )}
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('filter.searchFilters', 'Search tags...')}
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleOpenAddTag(undefined, 'category')}
                title={t('admin.addTagCategory', 'Add Tag Category / Group')}
              >
                <FolderTree size={15} />
                <span>{t('admin.addTagGroupBtn', '+ Tag Group')}</span>
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleOpenAddTag('pricing', 'tag')}
              >
                <Plus size={16} />
                <span>{t('admin.addTag', 'Add Tag')}</span>
              </button>
            </div>
          </div>

          <div className={styles.tagCategoriesGrid}>
            {filteredTagCategories.map((group) => (
              <div key={group.id} className={styles.tagCategoryCard}>
                <div className={styles.tagCategoryHead}>
                  <div>
                    <h3 className={styles.tagGroupName}>
                      {translateTagCategory(group.id, group.name, group)}
                    </h3>
                    <span className={styles.tagGroupSlug}>id: {group.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() =>
                        handleOpenTranslations({
                          itemType: 'tag_category',
                          title: `${t('admin.translateTagCategory', 'Translate Tag Group')}: "${group.name}"`,
                          baseName: group.name,
                          initialTranslations: group.translations || {},
                          onSave: (vals) => {
                            adminUpdateTagCategory(group.id, { translations: vals });
                            refreshData();
                          },
                        })
                      }
                      title={`${t('admin.manageTranslations', 'Configure Translations')} (${group.name})`}
                      style={{ width: '26px', height: '26px' }}
                    >
                      <Globe size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => handleOpenEditTagCategory(group)}
                      title={`${t('admin.editTagCategory', 'Edit Tag Group')} (${group.name})`}
                      style={{ width: '26px', height: '26px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => handleOpenAddTag(group.id)}
                      title={`Add tag to ${group.name}`}
                      style={{ width: '26px', height: '26px' }}
                    >
                      <Plus size={13} />
                    </button>
                    {canUserPerformAction(currentUser, 'delete_category') && (
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.delete}`}
                        onClick={() => handleDeleteTagCategory(group.id, group.name)}
                        title={`Delete tag group "${group.name}"`}
                        style={{ width: '26px', height: '26px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <span className={`${styles.badge} ${group.isSingleSelect ? styles.purple : styles.neutral}`}>
                      {group.isSingleSelect ? t('filter.selectOnlyOne', 'Single Select') : t('filter.selectMultiple', 'Multi Select')}
                    </span>
                  </div>
                </div>

                <div className={styles.tagPillsGrid}>
                  {(group.tags || []).length === 0 ? (
                    <span className={styles.emptyTagText}>No tags in this category</span>
                  ) : (
                    group.tags.map((tag) => (
                      <div key={tag.id} className={styles.tagPillBadge}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {translateTag(tag.id, tag.name, tag)}
                          {tag.translations?.tr && (
                            <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0 3px', borderRadius: '3px', fontWeight: '700' }}>TR</span>
                          )}
                          {tag.translations?.ru && (
                            <span style={{ fontSize: '9px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '0 3px', borderRadius: '3px', fontWeight: '700' }}>RU</span>
                          )}
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                          <button
                            type="button"
                            className={styles.tagEditBtn}
                            onClick={() =>
                              handleOpenTranslations({
                                itemType: 'tag',
                                title: `${t('admin.translateTag', 'Translate Tag')}: "${tag.name}"`,
                                baseName: tag.name,
                                initialTranslations: tag.translations || {},
                                onSave: (vals) => {
                                  adminUpdateTag(group.id, tag.id, { translations: vals });
                                  refreshData();
                                },
                              })
                            }
                            title={`${t('admin.manageTranslations', 'Configure Translations')} "${tag.name}"`}
                          >
                            <Globe size={11} />
                          </button>
                          <button
                            type="button"
                            className={styles.tagEditBtn}
                            onClick={() => handleOpenEditTag(group, tag)}
                            title={`${t('admin.editTag', 'Edit Tag')} "${tag.name}"`}
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            className={styles.tagDeleteBtn}
                            onClick={() => handleDeleteTag(group.id, tag.id)}
                            title={`${t('admin.deleteTag', 'Delete Tag')} "${tag.name}"`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORGANIZATIONS */}
      {activeTab === 'organizations' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.orgsTitle', 'Verified Organizations')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.orgsSubtitle', 'Organizations verified by Guidora Admins. Tools can be attributed to these verified owners.')}
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('admin.filterOrgs', 'Filter organizations...')}
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
                <span>{t('admin.addOrganization', 'Add Organization')}</span>
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{t('admin.colOrganization', 'Organization')}</th>
                  <th>{t('admin.colWebsite', 'Website')}</th>
                  <th>{t('admin.colVerification', 'Verification')}</th>
                  <th>{t('admin.colSource', 'Source')}</th>
                  <th>{t('admin.colActions', 'Actions')}</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => handleStartEditOrg(o)}
                          title="Edit Organization"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.delete}`}
                          onClick={() => handleDeleteOrg(o.id)}
                          title="Delete Organization"
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

      {/* TAB 5: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.usersTitle', 'User & Role Management')}</h2>
              <p className={styles.sectionSubtitle}>
                {t(
                  'admin.usersSubtitle',
                  'Manage user roles, reputation points, titles, and system access rights.'
                )}
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

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleOpenAddUser}
              >
                <Plus size={16} />
                <span>{t('admin.addUser', 'Add User')}</span>
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Reputation</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                  <th>Actions</th>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span className={styles.toolNameText}>{u.name}</span>
                            {(u.isVerified || u.verified) && (
                              <BadgeCheck size={14} color="#3B82F6" title="Verified Member" />
                            )}
                          </div>
                          <div className={styles.toolSubText}>{u.title || `@${u.handle || u.id}`}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.joinedDate || 'Recent'}</td>
                    <td>
                      {u.status === 'suspended' ? (
                        <span className={styles.statusBadgeSuspended}>
                          <Ban size={11} /> Suspended
                        </span>
                      ) : (
                        <span className={styles.statusBadgeActive}>
                          <UserCheck size={11} /> Active
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#10B981' }}>
                        {u.reputation || 100} Rep
                      </span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className={`${styles.badge} ${styles.purple}`}>
                          <ShieldCheck size={12} /> {t('user.platformAdmin', 'Admin')}
                        </span>
                      ) : u.role === 'moderator' ? (
                        <span className={`${styles.badge} ${styles.warning}`}>
                          <AlertTriangle size={12} /> {t('user.moderatorRole', 'Moderator')}
                        </span>
                      ) : u.role === 'creator' ? (
                        <span className={`${styles.badge} ${styles.success}`}>{t('user.toolCreator', 'Creator')}</span>
                      ) : (
                        <span className={`${styles.badge}`}>{t('user.communityMember', 'Member')}</span>
                      )}
                    </td>
                    <td>
                      {canUserPerformAction(currentUser, 'change_user_role') ? (
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
                          <option value="member">{t('user.communityMember', 'Member')}</option>
                          <option value="creator">{t('user.toolCreator', 'Creator')}</option>
                          <option value="moderator">{t('user.moderatorRole', 'Moderator')}</option>
                          <option value="admin">{t('user.platformAdmin', 'Admin')}</option>
                        </select>
                      ) : (
                        <div className={styles.lockedControl} title={t('admin.lockedActionTooltip', 'Restricted for Moderators')}>
                          <select
                            value={u.role}
                            disabled
                            style={{
                              background: 'var(--bg-input)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-card)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12.5px',
                              cursor: 'not-allowed',
                            }}
                          >
                            <option value={u.role}>{u.role}</option>
                          </select>
                          <span className={styles.lockedBadge}>
                            <Lock size={12} />
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => handleOpenEditUser(u)}
                          title={t('admin.editUser', 'Edit User Details')}
                        >
                          <Edit2 size={14} />
                        </button>
                        {canUserPerformAction(currentUser, 'change_user_role') && u.id !== currentUser?.id && (
                          <button
                            type="button"
                            className={`${styles.iconActionBtn} ${styles.delete}`}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title={t('admin.deleteUser', 'Delete User')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.reviewsTitle', 'Review Moderation Center')}</h2>
              <p className={styles.sectionSubtitle}>
                {t(
                  'admin.reviewsSubtitle',
                  'Inspect, verify, and remove inappropriate user ratings and reviews across all directory tools.'
                )}
              </p>
            </div>

            <div className={styles.sectionActions}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('admin.searchReviews', 'Search reviews by tool, author or content...')}
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                />
              </div>

              {/* Tool Filter Selector */}
              <select
                value={reviewToolFilter}
                onChange={(e) => setReviewToolFilter(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  maxWidth: '220px',
                }}
              >
                <option value="all">🔍 {t('hero.allTools', 'All Tools (No Tool Filter)')}</option>
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Rating & Active Filters Bar */}
          <div className={styles.reviewFiltersContainer}>
            <div className={styles.reviewFilterControls}>
              <div className={styles.ratingChipsWrap}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, paddingRight: '4px' }}>
                  {t('reviews.filterRating', 'Rating')}:
                </span>
                {['all', '5', '4', '3', '2', '1'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.ratingChipBtn} ${reviewRatingFilter === val ? styles.activeRating : ''}`}
                    onClick={() => setReviewRatingFilter(val)}
                  >
                    {val === 'all' ? (
                      t('common.all', 'All')
                    ) : (
                      <>
                        <span>{val}</span>
                        <Star size={11} fill="#EAB308" color="#EAB308" />
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className={styles.activeFiltersBar}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {filteredReviews.length} {t('user.reviews', 'reviews')}
                </span>

                {reviewToolFilter !== 'all' && (
                  <span className={styles.activeFilterPill}>
                    <span>{tools.find((t) => t.id === reviewToolFilter)?.name || reviewToolFilter}</span>
                    <button
                      type="button"
                      onClick={() => setReviewToolFilter('all')}
                      title="Clear tool filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {reviewRatingFilter !== 'all' && (
                  <span className={styles.activeFilterPill}>
                    <span>{reviewRatingFilter} ★</span>
                    <button
                      type="button"
                      onClick={() => setReviewRatingFilter('all')}
                      title="Clear rating filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {reviewSearch.trim() && (
                  <span className={styles.activeFilterPill}>
                    <span>"{reviewSearch}"</span>
                    <button
                      type="button"
                      onClick={() => setReviewSearch('')}
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {(reviewToolFilter !== 'all' || reviewRatingFilter !== 'all' || reviewSearch.trim()) && (
                  <button
                    type="button"
                    className={styles.clearFiltersBtn}
                    onClick={() => {
                      setReviewToolFilter('all');
                      setReviewRatingFilter('all');
                      setReviewSearch('');
                    }}
                  >
                    {t('common.clearAll', 'Reset Filters')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{t('tabs.about', 'Tool')}</th>
                  <th>{t('user.viewProfile', 'Reviewer')}</th>
                  <th>Rating</th>
                  <th>Date</th>
                  <th>Review Content</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      {t('user.noReviews', 'No reviews matching the criteria.')}
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev) => (
                    <tr key={rev.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            className={styles.toolNameText}
                            style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
                            onClick={() => onOpenTool && onOpenTool(rev.toolId)}
                            title={rev.toolName || rev.toolId}
                          >
                            {rev.toolName || rev.toolId}
                          </div>
                          <button
                            type="button"
                            className={styles.iconActionBtn}
                            style={{ width: '22px', height: '22px', padding: 0 }}
                            onClick={() => setReviewToolFilter(rev.toolId)}
                            title="Filter this tool's reviews"
                          >
                            <Filter size={11} />
                          </button>
                        </div>
                        <div className={styles.toolSubText}>{rev.toolCategory || 'AI'}</div>
                      </td>
                      <td>
                        <div className={styles.toolCell}>
                          <div className={styles.toolInitialBadge}>
                            {(rev.author || 'AI').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.toolNameText}>{rev.author}</div>
                            <div className={styles.toolSubText}>{rev.role || 'Member'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#EAB308' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= rev.rating ? '#EAB308' : 'none'}
                              color={s <= rev.rating ? '#EAB308' : 'var(--text-muted)'}
                            />
                          ))}
                          <span style={{ fontSize: '12px', fontWeight: '700', marginLeft: '4px' }}>
                            {rev.rating}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rev.date || 'Recent'}</td>
                      <td>
                        <div className={styles.reviewExcerpt}>{rev.content}</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.delete}`}
                          onClick={() => handleDeleteReview(rev.toolId, rev.id)}
                          title={t('user.deleteReview', 'Delete Review')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
              <h2 className={styles.sectionTitle}>{t('admin.reportsTitle', 'Community Reports & Flags')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.reportsSubtitle', 'Review submissions and reported issues flagged by community members.')}
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={36} color="#10B981" />
              <p>{t('admin.reportsEmpty', 'No community reports pending. All clean!')}</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t('admin.colReportId', 'Report ID')}</th>
                    <th>{t('admin.colToolId', 'Tool ID')}</th>
                    <th>{t('admin.colReason', 'Reason')}</th>
                    <th>{t('admin.colDetails', 'Details')}</th>
                    <th>{t('admin.colStatus', 'Status')}</th>
                    <th>{t('admin.colActions', 'Actions')}</th>
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
                          <span className={`${styles.badge} ${styles.success}`}>{t('admin.statusResolved', 'Resolved')}</span>
                        ) : r.status === 'dismissed' ? (
                          <span className={`${styles.badge}`}>{t('admin.statusDismissed', 'Dismissed')}</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.danger}`}>{t('admin.statusPending', 'Pending')}</span>
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

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Administrative Audit Trail</h2>
              <p className={styles.sectionSubtitle}>
                Real-time security and modification log of actions taken within the Guidora admin environment.
              </p>
            </div>
          </div>

          <div className={styles.logTimeline}>
            {logs.map((l) => (
              <div key={l.id} className={styles.logItem}>
                <div className={styles.logLeft}>
                  <div className={styles.logIcon}>
                    <Activity size={16} />
                  </div>
                  <div>
                    <div className={styles.logActionText}>{l.action}</div>
                    <div className={styles.logTargetText}>{l.target}</div>
                  </div>
                </div>

                <div className={styles.logRight}>
                  <span>By {l.admin}</span>
                  <span>•</span>
                  <span>{new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM & BACKUP */}
      {activeTab === 'system' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{t('admin.systemTitle', 'System Maintenance & Data Management')}</h2>
              <p className={styles.sectionSubtitle}>
                {t('admin.systemSubtitle', 'Export directory data snapshots, restore backups, or reset local sandbox data.')}
              </p>
            </div>
          </div>

          <div className={styles.systemGrid}>
            <div className={styles.systemCard}>
              <div>
                <h3 className={styles.systemCardTitle}>{t('admin.backupExportTitle', 'JSON Backup Export')}</h3>
                <p className={styles.systemCardDesc}>
                  {t('admin.backupExportDesc', 'Download a full snapshot of your custom tools, newly created categories, verified organizations, and moderation logs.')}
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleExportBackup}
              >
                <Download size={16} />
                <span>{t('admin.exportBtn', 'Export Platform JSON')}</span>
              </button>
            </div>

            <div className={styles.systemCard}>
              <div>
                <h3 className={styles.systemCardTitle}>{t('admin.restoreTitle', 'Restore From Snapshot')}</h3>
                <p className={styles.systemCardDesc}>
                  {t('admin.restoreDesc', 'Upload a previously exported JSON backup file to instantly restore or populate the local directory state.')}
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleImportBackup}
              />
              {canUserPerformAction(currentUser, 'system_reset') ? (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>{t('admin.restoreBtn', 'Restore Backup File')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.secondaryBtn} ${styles.disabledAction}`}
                  disabled
                  title={t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)')}
                >
                  <Lock size={16} />
                  <span>{t('admin.restoreBtn', 'Restore Backup File')} ({t('admin.roleModerator', 'Locked')})</span>
                </button>
              )}
            </div>

            <div className={`${styles.systemCard} ${styles.dangerCard}`}>
              <div>
                <h3 className={styles.systemCardTitle} style={{ color: '#ef4444' }}>
                  {t('admin.resetTitle', 'Reset Platform Sandbox')}
                </h3>
                <p className={styles.systemCardDesc}>
                  {t('admin.resetDesc', 'Clear all administrative modifications and overrides, restoring factory mock datasets. Use with caution.')}
                </p>
              </div>
              {canUserPerformAction(currentUser, 'system_reset') ? (
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleResetPlatform}
                >
                  <RefreshCw size={16} />
                  <span>{t('admin.resetBtn', 'Reset to Defaults')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.dangerBtn} ${styles.disabledAction}`}
                  disabled
                  title={t('admin.lockedActionTooltip', 'Administrator permission required (Restricted for Moderators)')}
                >
                  <Lock size={16} />
                  <span>{t('admin.resetBtn', 'Reset to Defaults')} ({t('admin.roleModerator', 'Locked')})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. DYNAMIC UNIFIED TRANSLATION MODAL (Categories, Tag Groups & Tags) */}
      <UnifiedTranslationModal
        isOpen={translationModalOpen}
        onClose={() => setTranslationModalOpen(false)}
        itemType={translationItemType}
        title={translationTitle}
        baseName={translationBaseName}
        initialTranslations={translationValues}
        onSave={(updatedTranslations) => {
          if (onSaveTranslations) {
            onSaveTranslations(updatedTranslations);
          }
        }}
      />

      {/* 2. CATEGORY MODAL (ADD & EDIT) */}
      {categoryModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCategoryModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCategory
                  ? `${t('admin.editCategory', 'Edit Category')}: ${editingCategory.name}`
                  : t('admin.addCategory', 'Add New Category')}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCategoryModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>{t('admin.catNameEnLabel', 'Category Name (English / Default)*')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Synthetic Voice, Agent Ops..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>{t('admin.targetLanguages', 'Multi-Language Localizations')}</label>
                    <button
                      type="button"
                      className={styles.btnTranslate}
                      onClick={() =>
                        handleOpenTranslations({
                          itemType: 'category',
                          title: `Translations for "${catName || 'Category'}"`,
                          baseName: catName,
                          initialTranslations: catTranslations,
                          onSave: (vals) => setCatTranslations(vals),
                        })
                      }
                    >
                      <Globe size={13} />
                      <span>{t('admin.manageTranslations', 'Configure Translations')}</span>
                      {Object.values(catTranslations).filter(Boolean).length > 0 && (
                        <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                          {Object.values(catTranslations).filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {Object.keys(catTranslations).length > 0
                      ? `Configured: ${Object.entries(catTranslations).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()}: "${v}"`).join(', ') || 'None (Falls back to default)'}`
                      : t('admin.fallbackNotice', 'Not set. Will fall back to default English.')}
                  </p>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.accentColor', 'Accent Color')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={catColor}
                        onChange={(e) => setCatColor(e.target.value)}
                        style={{ height: '42px', width: '56px', padding: '2px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={catColor}
                        onChange={(e) => setCatColor(e.target.value)}
                        style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ visibility: 'hidden' }}>Spacer</label>
                    <label className={styles.checkboxLabel} style={{ marginTop: '8px' }}>
                      <input
                        type="checkbox"
                        checked={catPopular}
                        onChange={(e) => setCatPopular(e.target.checked)}
                      />
                      <span>{t('admin.showOnTopSlider', 'Show on Top Slider')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setCategoryModalOpen(false)}
                >
                  {t('user.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingCategory ? t('admin.saveCategoryChanges', 'Save Category') : t('admin.createCategory', 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TAG & TAG CATEGORY MODAL (ADD & EDIT) */}
      {tagModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTagModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingTag
                  ? `${t('admin.editTag', 'Edit Tag')}: ${editingTag.tag.name}`
                  : addTagActiveTab === 'category'
                  ? t('admin.addTagCategory', 'Add Tag Category / Group')
                  : t('admin.addTag', 'Add Tag')}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setTagModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTag}>
              <div className={styles.modalBody}>
                {/* Tab Switcher when adding a new item */}
                {!editingTag && (
                  <div className={styles.modalTabsBar}>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${addTagActiveTab === 'tag' ? styles.modalTabActive : ''}`}
                      onClick={() => setAddTagActiveTab('tag')}
                    >
                      <Tag size={14} />
                      <span>{t('admin.addTagSingle', 'Add Tag')}</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${addTagActiveTab === 'category' ? styles.modalTabActive : ''}`}
                      onClick={() => setAddTagActiveTab('category')}
                    >
                      <FolderTree size={14} />
                      <span>{t('admin.addTagGroupBtn', 'Add Tag Group')}</span>
                    </button>
                  </div>
                )}

                {addTagActiveTab === 'category' && !editingTag ? (
                  <>
                    <div className={styles.formGroup}>
                      <label>{t('admin.tagCatNameEnLabel', 'Tag Group Name (English / Default)*')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Compliance & Security, Industry..."
                        value={newTagCatName}
                        onChange={(e) => {
                          setNewTagCatName(e.target.value);
                          if (!newTagCatId) {
                            setNewTagCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                          }
                        }}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>{t('admin.tagCatIdLabel', 'Tag Group ID / Slug (Unique identifier)*')}</label>
                      <input
                        type="text"
                        placeholder="e.g. compliance, industry..."
                        value={newTagCatId}
                        onChange={(e) => setNewTagCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>{t('admin.targetLanguages', 'Multi-Language Localizations')}</label>
                        <button
                          type="button"
                          className={styles.btnTranslate}
                          onClick={() =>
                            handleOpenTranslations({
                              itemType: 'tag_category',
                              title: `Translations for Tag Group "${newTagCatName || 'Group'}"`,
                              baseName: newTagCatName,
                              initialTranslations: newTagCatTranslations,
                              onSave: (vals) => setNewTagCatTranslations(vals),
                            })
                          }
                        >
                          <Globe size={13} />
                          <span>{t('admin.manageTranslations', 'Configure Translations')}</span>
                          {Object.values(newTagCatTranslations).filter(Boolean).length > 0 && (
                            <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                              {Object.values(newTagCatTranslations).filter(Boolean).length}
                            </span>
                          )}
                        </button>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {Object.keys(newTagCatTranslations).length > 0
                          ? `Configured: ${Object.entries(newTagCatTranslations).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()}: "${v}"`).join(', ') || 'None'}`
                          : t('admin.fallbackNotice', 'Not set. Will fall back to default English.')}
                      </p>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={newTagCatSingleSelect}
                          onChange={(e) => setNewTagCatSingleSelect(e.target.checked)}
                        />
                        <span>{t('admin.groupSingleSelect', 'Single Select Group (only one tag can be picked at a time)')}</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label>{t('admin.tagCategory', 'Tag Group')}</label>
                      <select
                        value={tagGroupId}
                        disabled={Boolean(editingTag)}
                        onChange={(e) => setTagGroupId(e.target.value)}
                        style={{
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '13.5px',
                          width: '100%',
                          cursor: editingTag ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {tagCategories.map((group) => (
                          <option key={group.id} value={group.id}>
                            {t(`tagCat.${group.id}`, group.name)} ({group.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>{t('admin.tagNameEnLabel', 'Tag Name (English / Default)*')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Kubernetes, Python, MIT..."
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ margin: 0 }}>{t('admin.targetLanguages', 'Multi-Language Localizations')}</label>
                        <button
                          type="button"
                          className={styles.btnTranslate}
                          onClick={() =>
                            handleOpenTranslations({
                              itemType: 'tag',
                              title: `Translations for Tag "${tagName || 'Tag'}"`,
                              baseName: tagName,
                              initialTranslations: tagTranslations,
                              onSave: (vals) => setTagTranslations(vals),
                            })
                          }
                        >
                          <Globe size={13} />
                          <span>{t('admin.manageTranslations', 'Configure Translations')}</span>
                          {Object.values(tagTranslations).filter(Boolean).length > 0 && (
                            <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                              {Object.values(tagTranslations).filter(Boolean).length}
                            </span>
                          )}
                        </button>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {Object.keys(tagTranslations).length > 0
                          ? `Configured: ${Object.entries(tagTranslations).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()}: "${v}"`).join(', ') || 'None (Falls back to default)'}`
                          : t('admin.fallbackNotice', 'Not set. Will fall back to default English.')}
                      </p>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={tagSingleSelect}
                          onChange={(e) => setTagSingleSelect(e.target.checked)}
                        />
                        <span>{t('admin.singleChoice', 'Exclusive / Single Choice (e.g. Pricing Models)')}</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setTagModalOpen(false)}
                >
                  {t('user.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingTag
                    ? t('admin.saveToolChanges', 'Save Tag')
                    : addTagActiveTab === 'category'
                    ? t('admin.createTagCategory', 'Create Tag Group')
                    : t('admin.createTag', 'Create Tag')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddUserModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('admin.addNewUser', 'Add New User')}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddUserModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddUser}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('user.fullName', 'Full Name*')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>{t('auth.username', 'Username*')}</label>
                    <input
                      type="text"
                      placeholder="e.g. alexrivera"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('user.email', 'Email Address*')}</label>
                    <input
                      type="email"
                      placeholder="e.g. alex@company.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>{t('auth.password', 'Initial Password*')}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showNewUserPassword ? 'text' : 'password'}
                        placeholder={t('admin.passwordPlaceholder', 'Min. 4 characters...')}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                        }}
                        title={showNewUserPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.role', 'Platform Role')}</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      style={{
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13.5px',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="creator">Creator</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>{t('user.jobTitle', 'Professional Title')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior AI Research Scientist"
                      value={newUserTitle}
                      onChange={(e) => setNewUserTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.reputation', 'Reputation Points')}</label>
                    <input
                      type="number"
                      min="0"
                      value={newUserReputation}
                      onChange={(e) => setNewUserReputation(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>{t('admin.avatarOrInitials', 'Avatar (Initials or Image URL)')}</label>
                    <input
                      type="text"
                      placeholder="e.g. AR or https://images.unsplash.com/..."
                      value={newUserAvatar}
                      onChange={(e) => setNewUserAvatar(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>{t('user.bio', 'Bio / Notes')}</label>
                  <textarea
                    rows={2}
                    placeholder="Short description or user background..."
                    value={newUserBio}
                    onChange={(e) => setNewUserBio(e.target.value)}
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13.5px',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  {t('user.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {t('admin.createUser', 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TAG CATEGORY (GROUP) MODAL (EDIT) */}
      {tagCategoryModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTagCategoryModalOpen(false);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {t('admin.editTagCategory', 'Edit Tag Group')}: {editingTagCategory?.name}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setTagCategoryModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTagCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>{t('admin.tagCategoryName', 'Tag Group Name (English / Default)')}*</label>
                  <input
                    type="text"
                    value={tagCatName}
                    onChange={(e) => setTagCatName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>{t('admin.targetLanguages', 'Multi-Language Localizations')}</label>
                    <button
                      type="button"
                      className={styles.btnTranslate}
                      onClick={() =>
                        handleOpenTranslations({
                          itemType: 'tag_category',
                          title: `${t('admin.translateTagCategory', 'Translate Tag Group')}: "${tagCatName || 'Group'}"`,
                          baseName: tagCatName,
                          initialTranslations: tagCatTranslations,
                          onSave: (vals) => setTagCatTranslations(vals),
                        })
                      }
                    >
                      <Globe size={13} />
                      <span>{t('admin.manageTranslations', 'Configure Translations')}</span>
                      {Object.values(tagCatTranslations).filter(Boolean).length > 0 && (
                        <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10.5px' }}>
                          {Object.values(tagCatTranslations).filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {Object.keys(tagCatTranslations).length > 0
                      ? `Configured: ${Object.entries(tagCatTranslations).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()}: "${v}"`).join(', ') || 'None (Falls back to default)'}`
                      : t('admin.fallbackNotice', 'Not set. Will fall back to default English.')}
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={tagCatSingleSelect}
                      onChange={(e) => setTagCatSingleSelect(e.target.checked)}
                    />
                    <span>{t('filter.selectOnlyOne', 'Single Choice Only (Filter system allows only one tag to be active)')}</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setTagCategoryModalOpen(false)}
                >
                  {t('user.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {t('common.save', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. UPGRADED TOOL STUDIO EDIT DIALOG (MODAL DIALECT - SOLID) */}
      {editingTool && (
        <ToolStudioForm
          mode="admin"
          initialData={editingTool}
          isModal={true}
          onSave={handleSaveToolStudio}
          onCancel={() => setEditingTool(null)}
        />
      )}

      {/* 5. USER MANAGEMENT MODAL */}
      {editingUser && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null);
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <UserCheck size={18} style={{ color: '#8A38F5', verticalAlign: 'middle', marginRight: '6px' }} />
                {t('admin.editUserStudio', 'Manage User Account')}: {editingUser.name}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name*</label>
                    <input
                      type="text"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Handle / Username</label>
                    <input
                      type="text"
                      value={editUserHandle}
                      onChange={(e) => setEditUserHandle(e.target.value)}
                      placeholder="e.g. sarah_connor"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Email Address*</label>
                    <input
                      type="email"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>{t('admin.userTitle', 'Professional Title')}</label>
                    <input
                      type="text"
                      value={editUserTitle}
                      onChange={(e) => setEditUserTitle(e.target.value)}
                      placeholder="e.g. Lead AI Engineer"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>{t('admin.accountStatus', 'Account Status')}</label>
                    <select
                      value={editUserStatus}
                      onChange={(e) => setEditUserStatus(e.target.value)}
                      style={{
                        background: 'var(--bg-card)',
                        color: editUserStatus === 'suspended' ? '#EF4444' : 'var(--text-primary)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13.5px',
                        fontWeight: '600',
                      }}
                    >
                      <option value="active">{t('admin.statusActive', 'Active Account')}</option>
                      <option value="suspended">{t('admin.statusSuspended', 'Suspended / Restricted')}</option>
                    </select>
                  </div>

                <div className={styles.formGroup}>
                  <label>{t('admin.userRole', 'Platform Role')}</label>
                  {canUserPerformAction(currentUser, 'change_user_role') ? (
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value)}
                      style={{
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13.5px',
                        width: '100%',
                      }}
                    >
                      <option value="member">{t('user.communityMember', 'Member')}</option>
                      <option value="creator">{t('user.toolCreator', 'Creator')}</option>
                      <option value="moderator">{t('user.moderatorRole', 'Moderator')}</option>
                      <option value="admin">{t('user.platformAdmin', 'Admin')}</option>
                    </select>
                  ) : (
                    <div className={styles.lockedControl} style={{ width: '100%' }}>
                      <select value={editUserRole} disabled style={{ width: '100%', cursor: 'not-allowed' }}>
                        <option value={editUserRole}>{editUserRole}</option>
                      </select>
                      <span className={styles.lockedBadge}>
                        <Lock size={12} />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('admin.userReputation', 'Reputation Points')}</label>
                  <input
                    type="number"
                    value={editUserRep}
                    onChange={(e) => setEditUserRep(e.target.value)}
                    min={0}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{t('admin.verifiedUserBadge', 'Verified User Badge')}</label>
                  <label className={styles.checkboxLabel} style={{ marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={editUserVerified}
                      onChange={(e) => setEditUserVerified(e.target.checked)}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <BadgeCheck size={14} color="#3B82F6" />
                      <span>{t('admin.verifiedUserBadge', 'Verified User Badge')}</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Bio / About</label>
                <textarea
                  rows={3}
                  value={editUserBio}
                  onChange={(e) => setEditUserBio(e.target.value)}
                  placeholder="Short user bio..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditingUser(null)}
              >
                {t('reviews.cancel', 'Cancel')}
              </button>
              <button type="submit" className={styles.primaryBtn}>
                {t('admin.saveUser', 'Save Changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* 6. MODAL: ADD ORGANIZATION */}
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
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Organization Name*</label>
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
                  rows={3}
                  placeholder="Short description of the company or team..."
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsAddOrgModalOpen(false)}
              >
                {t('reviews.cancel', 'Cancel')}
              </button>
              <button type="submit" className={styles.primaryBtn}>
                Create Organization
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* 7. MODAL: EDIT ORGANIZATION */}
    {editingOrg && (
      <div
        className={styles.modalBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditingOrg(null);
        }}
      >
        <div className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              <Building2 size={18} style={{ color: '#8A38F5', verticalAlign: 'middle', marginRight: '6px' }} />
              Edit Organization: {editingOrg.name}
            </h3>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setEditingOrg(null)}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveEditOrg}>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Organization Name*</label>
                  <input
                    type="text"
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Slug Identifier</label>
                  <input
                    type="text"
                    value={editOrgSlug}
                    onChange={(e) => setEditOrgSlug(e.target.value)}
                    placeholder="e.g. neuro-labs"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={editOrgWebsite}
                    onChange={(e) => setEditOrgWebsite(e.target.value)}
                    placeholder="https://company.ai"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Initials (Badge)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editOrgInitials}
                    onChange={(e) => setEditOrgInitials(e.target.value)}
                    placeholder="e.g. NL"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Verified Status</label>
                <label className={styles.checkboxLabel} style={{ marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={editOrgVerified}
                    onChange={(e) => setEditOrgVerified(e.target.checked)}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <BadgeCheck size={14} color="#10B981" />
                    <span>Verified Organization Badge</span>
                  </span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Description / Focus</label>
                <textarea
                  rows={3}
                  value={editOrgDesc}
                  onChange={(e) => setEditOrgDesc(e.target.value)}
                  placeholder="Short description of the company..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditingOrg(null)}
              >
                {t('reviews.cancel', 'Cancel')}
              </button>
              <button type="submit" className={styles.primaryBtn}>
                {t('common.saveChanges', 'Save Changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}

