import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  UserCheck,
  Ban,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
} from 'lucide-react';
import {
  adminCreateUser,
  adminUpdateUserRole,
  adminDeleteUser,
  adminUpdateUserDetails,
} from '@/services/userService';
import { adminAddLog } from '@/services/adminService';
import styles from '../AdminDashboardPage.module.scss';

export default function UsersTab({
  users = [],
  onRefreshUsers,
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // New User Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('member');
  const [editTitle, setEditTitle] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const n = (u.name || '').toLowerCase();
        const un = (u.username || '').toLowerCase();
        const em = (u.email || '').toLowerCase();
        if (!n.includes(q) && !un.includes(q) && !em.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  // Handle Add User
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      alert('İsim, kullanıcı adı ve e-posta zorunludur.');
      return;
    }

    try {
      adminCreateUser({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
        password: password || 'GuidoraPass123!',
      });
      adminAddLog('USER_CREATED', `${name} (@${username})`, 'success', {
        entityName: 'User',
        category: 'AUTH',
      });
      setAddUserModalOpen(false);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      alert('Kullanıcı oluşturma hatası: ' + err.message);
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
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      alert('Rol güncelleme hatası: ' + err.message);
    }
  };

  // Handle Ban / Unban
  const handleToggleBan = (user) => {
    const nextBan = !user.isBanned;
    try {
      adminUpdateUserDetails(user.id, { isBanned: nextBan });
      adminAddLog(nextBan ? 'USER_BANNED' : 'USER_UNBANNED', user.name, nextBan ? 'error' : 'info', {
        entityName: 'User',
        entityId: user.id,
        category: 'GOVERNANCE',
      });
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      alert('İşlem hatası: ' + err.message);
    }
  };

  // Open Edit User
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'member');
    setEditTitle(user.title || '');
    setEditUserModalOpen(true);
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
      });
      adminAddLog('USER_DETAILS_UPDATED', editName, 'info', {
        entityName: 'User',
        entityId: editingUser.id,
        category: 'AUTH',
      });
      setEditUserModalOpen(false);
      setEditingUser(null);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      alert('Güncelleme hatası: ' + err.message);
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="İsim, @kullanıcı veya e-posta ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Role Göre Filtrele"
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Admin (Yönetici)</option>
              <option value="moderator">Moderator (Moderatör)</option>
              <option value="creator">Creator (İçerik Üretici)</option>
              <option value="member">Member (Üye)</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className={styles.actionBtnPrimary}
          onClick={() => setAddUserModalOpen(true)}
        >
          <Plus size={16} />
          <span>Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Users Data Grid */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Kullanıcı (Profil & Hesap)</th>
                <th>Rol</th>
                <th>İtibar Puanı</th>
                <th>Kayıt Tarihi</th>
                <th>Hesap Durumu</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.isBanned ? styles.rowDeleted : ''}>
                  <td>
                    <div className={styles.userIdentityCell}>
                      <div className={styles.userAvatarSquare}>
                        {user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'U')}
                      </div>
                      <div>
                        <div className={styles.userNameTitle}>
                          <strong>{user.name}</strong>
                          <span className={styles.userHandle}>@{user.username}</span>
                        </div>
                        <span className={styles.userEmailText}>{user.email}</span>
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
                      {user.reputation ?? 100} pts
                    </span>
                  </td>
                  <td>
                    <span className={styles.joinedDateText}>
                      {user.joinedDate || 'Eylül 2024'}
                    </span>
                  </td>
                  <td>
                    <span className={user.isBanned ? styles.bannedBadge : styles.activeBadge}>
                      {user.isBanned ? 'Yasaklı (Banned)' : 'Aktif (Normal)'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.rowActionsRight}>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => handleOpenEdit(user)}
                        title="Kullanıcı Detaylarını Düzenle"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className={user.isBanned ? styles.actionIconBtnSuccess : styles.actionIconBtnDanger}
                        onClick={() => handleToggleBan(user)}
                        title={user.isBanned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                      >
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              >
                ✕
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
                <button type="submit" className={styles.confirmBtn}>
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
              >
                ✕
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
                <button type="submit" className={styles.confirmBtn}>
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
