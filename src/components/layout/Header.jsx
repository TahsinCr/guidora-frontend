import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Bell, Sun, Moon, Sparkles, ChevronRight, Search } from 'lucide-react';
import styles from './Header.module.scss';

export default function Header({
  onResetSearch,
  activeTool,
  onBackToDirectory,
  onSelectCategory,
  onSubmitTool,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.headerWrapper}>
      <div className={styles.header}>
        <div className={styles.leftSection}>
          <div className={styles.logo} onClick={onBackToDirectory || onResetSearch}>
            <div className={styles.logoIcon}>
              <Sparkles size={20} />
            </div>
            <span className={styles.logoText}>Guidora</span>
          </div>

          {activeTool && (
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <span
                className={styles.crumbItem}
                onClick={() => onSelectCategory && onSelectCategory(activeTool.categoryId || 'all')}
              >
                {activeTool.category || 'Generative AI'}
              </span>
              <ChevronRight size={13} className={styles.crumbSep} />
              <span className={styles.crumbCurrent}>{activeTool.name}</span>
            </nav>
          )}
        </div>

        <div className={styles.toolBar}>
          {activeTool ? (
            <>
              <button
                className={styles.iconBtn}
                onClick={onBackToDirectory}
                title="Search Tools"
              >
                <Search size={18} />
              </button>

              <button
                className={styles.submitBtn}
                onClick={onSubmitTool}
                title="Submit a new tool"
              >
                <Plus size={15} />
                <span className={styles.btnText}>Submit Tool</span>
              </button>

              <button
                className={styles.iconBtn}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className={styles.userAvatar} title="User Profile">
                US
              </div>
            </>
          ) : (
            <>
              <button
                className={styles.submitBtn}
                onClick={onSubmitTool}
                title="Submit a new tool"
              >
                <Plus size={15} />
                <span className={styles.btnText}>Submit Tool</span>
              </button>

              <button
                className={styles.iconBtn}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button className={styles.iconBtn} title="Notifications">
                <Bell size={18} />
                <span className={styles.pinkDot} />
              </button>

              <div className={styles.userAvatar} title="User Profile">
                US
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
