import React, { useState } from 'react';
import { ExternalLink, Bookmark, Plus, Star, CheckCircle2, ChevronRight } from 'lucide-react';
import styles from './ToolSidebar.module.scss';

export default function ToolSidebar({ tool, onSelectTool }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  const ratingValue = tool.rating ? Number(tool.rating).toFixed(1) : '4.8';
  const rankValue = tool.rank || '#4';
  const monthlyVisits = tool.monthlyVisits || '1.2M';
  const license = tool.license || 'Proprietary';

  const creator = tool.creator || {
    name: 'NeuroLabs Inc.',
    initials: 'NL',
    verified: true,
  };

  const similarTools = tool.similarTools || [
    { id: 'codewizard-ai', name: 'CodeWizard', category: 'Coding', pricing: 'Free' },
    { id: 'figma', name: 'DataMind', category: 'Analytics', pricing: 'Paid' },
  ];

  return (
    <aside className={styles.sidebarWrapper} aria-label="Tool Actions and Info">
      {/* 1. Rating & Action Card */}
      <div className={styles.card}>
        <div className={styles.scoreRow}>
          <div className={styles.ratingBox}>
            <span className={styles.scoreNumber}>{ratingValue}</span>
            <div className={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#EAB308" color="#EAB308" />
              ))}
            </div>
          </div>

          <div className={styles.rankBox}>
            <span className={styles.rankLabel}>RANK</span>
            <span className={styles.rankValue}>{rankValue}</span>
          </div>
        </div>

        {tool.websiteUrl ? (
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.visitWebsiteBtn}
          >
            <span>Visit Website</span>
            <ExternalLink size={16} />
          </a>
        ) : (
          <button className={styles.visitWebsiteBtn}>
            <span>Visit Website</span>
            <ExternalLink size={16} />
          </button>
        )}

        <div className={styles.secondaryActions}>
          <button
            className={`${styles.actionBtn} ${isSaved ? styles.active : ''}`}
            onClick={() => setIsSaved(!isSaved)}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            className={`${styles.actionBtn} ${isCompared ? styles.active : ''}`}
            onClick={() => setIsCompared(!isCompared)}
          >
            <Plus size={15} />
            <span>Compare</span>
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.metadataList}>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Monthly Visits</span>
            <span className={styles.metaVal}>{monthlyVisits}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>License</span>
            <span className={styles.metaVal}>{license}</span>
          </div>
        </div>
      </div>

      {/* 2. Creator Card */}
      <div className={styles.creatorCard}>
        <div className={styles.creatorAvatar}>{creator.initials || 'NL'}</div>
        <div className={styles.creatorInfo}>
          <span className={styles.creatorLabel}>CREATED BY</span>
          <div className={styles.creatorNameRow}>
            <span className={styles.creatorName}>{creator.name}</span>
            {creator.verified && (
              <CheckCircle2 size={14} color="#10B981" fill="rgba(16, 185, 129, 0.2)" />
            )}
          </div>
        </div>
        <ChevronRight size={16} className={styles.creatorChevron} />
      </div>

      {/* 3. Similar Tools Card */}
      <div className={styles.card}>
        <span className={styles.similarTitle}>SIMILAR TOOLS</span>
        <div className={styles.similarList}>
          {similarTools.map((sim, idx) => (
            <div
              key={idx}
              className={styles.similarItem}
              onClick={() => onSelectTool && onSelectTool(sim.id)}
            >
              <div className={styles.similarIcon} />
              <div className={styles.similarDetails}>
                <span className={styles.similarName}>{sim.name}</span>
                <span className={styles.similarSub}>
                  {sim.category} • {sim.pricing}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

