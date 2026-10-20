import React, { useEffect, useState } from 'react';
import { FileText, Tag, Scale } from 'lucide-react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { fetchProductChangelogs, fetchProductMedia } from '@/services/api/productsApi';
import { useLanguage } from '@/context/LanguageContext';
import styles from './DocContent.module.scss';

export default function BackendDocContent({ tool, activeTab }) {
  const { t, translateTag } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const resource =
    activeTab === 'gallery'
      ? 'media'
      : activeTab === 'changelog'
      ? 'changelogs'
      : undefined;

  useEffect(() => {
    if (!tool?.numericId || !resource) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load =
      resource === 'media'
        ? fetchProductMedia(tool.numericId)
        : fetchProductChangelogs(tool.numericId);
    load
      .then((data) => {
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tool?.numericId, resource]);

  const overviewLead =
    tool?.overviewText?.lead ||
    tool?.description ||
    tool?.tagline ||
    `${tool?.name} is a high-performance software platform engineered for modern development workflows.`;
  const overviewDetail =
    tool?.overviewText?.detail ||
    `Designed to integrate cleanly with existing engineering toolchains, CI/CD pipelines, and collaborative workspaces.`;
  const keyFeatures = tool?.keyFeatures || [
    'Low-latency execution & real-time workspace synchronization',
    'Extensible CLI, REST API, and webhook automation hooks',
    'Enterprise-grade access control & modular configuration',
  ];
  const rawTags = (tool?.tags || [])
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.id))
    .filter(Boolean);
  const capabilities =
    tool?.capabilities?.length > 0
      ? tool.capabilities
      : rawTags.length > 0
      ? rawTags
      : ['Developer Tool', 'API Integration', 'Workflow Automation'];

  if (activeTab === 'gallery') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.gallery', 'Product Gallery')}</span>
        </h2>
        {loading ? (
          <p className={styles.paragraph}>Yükleniyor...</p>
        ) : items.length > 0 ? (
          <div className={styles.galleryGrid}>
            {items.map((m) => (
              <div key={m.mediaId || m.mediaUrl} className={styles.galleryPlaceholder}>
                <img
                  src={m.mediaUrl}
                  alt={m.mediaType || tool?.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            <div className={styles.galleryPlaceholder}>
              {t('tabs.galleryPreview1', 'Main Workspace Preview')}
            </div>
            <div className={styles.galleryPlaceholder}>
              {t('tabs.galleryPreview2', 'Canvas & Code Inspector')}
            </div>
          </div>
        )}
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
        {loading ? (
          <p className={styles.paragraph}>Yükleniyor...</p>
        ) : items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((entry) => (
              <div key={entry.changelogId || entry.version} className={styles.changelogItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className={styles.versionPill}>{entry.version}</span>
                  {entry.title && (
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {entry.title}
                    </strong>
                  )}
                  {entry.releaseDate && (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {new Date(entry.releaseDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <MarkdownRenderer content={entry.changes || ''} />
              </div>
            ))}
          </div>
        ) : tool?.changelog ? (
          <MarkdownRenderer content={tool.changelog} />
        ) : (
          <div className={styles.changelogItem}>
            <span className={styles.versionPill}>{tool?.version || 'v2.4.0'}</span>
            <p className={styles.paragraph}>
              Core performance improvements, expanded API/CLI integration hooks, and enhanced
              workspace reliability.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'license') {
    const lic = tool?.license || 'MIT / Commercial';
    const licText =
      tool?.licenseText ||
      (lic === 'MIT'
        ? `# MIT License\n\nCopyright (c) 2026 ${tool?.name}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to standard open source conditions.`
        : lic === 'Apache-2.0'
        ? `# Apache License 2.0\n\nCopyright (c) 2026 ${tool?.name}\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0`
        : `# ${lic} License\n\nAll rights reserved by ${tool?.name}. Use, modification, or distribution of this software and its documentation is governed under the ${lic} license policy.`);

    return (
      <div className={styles.contentCard}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="var(--accent-purple)" />
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('tabs.license', 'Software License & Legal Terms')}
            </h2>
          </div>
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '12px',
              background: 'rgba(138, 56, 245, 0.15)',
              color: 'var(--accent-purple)',
              fontSize: '12px',
              fontWeight: '700',
              border: '1px solid rgba(138, 56, 245, 0.3)',
            }}
          >
            {lic}
          </span>
        </div>
        <MarkdownRenderer content={licText} />
      </div>
    );
  }

  if (activeTab === 'alternatives') {
    const similarList = tool?.similarTools || [];
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>{t('tabs.alternatives', 'Direct Alternatives')}</span>
        </h2>
        <div className={styles.bulletList}>
          {similarList.map((sim, i) => (
            <div key={sim.id || i} className={styles.bulletItem}>
              <span className={styles.bulletDot}>•</span>
              <span>
                <strong>{sim.name}</strong> — {sim.category} ({sim.pricing})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: 'about'
  return (
    <div className={styles.cardsContainer}>
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>
            {tool?.readme
              ? t('tabs.docOverview', 'Documentation & Overview')
              : t('tabs.overview', 'Tool Overview')}
          </span>
        </h2>

        {tool?.readme ? (
          <MarkdownRenderer content={tool.readme} />
        ) : (
          <>
            <MarkdownRenderer content={overviewLead} />
            {overviewDetail && overviewDetail !== overviewLead && (
              <p className={styles.paragraph} style={{ marginTop: '10px' }}>
                {overviewDetail}
              </p>
            )}
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
                {translateTag(String(tag).toLowerCase().replace(/[^a-z0-9]/g, '-'), tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
