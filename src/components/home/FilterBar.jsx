import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, ShieldCheck, Sparkles, Bot, X } from 'lucide-react';
import styles from './FilterBar.module.scss';

export default function FilterBar({
  verification = { admin: false, community: false, bot: false },
  onVerificationChange,
  filterPricing,
  onFilterPricingChange,
  platform = 'all',
  onPlatformChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
}) {
  const [isPricingOpen, setIsPricingOpen] = useState(true);
  const [isPlatformOpen, setIsPlatformOpen] = useState(true);

  return (
    <aside className={`${styles.sidebar} ${isOpenMobile ? styles.mobileOpen : ''}`}>
      <div className={styles.topBar}>
        <span className={styles.title}>Filters</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className={styles.resetBtn} onClick={onResetFilters}>
            Reset All
          </button>
          <button className={styles.closeMobileBtn} onClick={onCloseMobile} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* VERIFICATION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>Verification</span>
        </div>
        <div className={styles.optionsList}>
          <div
            className={styles.checkboxItem}
            onClick={() =>
              onVerificationChange &&
              onVerificationChange({ ...verification, admin: !verification.admin })
            }
          >
            <div className={`${styles.squareBox} ${verification.admin ? styles.checked : ''}`}>
              {verification.admin && <Check size={12} strokeWidth={3} />}
            </div>
            <ShieldCheck size={16} color="#EAB308" />
            <span className={styles.label}>Admin Verified</span>
          </div>

          <div
            className={styles.checkboxItem}
            onClick={() =>
              onVerificationChange &&
              onVerificationChange({ ...verification, community: !verification.community })
            }
          >
            <div className={`${styles.squareBox} ${verification.community ? styles.checked : ''}`}>
              {verification.community && <Check size={12} strokeWidth={3} />}
            </div>
            <Sparkles size={16} color="#10B981" />
            <span className={styles.label}>Community Choice</span>
          </div>

          <div
            className={styles.checkboxItem}
            onClick={() =>
              onVerificationChange &&
              onVerificationChange({ ...verification, bot: !verification.bot })
            }
          >
            <div className={`${styles.squareBox} ${verification.bot ? styles.checked : ''}`}>
              {verification.bot && <Check size={12} strokeWidth={3} />}
            </div>
            <Bot size={16} color="#A855F7" />
            <span className={styles.label}>Bot Verified</span>
          </div>
        </div>
        <div className={styles.divider} />
      </div>

      {/* PRICING */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsPricingOpen(!isPricingOpen)}>
          <span>Pricing</span>
          {isPricingOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isPricingOpen && (
          <div className={styles.optionsList}>
            {['Free', 'Freemium', 'Paid / Enterprise'].map((p) => {
              const val = p.toLowerCase().split(' ')[0];
              const isChecked = filterPricing === val;

              return (
                <div
                  key={p}
                  className={styles.checkboxItem}
                  onClick={() => onFilterPricingChange(isChecked ? 'all' : val)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className={styles.label}>{p}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* PLATFORM */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsPlatformOpen(!isPlatformOpen)}>
          <span>Platform</span>
          {isPlatformOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isPlatformOpen && (
          <div className={styles.optionsList}>
            {['Web App', 'Mobile App', 'API', 'Extension'].map((plat) => {
              const val = plat.toLowerCase().replace(' ', '-');
              const isChecked = platform === val;

              return (
                <div
                  key={plat}
                  className={styles.checkboxItem}
                  onClick={() => onPlatformChange && onPlatformChange(isChecked ? 'all' : val)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className={styles.label}>{plat}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
