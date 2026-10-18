import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  X,
  Layers,
  Bot,
  Bold,
  Italic,
  Heading,
  Code2,
  List,
  Quote,
  Link,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Star,
  Eye,
  Award,
  Save,
  Scale,
  Loader2,
} from 'lucide-react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import TagPicker from '@/components/submit/TagPicker';
import { fetchGithubRepoData } from '@/services/toolsService';
import { CATEGORIES, TAG_CATEGORIES } from '@/services/mockData';
import { getOrganizations } from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ToolStudioForm.module.scss';

// SVG Icon for GitHub
function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// Reconstruct tag objects from tool data
function getInitialTags(initialData) {
  if (initialData?.tagObjects && initialData.tagObjects.length > 0) {
    return initialData.tagObjects;
  }

  const tags = [];
  const existingIds = new Set();

  const addTagObj = (id, name, catId, catName, only = false) => {
    if (!id || existingIds.has(id.toLowerCase())) return;
    existingIds.add(id.toLowerCase());
    tags.push({
      id: id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: name || id,
      tagCategoryId: catId,
      tagCategoryName: catName,
      only,
    });
  };

  // Check known platforms
  if (Array.isArray(initialData?.platforms)) {
    initialData.platforms.forEach((p) => {
      addTagObj(p, p, 'platform', 'Platform & Environment');
    });
  }

  // Check pricing
  if (initialData?.pricing) {
    addTagObj(initialData.pricing, initialData.pricing, 'pricing', 'Pricing & Licensing', true);
  }

  // Check license
  if (initialData?.license) {
    addTagObj(initialData.license, initialData.license, 'license', 'Software License', true);
  }

  // Check generic tags
  if (Array.isArray(initialData?.tags)) {
    initialData.tags.forEach((t) => {
      // Find matching in TAG_CATEGORIES if possible
      let matchedGroup = null;
      let matchedTag = null;
      for (const group of TAG_CATEGORIES) {
        const found = group.tags.find(
          (item) => item.id === t || item.name.toLowerCase() === t.toLowerCase()
        );
        if (found) {
          matchedGroup = group;
          matchedTag = found;
          break;
        }
      }

      if (matchedGroup && matchedTag) {
        addTagObj(
          matchedTag.id,
          matchedTag.name,
          matchedGroup.id,
          matchedGroup.name,
          matchedTag.only
        );
      } else {
        addTagObj(t, t, 'capabilities', 'Capabilities & Architecture');
      }
    });
  }

  // If empty, supply sensible defaults
  if (tags.length === 0) {
    return [
      { id: 'web', name: 'Web', tagCategoryId: 'platform', tagCategoryName: 'Platform & Environment' },
      { id: 'freemium', name: 'Freemium', only: true, tagCategoryId: 'pricing', tagCategoryName: 'Pricing & Licensing' },
    ];
  }

  return tags;
}

