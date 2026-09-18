import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Eye,
  Edit3,
  Bold,
  Italic,
  Code,
  List,
  Link,
  Heading,
  Quote,
  CheckCircle2,
  AlertCircle,
  Bot,
  ExternalLink,
  Tag,
  Check,
  Layers,
  FileText,
} from 'lucide-react';
import { fetchGithubRepoData, addTool, getCategories } from '@/services/toolsService';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import styles from './SubmitToolModal.module.scss';

function GithubIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const ALL_PLATFORMS = ['Web', 'API', 'Mac', 'Windows', 'Linux', 'iOS', 'CLI'];

export default function SubmitToolModal({ isOpen, onClose, onToolCreated }) {
  const [categories, setCategories] = useState([]);

  // GitHub Auto-Fetch State
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('generative-art');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [pricing, setPricing] = useState('Freemium');
  const [platforms, setPlatforms] = useState(['Web', 'API']);
  const [creatorName, setCreatorName] = useState('');
  const [license, setLicense] = useState('MIT');

  // Markdown Editor State
  const [editorTab, setEditorTab] = useState('write'); // 'write' | 'preview'
  const [docType, setDocType] = useState('readme'); // 'readme' | 'changelog'
  const [readme, setReadme] = useState(
    `# Overview\n\nDescribe how your tool works, its architecture, and real-world developer use cases.\n\n### Key Features\n- High-throughput neural processing\n- Native API & SDK integrations\n- Enterprise privacy & compliance`
  );
  const [changelog, setChangelog] = useState(
    `## v1.0.0 - Initial Release\n\n- Public directory release\n- Full multimodal inference support\n- Webhook sync engine enabled`
  );

  // Bot Hook State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('Daily');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats.filter((c) => c.id !== 'all'));
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFetchGithub = async (e) => {
    e?.preventDefault();
    if (!githubUrl.trim()) return;

    setIsFetchingGithub(true);
    setGithubStatus(null);

    try {
      const data = await fetchGithubRepoData(githubUrl);
      if (data.name) setName(data.name);
      if (data.description) setTagline(data.description);
      if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
      if (data.repoUrl) setRepoUrl(data.repoUrl);
      if (data.license) setLicense(data.license);
      if (data.ownerName) setCreatorName(data.ownerName);
      if (data.readme) setReadme(data.readme);
      if (data.changelog) setChangelog(data.changelog);

      setGithubStatus({
        type: 'success',
        message: `Successfully imported "${data.name}" (${data.stars?.toLocaleString() || 0} ★) • License: ${data.license} • README & Changelog populated.`,
      });
    } catch (err) {
      setGithubStatus({
        type: 'error',
        message: err.message || 'Could not reach repository. You can still fill fields manually.',
      });
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const insertMarkdownTag = (syntax, placeholder = '') => {
    const activeContent = docType === 'readme' ? readme : changelog;
    const setter = docType === 'readme' ? setReadme : setChangelog;

    let addition = '';
    if (syntax === 'bold') addition = `**${placeholder || 'bold text'}**`;
    if (syntax === 'italic') addition = `*${placeholder || 'italic text'}*`;
    if (syntax === 'code') addition = `\`${placeholder || 'code'}\``;
    if (syntax === 'heading') addition = `\n### ${placeholder || 'Heading'}\n`;
    if (syntax === 'list') addition = `\n- Feature 1\n- Feature 2\n- Feature 3\n`;
    if (syntax === 'quote') addition = `\n> ${placeholder || 'Important quote or note'}\n`;
    if (syntax === 'link') addition = `[Documentation](https://example.com)`;

    setter(activeContent + (activeContent ? '\n' : '') + addition);
  };

  const handlePlatformToggle = (plat) => {
    if (platforms.includes(plat)) {
      if (platforms.length > 1) {
        setPlatforms(platforms.filter((p) => p !== plat));
      }
    } else {
      setPlatforms([...platforms, plat]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await addTool({
        name: name.trim(),
        categoryId,
        description: tagline.trim(),
        websiteUrl: websiteUrl.trim(),
        repoUrl: repoUrl.trim() || githubUrl.trim(),
        pricing,
        platforms,
        creatorName: creatorName.trim() || `${name} Team`,
        license,
        readme,
        changelog,
        webhookUrl: webhookUrl.trim(),
        syncFrequency,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        if (onToolCreated) onToolCreated(created);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit tool:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Submit AI Platform & Tool</h2>
              <span className={styles.modalSubtitle}>
                Add to Guidora catalog. Sync from GitHub repository or configure manually.
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {submitSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={44} color="#10B981" />
            </div>
            <h3 className={styles.successHeading}>Tool Submitted to Directory!</h3>
            <p className={styles.successSub}>
              <strong>{name}</strong> has been indexed and added to the directory. Loading tool detail...
            </p>
          </div>
        ) : (
          <form className={styles.formContainer} onSubmit={handleSubmit}>
            {/* GitHub Import Banner */}
            <div className={styles.githubStrip}>
              <div className={styles.githubLabelRow}>
                <GithubIcon size={16} />
                <span className={styles.stripLabel}>Fast Import from GitHub (Optional)</span>
              </div>

              <div className={styles.githubActionRow}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.githubInput}
                    placeholder="https://github.com/owner/repo or owner/repo (e.g. facebook/react)"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
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
                  disabled={isFetchingGithub || !githubUrl.trim()}
                >
                  <Download size={14} />
                  <span>{isFetchingGithub ? 'Fetching...' : 'Fetch Repo Data'}</span>
                </button>
              </div>

              {githubStatus && (
                <div
                  className={`${styles.statusNotice} ${
                    githubStatus.type === 'success' ? styles.statusSuccess : styles.statusError
                  }`}
                >
                  {githubStatus.type === 'success' ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}
                  <span>{githubStatus.message}</span>
                </div>
              )}
            </div>

            {/* Main Studio Body: 2 Columns */}
            <div className={styles.studioBody}>
              {/* Left Column: Metadata & Form Controls */}
              <div className={styles.formColumn}>
                <div className={styles.sectionHeading}>
                  <Layers size={15} />
                  <span>Tool Specifications</span>
                </div>

                <div className={styles.twoColGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Tool Name *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. NeuroGen Studio"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Category *</label>
                    <select
                      className={styles.fieldSelect}
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Short Tagline / Summary *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Real-time generative orchestration for design & code workflows"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.twoColGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Website URL</label>
                    <input
                      type="url"
                      className={styles.fieldInput}
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Pricing Model</label>
                    <select
                      className={styles.fieldSelect}
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                    >
                      <option value="Free">Free</option>
                      <option value="Freemium">Freemium</option>
                      <option value="Paid">Paid</option>
                      <option value="Open Source">Open Source</option>
                    </select>
                  </div>
                </div>

                <div className={styles.twoColGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Creator / Company</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. NeuroLabs Inc."
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>License</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. MIT, Apache 2.0, Proprietary"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                    />
                  </div>
                </div>

                {/* Platforms Selector */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Supported Platforms</label>
                  <div className={styles.platformPillsRow}>
                    {ALL_PLATFORMS.map((plat) => {
                      const isSelected = platforms.includes(plat);
                      return (
                        <button
                          type="button"
                          key={plat}
                          className={`${styles.platformPill} ${isSelected ? styles.platformActive : ''}`}
                          onClick={() => handlePlatformToggle(plat)}
                        >
                          {isSelected && <Check size={12} />}
                          <span>{plat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Automation & Bot Hook Box */}
                <div className={styles.botCard}>
                  <div className={styles.botCardHeader}>
                    <Bot size={16} className={styles.botCardIcon} />
                    <div className={styles.botCardText}>
                      <span className={styles.botCardTitle}>Automated Bot Sync Hook</span>
                      <span className={styles.botCardSub}>
                        Configure webhooks for Guidora bots to periodically pull updated README & Changelog.
                      </span>
                    </div>
                  </div>

                  <div className={styles.botInputGrid}>
                    <input
                      type="url"
                      className={styles.fieldInput}
                      placeholder="Webhook URL (e.g. https://api.site.com/hooks/guidora)"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <select
                      className={styles.fieldSelect}
                      value={syncFrequency}
                      onChange={(e) => setSyncFrequency(e.target.value)}
                    >
                      <option value="Hourly">Sync Hourly</option>
                      <option value="Daily">Sync Daily</option>
                      <option value="On Push">On Release / Push</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Markdown Studio */}
              <div className={styles.editorColumn}>
                <div className={styles.editorCard}>
                  {/* Top Bar: Doc Switcher & Mode Switcher */}
                  <div className={styles.editorTopBar}>
                    <div className={styles.docTabs}>
                      <button
                        type="button"
                        className={`${styles.docTab} ${docType === 'readme' ? styles.docTabActive : ''}`}
                        onClick={() => setDocType('readme')}
                      >
                        <FileText size={13} />
                        <span>README / Overview</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.docTab} ${docType === 'changelog' ? styles.docTabActive : ''}`}
                        onClick={() => setDocType('changelog')}
                      >
                        <Sparkles size={13} />
                        <span>Release Changelog</span>
                      </button>
                    </div>

                    <div className={styles.modeTabs}>
                      <button
                        type="button"
                        className={`${styles.modeBtn} ${editorTab === 'write' ? styles.modeBtnActive : ''}`}
                        onClick={() => setEditorTab('write')}
                      >
                        <Edit3 size={13} />
                        <span>Write</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.modeBtn} ${editorTab === 'preview' ? styles.modeBtnActive : ''}`}
                        onClick={() => setEditorTab('preview')}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  {editorTab === 'write' && (
                    <div className={styles.toolbarRow}>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('bold')}
                        title="Bold (**text**)"
                      >
                        <Bold size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('italic')}
                        title="Italic (*text*)"
                      >
                        <Italic size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('heading')}
                        title="Heading (### Title)"
                      >
                        <Heading size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('code')}
                        title="Inline Code (`code`)"
                      >
                        <Code size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('list')}
                        title="Bullet List (- item)"
                      >
                        <List size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('quote')}
                        title="Quote (> quote)"
                      >
                        <Quote size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => insertMarkdownTag('link')}
                        title="Link ([Title](url))"
                      >
                        <Link size={13} />
                      </button>
                      <span className={styles.toolbarHint}>Markdown syntax supported</span>
                    </div>
                  )}

                  {/* Content Area */}
                  <div className={styles.editorBodyArea}>
                    {editorTab === 'write' ? (
                      <textarea
                        className={styles.markdownTextarea}
                        value={docType === 'readme' ? readme : changelog}
                        onChange={(e) => {
                          if (docType === 'readme') setReadme(e.target.value);
                          else setChangelog(e.target.value);
                        }}
                        placeholder={`Write ${docType === 'readme' ? 'README and documentation' : 'release notes and changelog'} in Markdown...`}
                        spellCheck="false"
                      />
                    ) : (
                      <div className={styles.previewCanvas}>
                        <MarkdownRenderer content={docType === 'readme' ? readme : changelog} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelActionBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitActionBtn}
                disabled={isSubmitting || !name.trim() || !tagline.trim()}
              >
                <Sparkles size={16} />
                <span>{isSubmitting ? 'Indexing Tool...' : 'Submit Tool to Directory'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
