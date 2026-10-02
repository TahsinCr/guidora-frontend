import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Ban,
  Edit2,
  Eye,
  EyeOff,
  User,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  Award,
  Calendar,
  Mail,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  adminCreateUser,
  adminUpdateUserRole,
  adminUpdateUserDetails,
  adminDeleteUser,
} from '@/services/userService';
import { adminAddLog } from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import { useLanguage } from '@/context/LanguageContext';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

const ROLE_CHIPS = [
  { id: 'all', label: 'Tüm Roller' },
  { id: 'admin', label: 'Admin (Yönetici)' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'creator', label: 'Creator (Üretici)' },
  { id: 'member', label: 'Member (Standart)' },
  { id: 'banned', label: 'Yasaklılar (Banned)' },
];

export default function UsersTab({
  users = [],
  globalSearch = '',
  onRefreshUsers,
}) {
  const { t, language } = useLanguage();
  const safeUsers = Array.isArray(users) ? users : [];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [viewUserModalOpen, setViewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Onayla',
    onConfirm: () => {},
  });

  // New User Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [title, setTitle] = useState('');
  const [reputation, setReputation] = useState(100);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('member');
  const [editTitle, setEditTitle] = useState('');
  const [editReputation, setEditReputation] = useState(100);

  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (roleFilter === 'banned') {
        if (!u.isBanned) return false;
      } else if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }
      const q = (search || globalSearch || '').trim().toLowerCase();
      if (q) {
        const n = (u.name || '').toLowerCase();
        const un = (u.username || '').toLowerCase();
        const em = (u.email || '').toLowerCase();
        const t = (u.title || '').toLowerCase();
        if (!n.includes(q) && !un.includes(q) && !em.includes(q) && !t.includes(q)) return false;
      }
      return true;
    });
  }, [safeUsers, roleFilter, search, globalSearch]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    if (pageSize === 'all') return filteredUsers;
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Ban / Unban
  const handleBatchBan = (shouldBan) => {
    selectedUserIds.forEach((id) => {
      adminUpdateUserDetails(id, { isBanned: shouldBan });
    });
    adminAddLog('BATCH_USERS_BANNED', `${selectedUserIds.length} kullanıcı ${shouldBan ? 'yasaklandı' : 'yasağı kaldırıldı'}`, 'warning', {
      category: 'GOVERNANCE',
    });
    toastService.success(`${selectedUserIds.length} kullanıcı için işlem uygulandı.`);
    setSelectedUserIds([]);
    if (onRefreshUsers) onRefreshUsers();
  };

  // Batch Role Change
  const handleBatchRole = (newRole) => {
    selectedUserIds.forEach((id) => {
      adminUpdateUserRole(id, newRole);
    });
    adminAddLog('BATCH_USERS_ROLE_CHANGED', `${selectedUserIds.length} kullanıcı rolü "${newRole}" yapıldı`, 'info', {
      category: 'AUTH',
    });
    toastService.success(`${selectedUserIds.length} kullanıcının rolü "${newRole}" olarak güncellendi.`);
    setSelectedUserIds([]);
    if (onRefreshUsers) onRefreshUsers();
  };

  // Batch Delete
  const handleBatchDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Toplu Kullanıcı Silme Onayı',
      message: `Seçilen ${selectedUserIds.length} adet kullanıcı hesabını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      confirmText: `${selectedUserIds.length} Kullanıcıyı Sil`,
      onConfirm: () => {
        selectedUserIds.forEach((id) => {
          adminDeleteUser(id);
        });
        adminAddLog('BATCH_USERS_DELETED', `${selectedUserIds.length} kullanıcı silindi`, 'error', {
          category: 'AUTH',
        });
        toastService.success(`${selectedUserIds.length} kullanıcı başarıyla silindi.`);
        setSelectedUserIds([]);
        if (onRefreshUsers) onRefreshUsers();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle Add User
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      toastService.warning('İsim, kullanıcı adı ve e-posta zorunludur.');
      return;
    }

    try {
      adminCreateUser({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
        title: title.trim(),
        reputation: Number(reputation) || 100,
        password: password || 'GuidoraPass123!',
      });
      adminAddLog('USER_CREATED', `${name} (@${username})`, 'success', {
        entityName: 'User',
        category: 'AUTH',
      });
      toastService.success(`"${name}" kullanıcısı başarıyla oluşturuldu.`);
      setAddUserModalOpen(false);
      setName('');
      setUsername('');
      setEmail('');
      setTitle('');
      setReputation(100);
      setPassword('');
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      toastService.error('Kullanıcı oluşturma hatası: ' + err.message);
    }
  };

  // Handle Quick Role Change
  const handleRoleChange = (userId, newRole, userName) => {
    try {
      adminUpdateUserRole(userId, newRole);
      adminAddLog('USER_ROLE_CHANGED', `${userName} -> ${newRole}`, 'warning', {
        entityName: 'User',
        entityId: userId,
        category: 'AUTH',
      });
      toastService.success(`${userName} rolü "${newRole}" olarak güncellendi.`);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      toastService.error('Rol güncelleme hatası: ' + err.message);
    }
  };

  // Handle Ban / Unban
  const handleToggleBan = (user) => {
    const nextBan = !user.isBanned;
    setConfirmModal({
      isOpen: true,
      title: nextBan ? 'Kullanıcıyı Yasakla' : 'Kullanıcı Yasağını Kaldır',
      message: nextBan
        ? `"${user.name}" (@${user.username}) kullanıcısını yasaklamak istediğinize emin misiniz? Kullanıcı platforma giriş yapamayacaktır.`
        : `"${user.name}" (@${user.username}) kullanıcısının yasağını kaldırmak istiyor musunuz?`,
      variant: nextBan ? 'danger' : 'primary',
      confirmText: nextBan ? 'Yasakla' : 'Yasağı Kaldır',
      onConfirm: () => {
        try {
          adminUpdateUserDetails(user.id, { isBanned: nextBan });
          adminAddLog(nextBan ? 'USER_BANNED' : 'USER_UNBANNED', user.name, nextBan ? 'error' : 'info', {
            entityName: 'User',
            entityId: user.id,
            category: 'GOVERNANCE',
          });
          toastService.success(nextBan ? 'Kullanıcı yasaklandı.' : 'Kullanıcı yasağı kaldırıldı.');
          if (onRefreshUsers) onRefreshUsers();
        } catch (err) {
          toastService.error('İşlem hatası: ' + err.message);
        }
      },
    });
  };

  // Handle Single Delete User
  const handleDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      title: 'Kullanıcıyı Sil',
      message: `"${user.name}" (@${user.username}) kullanıcısını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      confirmText: 'Hesabı Sil',
      onConfirm: () => {
        try {
          adminDeleteUser(user.id);
          adminAddLog('USER_DELETED', `${user.name} (@${user.username})`, 'error', {
            entityName: 'User',
            entityId: user.id,
            category: 'AUTH',
          });
          toastService.success(`"${user.name}" hesabı silindi.`);
          if (onRefreshUsers) onRefreshUsers();
        } catch (err) {
          toastService.error('Silme hatası: ' + err.message);
        }
      },
    });
  };

  // Open Edit User
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'member');
    setEditTitle(user.title || '');
    setEditReputation(user.reputation ?? 100);
    setEditUserModalOpen(true);
  };

  // Open User Detail
  const handleOpenView = (user) => {
    setViewingUser(user);
    setViewUserModalOpen(true);
  };

  // Save Edit User
  const handleSaveEditUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      adminUpdateUserDetails(editingUser.id, {
        name: editName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        title: editTitle.trim(),
        reputation: Number(editReputation) || 100,
      });
      adminAddLog('USER_DETAILS_UPDATED', editName, 'info', {
        entityName: 'User',
        entityId: editingUser.id,
        category: 'AUTH',
      });
      toastService.success(`"${editName}" bilgileri başarıyla güncellendi.`);
      setEditUserModalOpen(false);
      setEditingUser(null);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      toastService.error('Güncelleme hatası: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toastService.warning('Dışa aktarılacak kullanıcı bulunmuyor.');
      return;
    }
    const headers = ['ID', 'Ad Soyad', 'Kullanıcı Adı', 'E-posta', 'Rol', 'İtibar', 'Kayıt Tarihi', 'Yasaklı'];
    const rows = filteredUsers.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.role || 'member'}"`,
      u.reputation ?? 100,
      `"${u.joinedDate || ''}"`,
      u.isBanned ? 'Evet' : 'Hayır',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `guidora_users_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success(`${filteredUsers.length} kullanıcı CSV olarak indirildi.`);
  };

  return (
    <div className={styles.tabContent}>
      {/* Quick Role Filter Chips */}
      <div className={styles.quickFilterChips}>
        {ROLE_CHIPS.map((chip) => {
          const count = chip.id === 'all'
            ? safeUsers.length
            : chip.id === 'banned'
            ? safeUsers.filter((u) => u.isBanned).length
            : safeUsers.filter((u) => u.role === chip.id).length;
          return (
            <button
              key={chip.id}
              type="button"
              className={`${styles.filterChip} ${roleFilter === chip.id ? styles.filterChipActive : ''}`}
              onClick={() => {
                setRoleFilter(chip.id);
                setCurrentPage(1);
              }}
            >
              {chip.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="İsim, @kullanıcı, unvan veya e-posta ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportCSV}
            title="CSV Dışa Aktar"
          >
            <Download size={14} />
            <span>CSV Dışa Aktar</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnPrimary}
            onClick={() => setAddUserModalOpen(true)}
          >
            <Plus size={16} />
            <span>Yeni Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {/* Multi-Select Floating Batch Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className={styles.batchBar}>
          <div className={styles.batchBarSelected}>
            <CheckSquare size={16} color="#6366f1" />
            <span>
              <strong>{selectedUserIds.length}</strong> kullanıcı seçildi
            </span>
          </div>

          <div className={styles.batchBarActions}>
            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchBan(false)}
              title="Seçilenlerin Yasağını Kaldır"
            >
              <ShieldCheck size={13} color="#10b981" />
              <span>Yasağı Kaldır</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchBan(true)}
              title="Seçilenleri Yasakla"
            >
              <Ban size={13} color="#f59e0b" />
              <span>Yasakla</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchRole('moderator')}
            >
              <span>Moderator Yap</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchRole('creator')}
            >
              <span>Creator Yap</span>
            </button>

            <button
              type="button"
              className={`${styles.batchBtn} ${styles.batchBtnDanger}`}
              onClick={handleBatchDelete}
            >
              <Trash2 size={13} />
              <span>Toplu Sil</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => setSelectedUserIds([])}
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Users Data Grid */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className={`${styles.rowSelectBtn} ${selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0 ? styles.selected : ''}`}
                    aria-label="Tümünü Seç"
                  >
                    {selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0 ? (
                      <CheckSquare size={14} color="#6366f1" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </th>
                <th>Kullanıcı (Profil & Kimlik)</th>
                <th>Platform Rolü</th>
                <th>İtibar Puanı</th>
                <th>Kayıt Tarihi</th>
                <th>Hesap Durumu</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTableTd}>
                    Filtre kriterlerine uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`${user.isBanned ? styles.rowDeleted : ''} ${isSelected ? styles.rowSelected : ''}`}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectUser(user.id)}
                          className={`${styles.rowSelectBtn} ${isSelected ? styles.selected : ''}`}
                          aria-label="Kullanıcı Seç"
                        >
                          {isSelected ? (
                            <CheckSquare size={14} color="#6366f1" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className={styles.userIdentityCell}>
                          <div className={styles.userAvatarSquare}>
                            {user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div className={styles.userNameTitle}>
                              <strong>{user.name || 'İsimsiz'}</strong>
                              {user.username && <span className={styles.userHandle}>@{user.username}</span>}
                            </div>
                            <span className={styles.userEmailText}>{user.email}</span>
                            {user.title && <span className={styles.userMetaSub}>{user.title}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`${styles.roleSelectInline} ${styles[user.role]}`}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          aria-label="Kullanıcı Rolü Değiştir"
                        >
                          <option value="member">Member</option>
                          <option value="creator">Creator</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={styles.reputationBadge}>
                          <Award size={13} />
                          <span>{user.reputation ?? 100} pts</span>
                        </span>
                      </td>
                      <td>
                        <span className={styles.joinedDateText}>
                          {user.joinedDate || 'Eylül 2024'}
                        </span>
                      </td>
                      <td>
                        <span className={user.isBanned ? styles.bannedBadge : styles.activeBadge}>
                          {user.isBanned ? 'Yasaklı' : 'Aktif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActionsRight}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenView(user)}
                            title="Kullanıcı Detaylarını Gör"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenEdit(user)}
                            title="Kullanıcıyı Düzenle"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className={user.isBanned ? styles.actionIconBtnSuccess : styles.actionIconBtn}
                            onClick={() => handleToggleBan(user)}
                            title={user.isBanned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                          >
                            <Ban size={15} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtnDanger}
                            onClick={() => handleDeleteUser(user)}
                            title="Kullanıcıyı Tamamen Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredUsers.length > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              <span>
                Toplam <strong>{filteredUsers.length}</strong> kullanıcıdan <strong>{pageSize === 'all' ? filteredUsers.length : Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}</strong> - <strong>{pageSize === 'all' ? filteredUsers.length : Math.min(currentPage * pageSize, filteredUsers.length)}</strong> arası gösteriliyor
              </span>

              <div className={styles.pageSizeSelector}>
                <label>Sayfa Başına:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className={styles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">Tümü</option>
                </select>
              </div>
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className={styles.paginationNav}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Önceki Sayfa"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 7) {
                    if (currentPage <= 4) pageNum = idx + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + idx;
                    else pageNum = currentPage - 3 + idx;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Sonraki Sayfa"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addUserModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAddUserModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Yeni Kullanıcı Oluştur</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAddUserModalOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ad Soyad *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. Ayşe Yılmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kullanıcı Adı (@) *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. ayseyilmaz"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-posta Adresi *</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="örn. ayse@guidora.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unvan / Başlık</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. AI Researcher & Prompt Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Başlangıç İtibar Puanı</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="100"
                    value={reputation}
                    onChange={(e) => setReputation(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hesap Rolü</label>
                  <select
                    className={styles.formSelect}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="member">Member (Standart Üye)</option>
                    <option value="creator">Creator (Doğrulanmış Üretici)</option>
                    <option value="moderator">Moderator (Topluluk Moderatörü)</option>
                    <option value="admin">Admin (Tam Yetkili Yönetici)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Başlangıç Parolası</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      placeholder="Güçlü bir parola belirleyin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.pwToggleBtn}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setAddUserModalOpen(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.confirmBtnPrimary}>
                  Hesabı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModalOpen && editingUser && (
        <div className={styles.modalOverlay} onClick={() => setEditUserModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Kullanıcı Düzenle: {editingUser.name}</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditUserModalOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ad Soyad</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kullanıcı Adı</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-posta</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unvan / Başlık</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. Senior AI Researcher"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İtibar Puanı (Reputation)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={editReputation}
                    onChange={(e) => setEditReputation(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Rol</label>
                  <select
                    className={styles.formSelect}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="creator">Creator</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditUserModalOpen(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.confirmBtnPrimary}>
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUserModalOpen && viewingUser && (
        <div className={styles.modalOverlay} onClick={() => setViewUserModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Kullanıcı Profili</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setViewUserModalOpen(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className={styles.userAvatarSquare} style={{ width: '56px', height: '56px', fontSize: '18px' }}>
                  {viewingUser.avatar || (viewingUser.name ? viewingUser.name.substring(0, 2).toUpperCase() : 'U')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)' }}>{viewingUser.name}</h3>
                  <div style={{ color: '#818cf8', fontSize: '13px', fontFamily: 'monospace' }}>@{viewingUser.username || 'user'}</div>
                  {viewingUser.title && <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{viewingUser.title}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>E-posta</label>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{viewingUser.email}</div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Rol</label>
                  <div>
                    <span className={`${styles.roleSelectInline} ${styles[viewingUser.role]}`} style={{ pointerEvents: 'none' }}>
                      {viewingUser.role.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>İtibar Puanı</label>
                  <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 'bold' }}>{viewingUser.reputation ?? 100} pts</div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kayıt Tarihi</label>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{viewingUser.joinedDate || 'Belirtilmedi'}</div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hesap Durumu</label>
                  <div>
                    <span className={viewingUser.isBanned ? styles.bannedBadge : styles.activeBadge}>
                      {viewingUser.isBanned ? 'Yasaklı (Banned)' : 'Aktif (Normal)'}
                    </span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kaydedilen Araçlar</label>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{viewingUser.savedToolIds?.length || 0} araç</div>
                </div>
              </div>

              {viewingUser.bio && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Biyografi</label>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px' }}>
                    {viewingUser.bio}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setViewUserModalOpen(false)}
              >
                Kapat
              </button>
              <button
                type="button"
                className={styles.confirmBtnPrimary}
                onClick={() => {
                  setViewUserModalOpen(false);
                  handleOpenEdit(viewingUser);
                }}
              >
                Düzenle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