export default function ToolStudioForm({
  initialData = null,
  mode = 'create', // 'create' | 'admin'
  isModal = false,
  onSave,
  onCancel,
  isSubmitting = false,
}) {
  const { t, translateCategory } = useLanguage();

  // 1. Core Form State
  const [name, setName] = useState(initialData?.name || '');
  const [categoryId, setCategoryId] = useState(() => {
    if (initialData?.categoryId) return initialData.categoryId;
    if (initialData?.category) {
      const match = CATEGORIES.find(
        (c) =>
          c.id.toLowerCase() === initialData.category.toLowerCase() ||
          c.name.toLowerCase() === initialData.category.toLowerCase()
      );
      if (match) return match.id;
    }
    return 'generative-art';
  });
  const [tagline, setTagline] = useState(
    initialData?.description || initialData?.tagline || ''
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    initialData?.websiteUrl || initialData?.url || ''
  );
  const [organizations] = useState(getOrganizations());
  const [organizationId, setOrganizationId] = useState(
    initialData?.organizationId || 'org_neurolabs'
  );
  const [selectedTags, setSelectedTags] = useState(() => getInitialTags(initialData));

  // 2. Bot Sync Hook Settings
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '');
  const [syncFrequency, setSyncFrequency] = useState(
    initialData?.syncFrequency || 'Daily'
  );

  // 3. GitHub Auto-fetch State
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '');
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [repoFetchStatus, setRepoFetchStatus] = useState(null);

  // 4. Markdown Studio State
  const [activeDoc, setActiveDoc] = useState('readme'); // 'readme' | 'changelog' | 'license'
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'
  const [readmeContent, setReadmeContent] = useState(
    initialData?.readme ||
      `# Overview\n\nDescribe how your tool works, its architecture, and real-world developer use cases.\n\n### Key Features\n- High-throughput neural processing\n- Native API & SDK integrations\n- Enterprise privacy & compliance`
  );
  const [changelogContent, setChangelogContent] = useState(
    initialData?.changelog ||
      `# Release History\n\n## v1.0.0 (Initial Release)\n- Core platform release with web interface and REST API.\n- Multi-tenant workspace support.\n- Real-time streaming token completions.`
  );
  const [licenseType, setLicenseType] = useState(initialData?.license || 'MIT');
  const [licenseContent, setLicenseContent] = useState(
    initialData?.licenseText ||
      `# ${initialData?.license || 'MIT'} License\n\nCopyright (c) 2026 ${initialData?.name || initialData?.slug || 'Tool Authors'}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so.`
  );

  // 5. Admin Specific Controls (Trust & Metrics)
  const [adminVerified, setAdminVerified] = useState(
    Boolean(initialData?.adminVerified || initialData?.verified)
  );
  const [communityChoice, setCommunityChoice] = useState(
    Boolean(initialData?.communityChoice)
  );
  const [botAudited, setBotAudited] = useState(
    Boolean(initialData?.botAudited)
  );
  const [featured, setFeatured] = useState(
    Boolean(initialData?.featured)
  );
  const [rating, setRating] = useState(initialData?.rating ?? 4.8);
  const [monthlyVisits, setMonthlyVisits] = useState(
    initialData?.monthlyVisits || '1.2M'
  );
  const [rank, setRank] = useState(initialData?.rank || 1);

  // Form error state
  const [errorMsg, setErrorMsg] = useState('');

  // Scroll to top on mount when not in modal
  useEffect(() => {
    if (!isModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isModal]);

  // GitHub Auto-fetch handler
  const handleFetchGithub = async () => {
    if (!repoUrl.trim()) return;
    setIsFetchingRepo(true);
    setRepoFetchStatus(null);
    setErrorMsg('');

    try {
      const data = await fetchGithubRepoData(repoUrl);
      if (data.name && !name) setName(data.name);
      if (data.description && !tagline) setTagline(data.description);
      if (data.website && !websiteUrl) setWebsiteUrl(data.website);
      if (data.readme) setReadmeContent(data.readme);
      if (data.changelog) setChangelogContent(data.changelog);

      // Map topics to tags if available
      if (data.topics && data.topics.length > 0) {
        const mappedTags = data.topics.map((top) => ({
          id: top.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: top.charAt(0).toUpperCase() + top.slice(1),
          tagCategoryId: 'capabilities',
          tagCategoryName: 'Capabilities & Architecture',
        }));
        setSelectedTags((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          const additions = mappedTags.filter((mt) => !ids.has(mt.id));
          return [...prev, ...additions];
        });
      }

      setRepoFetchStatus({
        type: 'success',
        message: `Synced ${data.name} (${data.stars?.toLocaleString() || 0}★) from GitHub!`,
      });
    } catch (err) {
      setRepoFetchStatus({
        type: 'error',
        message: err.message || 'Failed to fetch GitHub repository data.',
      });
    } finally {
      setIsFetchingRepo(false);
    }
  };

  // Markdown Toolbar Injection
  const handleInsertMarkdown = (prefix, suffix = '') => {
    const isReadme = activeDoc === 'readme';
    const current = isReadme ? readmeContent : changelogContent;
    const setter = isReadme ? setReadmeContent : setChangelogContent;

    const textarea = document.getElementById('studio-markdown-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    setter(current.substring(0, start) + replacement + current.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 0);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify a tool name.');
      return;
    }
    if (!tagline.trim()) {
      setErrorMsg('Please enter a brief summary tagline.');
      return;
    }

    setErrorMsg('');

    try {
      // Find primary pricing and license from selected tags
      const pricingTag =
        selectedTags.find((t) => t.tagCategoryId === 'pricing')?.name || 'Freemium';
      const licenseTag =
        selectedTags.find((t) => t.tagCategoryId === 'license')?.name || 'MIT';
      const platformTags = selectedTags
        .filter((t) => t.tagCategoryId === 'platform')
        .map((t) => t.name);

      const selectedOrg = organizations.find((o) => o.id === organizationId);

      const payload = {
        name: name.trim(),
        categoryId,
        category: CATEGORIES.find((c) => c.id === categoryId)?.name || 'Generative AI',
        description: tagline.trim(),
        websiteUrl: websiteUrl.trim(),
        organizationId: selectedOrg?.id || null,
        creatorName: selectedOrg
          ? selectedOrg.name
          : initialData?.creatorName || `${name.trim()} Labs`,
        creatorInitials: selectedOrg
          ? selectedOrg.initials
          : initialData?.creatorInitials || name.trim().slice(0, 2).toUpperCase(),
        creatorVerified: selectedOrg ? !!selectedOrg.verified : adminVerified,
        pricing: pricingTag,
        license: licenseType || licenseTag || 'MIT',
        licenseText: licenseContent,
        platforms: platformTags.length > 0 ? platformTags : ['Web'],
        tags: selectedTags.map((t) => t.id),
        tagObjects: selectedTags,
        repoUrl: repoUrl.trim(),
        readme: readmeContent,
        changelog: changelogContent,
        webhookUrl: webhookUrl.trim(),
        syncFrequency,
        ...(mode === 'admin'
          ? {
              adminVerified,
              verified: adminVerified,
              communityChoice,
              botAudited,
              featured,
              rating: Number(rating),
              monthlyVisits: String(monthlyVisits),
              rank: Number(rank),
            }
          : {}),
      };

      if (onSave) {
        await onSave(payload);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check inputs.');
    }
  };

  // Filter categories for dropdown (exclude 'all')
  const validCategories = CATEGORIES.filter((c) => c.id !== 'all');

  // Form markup
  const formContent = (
    <form className={styles.studioForm} onSubmit={handleSubmit}>
      {/* Scrollable area for grid */}
      <div className={styles.studioScrollArea}>
        {/* GitHub Import Strip */}
        <section className={styles.githubStrip} aria-label="GitHub Repository Sync">
          <div className={styles.githubBar}>
            <div className={styles.githubIconBox}>
              <GithubIcon size={18} />
            </div>
            <div className={styles.githubInputWrap}>
              <input
                type="text"
                className={styles.githubInput}
                placeholder="https://github.com/owner/repo or owner/repo (e.g. vllm-project/vllm)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchGithub();
                  }
                }}
              />
            </div>
            <button
              type="button"
              className={styles.fetchBtn}
              onClick={handleFetchGithub}
              disabled={isFetchingRepo || !repoUrl.trim()}
            >
              {isFetchingRepo ? (
                <span>{t('submit.fetching', 'Fetching Data...')}</span>
              ) : (
                <>
                  <GithubIcon size={15} />
                  <span>{t('submit.fetchRepo', 'Fetch Repo Data')}</span>
                </>
              )}
            </button>
          </div>

          {repoFetchStatus && (
            <div
              className={`${styles.fetchStatusAlert} ${
                repoFetchStatus.type === 'success'
                  ? styles.statusSuccess
                  : styles.statusError
              }`}
            >
              {repoFetchStatus.type === 'success' ? (
                <CheckCircle2 size={15} />
              ) : (
                <AlertCircle size={15} />
              )}
              <span>{repoFetchStatus.message}</span>
            </div>
          )}
        </section>

        {/* 2-Column Studio Grid */}
        <div className={styles.studioGrid}>
          {/* Left Column (Specifications & Taxonomy & Admin) */}
          <div className={styles.leftColumn}>
            <div className={styles.sectionHeader}>
              <Layers size={16} className={styles.sectionIcon} />
              <span>TOOL SPECIFICATIONS</span>
            </div>

            {/* Tool Name & Category Row */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t('submit.toolName', 'Tool Name')} *
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. NeuroGen Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t('submit.category', 'Category')} *
                </label>
                <select
                  className={styles.selectInput}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {validCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {translateCategory(c.id, c.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Short Tagline */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t('submit.tagline', 'Short Tagline / Summary')} *
              </label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Real-time generative orchestration for design & code workflows"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                required
              />
            </div>

            {/* Website URL & Creator */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t('submit.websiteUrl', 'Website URL')}
                </label>
                <input
                  type="url"
                  className={styles.textInput}
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t('tool.createdBy', 'Organization / Creator')}
                  <span className={styles.labelHint}>
                    (Admin or Bot Verified)
                  </span>
                </label>
                <select
                  className={styles.selectInput}
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                >
                  <option value="">Independent Creator / Self-published</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.verified ? '✓ (Verified)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Software License Specification */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Scale size={13} color="var(--accent-purple)" />
                  <span>{t('tool.license', 'Software License')}</span>
                </label>
                <select
                  className={styles.selectInput}
                  value={licenseType}
                  onChange={(e) => {
                    const newLic = e.target.value;
                    setLicenseType(newLic);
                    if (
                      !licenseContent ||
                      licenseContent.startsWith('# MIT') ||
                      licenseContent.startsWith('# Apache') ||
                      licenseContent.startsWith('# GNU') ||
                      licenseContent.startsWith('# Proprietary') ||
                      licenseContent.startsWith('# BSD') ||
                      licenseContent.startsWith('# Commercial')
                    ) {
                      if (newLic === 'Proprietary') {
                        setLicenseContent(
                          `# Proprietary License\n\nAll rights reserved. Copyright (c) 2026 ${name.trim() || 'Tool Authors'}.\nUnauthorized copying, distribution, or decompilation is strictly prohibited.`
                        );
                      } else if (newLic === 'Commercial') {
                        setLicenseContent(
                          `# Commercial License\n\nCopyright (c) 2026 ${name.trim() || 'Tool Authors'}.\nLicensed for commercial use per enterprise contract agreement.`
                        );
                      } else if (newLic === 'Apache-2.0') {
                        setLicenseContent(
                          `# Apache License 2.0\n\nCopyright (c) 2026 ${name.trim() || 'Tool Authors'}\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.`
                        );
                      } else if (newLic === 'GPL-3.0') {
                        setLicenseContent(
                          `# GNU General Public License v3.0\n\nCopyright (c) 2026 ${name.trim() || 'Tool Authors'}\n\nThis program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License.`
                        );
                      } else if (newLic === 'BSD-3-Clause') {
                        setLicenseContent(
                          `# BSD 3-Clause License\n\nCopyright (c) 2026 ${name.trim() || 'Tool Authors'}\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met...`
                        );
                      } else if (newLic === 'MIT') {
                        setLicenseContent(
                          `# MIT License\n\nCopyright (c) 2026 ${name.trim() || 'Tool Authors'}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software")...`
                        );
                      }
                    }
                  }}
                >
                  <option value="MIT">MIT License</option>
                  <option value="Apache-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPL v3.0</option>
                  <option value="BSD-3-Clause">BSD 3-Clause</option>
                  <option value="MPL-2.0">Mozilla Public License 2.0</option>
                  <option value="Proprietary">Proprietary / Closed Source</option>
                  <option value="Commercial">Commercial Enterprise</option>
                  <option value="Custom">Custom License Terms</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span>{t('tool.licenseDetails', 'License Document')}</span>
                  <span className={styles.labelHint}>(Markdown Studio)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: activeDoc === 'license' ? 'rgba(138, 56, 245, 0.2)' : 'var(--bg-input)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: activeDoc === 'license' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveDoc('license')}
                  >
                    <Scale size={13} />
                    <span>{t('tool.editLicenseMd', 'Open License in Markdown Tab')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hierarchical Tag System Component */}
            <TagPicker
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />

            {/* Admin Controls Card (When mode === 'admin') */}
            {mode === 'admin' && (
              <div className={styles.adminControlsCard}>
                <div className={styles.adminCardHeader}>
                  <ShieldCheck size={16} color="#8a38f5" />
                  <span className={styles.adminCardTitle}>
                    Admin Trust & Spotlight Controls
                  </span>
                </div>

                <div className={styles.badgeGrid}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={adminVerified}
                      onChange={(e) => setAdminVerified(e.target.checked)}
                    />
                    <span>Admin Verified</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={communityChoice}
                      onChange={(e) => setCommunityChoice(e.target.checked)}
                    />
                    <span>Community Choice</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={botAudited}
                      onChange={(e) => setBotAudited(e.target.checked)}
                    />
                    <span>Technical Audit</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    <span>Featured in Spotlight</span>
                  </label>
                </div>

                <div className={styles.inputRow} style={{ marginTop: '6px' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Rating (0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      className={styles.textInput}
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Monthly Visits</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={monthlyVisits}
                      placeholder="e.g. 1.2M"
                      onChange={(e) => setMonthlyVisits(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bot Hook Automation Card */}
            <div className={styles.botCard}>
              <div className={styles.botCardHeader}>
                <Bot size={16} className={styles.botIcon} />
                <span className={styles.botTitle}>Automated Bot Sync Hook</span>
              </div>
              <p className={styles.botDesc}>
                Configure webhooks for Guidora bots to periodically inspect your
                documentation and update your tool listing automatically.
              </p>
              <div className={styles.botInputRow}>
                <input
                  type="url"
                  className={styles.botTextInput}
                  placeholder="Webhook URL (e.g. https://api.site.com/hook)"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <select
                  className={styles.botSelect}
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value)}
                >
                  <option value="Hourly">Sync Hourly</option>
                  <option value="Daily">Sync Daily</option>
                  <option value="OnPush">Sync On Push</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column (Markdown Studio) */}
          <div className={styles.rightColumn}>
            <div className={styles.markdownStudio}>
              {/* Document & Mode Switcher Bar */}
              <div className={styles.studioTopBar}>
                <div className={styles.docTabs}>
                  <button
                    type="button"
                    className={`${styles.docTabBtn} ${
                      activeDoc === 'readme' ? styles.docTabActive : ''
                    }`}
                    onClick={() => setActiveDoc('readme')}
                  >
                    <span>README / Overview</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.docTabBtn} ${
                      activeDoc === 'changelog' ? styles.docTabActive : ''
                    }`}
                    onClick={() => setActiveDoc('changelog')}
                  >
                    <span>Release Changelog</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.docTabBtn} ${
                      activeDoc === 'license' ? styles.docTabActive : ''
                    }`}
                    onClick={() => setActiveDoc('license')}
                  >
                    <span>License ({licenseType})</span>
                  </button>
                </div>

                <div className={styles.modeTabs}>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${
                      editorMode === 'write' ? styles.modeActive : ''
                    }`}
                    onClick={() => setEditorMode('write')}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${
                      editorMode === 'preview' ? styles.modeActive : ''
                    }`}
                    onClick={() => setEditorMode('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar (when in Write mode) */}
              {editorMode === 'write' && (
                <div className={styles.editorToolbar}>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('**', '**')}
                    title="Bold (**text**)"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('*', '*')}
                    title="Italic (*text*)"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('### ')}
                    title="Heading 3 (### )"
                  >
                    <Heading size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('`', '`')}
                    title="Inline Code (`code`)"
                  >
                    <Code2 size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('- ')}
                    title="Unordered List (- )"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('> ')}
                    title="Quote Block (> )"
                  >
                    <Quote size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={() => handleInsertMarkdown('[Link Text](', ')')}
                    title="Insert Hyperlink"
                  >
                    <Link size={14} />
                  </button>
                  <span className={styles.syntaxHint}>
                    Markdown syntax supported
                  </span>
                </div>
              )}

              {/* Editor or Live Preview Area */}
              <div className={styles.studioContentArea}>
                {editorMode === 'write' ? (
                  <textarea
                    id="studio-markdown-textarea"
                    className={styles.markdownEditor}
                    value={
                      activeDoc === 'readme'
                        ? readmeContent
                        : activeDoc === 'changelog'
                        ? changelogContent
                        : licenseContent
                    }
                    onChange={(e) => {
                      if (activeDoc === 'readme') {
                        setReadmeContent(e.target.value);
                      } else if (activeDoc === 'changelog') {
                        setChangelogContent(e.target.value);
                      } else {
                        setLicenseContent(e.target.value);
                      }
                    }}
                    placeholder={
                      activeDoc === 'readme'
                        ? '# Overview\n\nExplain how your tool operates...'
                        : activeDoc === 'changelog'
                        ? '# Changelog\n\n## v1.0.0\n- Release notes...'
                        : '# Software License\n\nLicense terms and conditions...'
                    }
                  />
                ) : (
                  <div className={styles.markdownPreviewWrap}>
                    <MarkdownRenderer
                      content={
                        activeDoc === 'readme'
                          ? readmeContent
                          : activeDoc === 'changelog'
                          ? changelogContent
                          : licenseContent
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className={styles.errorBanner}>
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sticky Bottom Action Footer */}
      <footer className={styles.studioFooter}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting || !name.trim() || !tagline.trim()}
        >
          {mode === 'admin' ? (
            <>
              <Save size={16} />
              <span>
                {isSubmitting
                  ? t('admin.saving', 'Kaydediliyor...')
                  : t('admin.saveToolChanges', 'Değişiklikleri Kaydet')}
              </span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>
                {isSubmitting
                  ? 'Registering Tool...'
                  : 'Submit Tool to Directory'}
              </span>
            </>
          )}
        </button>
      </footer>
    </form>
  );

  // When rendering as a Modal Popup Dialog
  if (isModal) {
    return (
      <div
        className={styles.modalBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) onCancel();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalDialogCard}>
          <header className={styles.studioHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIconBox}>
                <Wrench size={20} />
              </div>
              <div className={styles.headerTitles}>
                <h2 className={styles.mainTitle}>
                  <span>
                    {initialData
                      ? `${t('admin.editToolStudio', 'Tool Studio')}: ${initialData.name}`
                      : t('admin.addTool', 'Add New Tool')}
                  </span>
                  <span className={styles.modeBadge}>
                    {mode === 'admin' ? 'Admin Mode' : 'Studio'}
                  </span>
                </h2>
                <p className={styles.subTitle}>
                  {t(
                    'admin.editToolStudioDesc',
                    'Full platform studio: GitHub sync, taxonomy, trust audit credentials, and live Markdown docs.'
                  )}
                </p>
              </div>
            </div>
            {onCancel && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onCancel}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            )}
          </header>

          {formContent}
        </div>
      </div>
    );
  }

  // When rendering as a standalone Page
  return (
    <div className={styles.standaloneContainer}>
      {/* Top Breadcrumb Navigation Bar */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb Navigation">
        <button
          className={styles.backBtn}
          onClick={onCancel}
          title={t('header.backToDirectory', 'Back to Directory')}
        >
          <ArrowLeft size={16} />
          <span>{t('header.backToDirectory', 'Back to Directory')}</span>
        </button>
        <span className={styles.crumbDivider}>/</span>
        <span className={styles.crumbActive}>
          {t('submit.title', 'Submit Software Tool')}
        </span>
      </nav>

      {/* Main Studio Frame */}
      <div className={styles.studioCard}>
        <header className={styles.studioHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <Sparkles size={22} />
            </div>
            <div className={styles.headerTitles}>
              <h1 className={styles.mainTitle}>
                {t('submit.title', 'Add AI Tool to Directory')}
              </h1>
              <p className={styles.subTitle}>
                {t(
                  'submit.subtitle',
                  'Register your AI platform with automated GitHub synchronization, hierarchical tag taxonomy, and live Markdown documentation.'
                )}
              </p>
            </div>
          </div>
        </header>

        {formContent}
      </div>
    </div>
  );
}

