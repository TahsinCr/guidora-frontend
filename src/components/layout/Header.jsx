import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Plus, Bell, Sun, Moon, ChevronRight, ShieldCheck } from 'lucide-react';
import UserMenu from './UserMenu';
import LanguageDropdown from './LanguageDropdown';
import AmbientStatusBar from './AmbientStatusBar';
import styles from './Header.module.scss';

export default function Header({
  currentUser,
  onResetSearch,
  activeTool,
  onBackToDirectory,
  onSelectCategory,
  onSubmitTool,
  onOpenProfile,
  onOpenAdmin,
  onOpenNotifications,
  onOpenAuth,
  onOpenSettings,
  onUserChange,
  isNavigating,
}) {
  const { theme, toggleTheme } = useTheme();
  const { t, translateCategory } = useLanguage();

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.header}>
        <div className={styles.leftSection}>
          <div className={styles.logo} onClick={onBackToDirectory || onResetSearch}>
            <div className={styles.logoIcon}>
              <img src="/logo.svg" alt="Guidora Logo" className={styles.figmaLogoImg} decoding="async" />
            </div>
            <span className={styles.logoText}>Guidora</span>
          </div>

          {activeTool && (
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <span
                className={styles.crumbItem}
                onClick={() => onSelectCategory && onSelectCategory(activeTool.categoryId || 'all')}
              >
                {translateCategory(activeTool.categoryId, activeTool.category || 'Generative AI')}
              </span>
              <ChevronRight size={13} className={styles.crumbSep} />
              <span className={styles.crumbCurrent}>{activeTool.name}</span>
            </nav>
          )}
        </div>

        <div className={styles.toolBar}>
          <button
            className={styles.submitBtn}
            onClick={onSubmitTool}
            title={t('header.submitTool', 'Submit Tool')}
          >
            <Plus size={15} />
            <span className={styles.btnText}>{t('header.submitTool', 'Submit Tool')}</span>
          </button>

          <button
            type="button"
            className={styles.adminTriggerBtn}
            onClick={onOpenAdmin}
            title="Admin Dashboard"
          >
            <ShieldCheck size={15} />
            <span className={styles.adminTriggerText}>Admin</span>
          </button>

          <LanguageDropdown />

          <button
            className={styles.iconBtn}
            onClick={toggleTheme}
            title={theme === 'dark' ? t('header.switchToLight', 'Switch to Light Mode') : t('header.switchToDark', 'Switch to Dark Mode')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={onOpenNotifications}
            title={t('header.notifications', 'Notifications')}
          >
            <Bell size={18} />
            <span className={styles.pinkDot} />
          </button>
          
          <UserMenu
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenAdmin={onOpenAdmin}
            onOpenSettings={onOpenSettings}
            onOpenAuth={onOpenAuth}
            onUserChange={onUserChange}
          />
        </div>
      </div>
      <AmbientStatusBar isNavigating={isNavigating} />
    </header>
  );
}
