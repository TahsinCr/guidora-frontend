import { FileText, Tag, CheckCircle2, Scale } from 'lucide-react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import ReviewsTab from './ReviewsTab';
import { useLanguage } from '@/context/LanguageContext';
import styles from './DocContent.module.scss';

export default function DocContent({ tool, activeTab, onReviewCountChange }) {
  const { t, translateTag } = useLanguage();
  const overviewLead = tool.overviewText?.lead || `${tool.name} is a cutting-edge platform designed to bridge the gap between creative ideation and final production. Unlike standard LLM wrappers, ${tool.name} provides a context-aware workspace where your code repositories, design assets, and marketing guidelines live together.`;
  const overviewDetail = tool.overviewText?.detail || `Whether you are a developer looking to auto-generate unit tests or a marketer crafting a month's worth of social content, our fine-tuned models adapt to your specific brand voice and coding standards.`;
  const keyFeatures = tool.keyFeatures || [
    'Unified Context Window (100k token memory)',
    'Multi-Modal Pipeline (Image to Code)',
    'Real-time Team Sync & Collaboration',
  ];
  const capabilities = tool.capabilities || [
    'Text Generation',
    'Image Synthesis',
    'Code Completion',
    'Data Analysis',
    'Workflow Automation',
    'Semantic Search',
  ];

  if (activeTab === 'gallery') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.gallery', 'Product Gallery')}</span>
        </h2>
        <div className={styles.galleryGrid}>
          <div className={styles.galleryPlaceholder}>{t('tabs.galleryPreview1', 'Main Workspace Preview')}</div>
          <div className={styles.galleryPlaceholder}>{t('tabs.galleryPreview2', 'Canvas & Code Inspector')}</div>
        </div>
      </div>
    );
  }

  if (activeTab === 'changelog') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.changelog', 'Release Changelog')}</span>
        </h2>
        {tool.changelog ? (
          <MarkdownRenderer content={tool.changelog} />
        ) : (
          <div className={styles.changelogItem}>
            <span className={styles.versionPill}>{tool.version || 'v2.4.1'}</span>
            <p className={styles.paragraph}>
              Added multi-modal image-to-code pipelines, expanded memory window to 100k tokens, and improved collaborative sync performance.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'license') {
    const lic = tool.license || 'Proprietary';
    const licText = tool.licenseText || (
      tool.license === 'MIT'
        ? `# MIT License\n\nCopyright (c) 2026 ${tool.name}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to standard open source conditions.`
        : tool.license === 'Apache-2.0'
        ? `# Apache License 2.0\n\nCopyright (c) 2026 ${tool.name}\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0`
        : `# ${lic} License\n\nAll rights reserved by ${tool.name}. Use, modification, or distribution of this software and its documentation is governed under the ${lic} license policy.`
    );

    return (
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {t('tabs.license', 'Software License & Legal Terms')}
            </h2>
          </div>
          <span style={{ padding: '3px 12px', borderRadius: '12px', background: 'rgba(138, 56, 245, 0.15)', color: 'var(--accent-purple)', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(138, 56, 245, 0.3)' }}>
            {lic}
          </span>
        </div>
        <MarkdownRenderer content={licText} />
      </div>
    );
  }

  if (activeTab === 'reviews') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.reviews', 'Community Reviews')}</span>
        </h2>
        <ReviewsTab toolId={tool.id} onReviewCountChange={onReviewCountChange} />
      </div>
    );
  }

  if (activeTab === 'alternatives') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.alternatives', 'Direct Alternatives')}</span>
        </h2>
        <div className={styles.bulletList}>
          {(tool.similarTools || []).map((sim, i) => (
            <div key={i} className={styles.bulletItem}>
              <span className={styles.bulletDot}>•</span>
              <span><strong>{sim.name}</strong> - {sim.category} ({sim.pricing})</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: 'about' / About & Details
  return (
    <div className={styles.cardsContainer}>
      {/* 1. Tool Overview / Readme Card */}
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{tool.readme ? t('tabs.docOverview', 'Documentation & Overview') : t('tabs.overview', 'Tool Overview')}</span>
        </h2>

        {tool.readme ? (
          <MarkdownRenderer content={tool.readme} />
        ) : (
          <>
            <p className={styles.paragraph}>
              {overviewLead}
            </p>

            <p className={styles.paragraph}>
              {overviewDetail}
            </p>

            <div className={styles.featuresSection}>
              <h3 className={styles.subHeading}>{t('tabs.keyFeatures', 'Key Features')}</h3>
              <div className={styles.bulletList}>
                {keyFeatures.map((feat, idx) => (
                  <div key={idx} className={styles.bulletItem}>
                    <span className={styles.bulletDot}>•</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Classifications & Tags Card */}
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <Tag size={18} className={styles.headerIcon} />
          <span>{t('tabs.classificationsAndTags', 'Classifications & Tags')}</span>
        </h2>

        <div className={styles.tagsSection}>
          <span className={styles.tagsLabel}>{t('tabs.capabilities', 'Core Capabilities')}</span>
          <div className={styles.tagsList}>
            {capabilities.map((tag, idx) => (
              <span key={idx} className={styles.tagPill}>
                {translateTag(tag.toLowerCase().replace(/[^a-z0-9]/g, '-'), tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
