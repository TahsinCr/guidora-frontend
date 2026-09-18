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
  CheckCircle2,
  AlertCircle,
  Bot,
  Globe,
  Tag,
  DollarSign,
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

export default function SubmitToolModal({ isOpen, onClose, onToolCreated }) {
  const [categories, setCategories] = useState([]);

  // GitHub Auto-Fetch State
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('generative-art');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [pricing, setPricing] = useState('Freemium');
  const [platforms, setPlatforms] = useState(['Web']);
  const [creatorName, setCreatorName] = useState('');
  const [license, setLicense] = useState('MIT');

  // Markdown Editor State
  const [editorTab, setEditorTab] = useState('write'); // 'write' | 'preview'
  const [docType, setDocType] = useState('readme'); // 'readme' | 'changelog'
  const [readme, setReadme] = useState(
    `# Project Overview\n\nWrite detailed documentation, features, and setup instructions in Markdown here.\n\n### Key Features\n- High throughput processing\n- Native API support\n- Context-aware intelligence`
  );
  const [changelog, setChangelog] = useState(
    `## v1.0.0 - Initial Release\n\n- Public release of the platform\n- Comprehensive web dashboard\n- Initial API endpoints`
  );

  // Bot Hook / Automation State
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
      setName(data.name || name);
      setTagline(data.description || tagline);
      setWebsiteUrl(data.websiteUrl || websiteUrl);
      setRepoUrl(data.repoUrl || githubUrl);
      setLicense(data.license || license);
      if (data.ownerName) setCreatorName(data.ownerName);
      if (data.readme) setReadme(data.readme);
      if (data.changelog) setChangelog(data.changelog);

      setGithubStatus({
        type: 'success',
        message: `Fetched "${data.name}" metadata, stars (${data.stars}), license, and README from GitHub!`,
      });
    } catch (err) {
      setGithubStatus({
        type: 'error',
        message: err.message || 'Failed to fetch repository. You can still fill the fields manually.',
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
    if (syntax === 'list') addition = `\n- Item 1\n- Item 2\n- Item 3\n`;
    if (syntax === 'link') addition = `[Link title](https://example.com)`;

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
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Submit New AI Tool</h2>
              <span className={styles.subtitle}>
                Add to the Guidora catalog. Sync from GitHub or fill details manually.
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {submitSuccess ? (
          <div className={styles.successState}>
            <CheckCircle2 size={48} color="#10B981" />
            <h3>Tool Submitted Successfully!</h3>
            <p>
              <strong>{name}</strong> has been added to the directory. Refreshing view...
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* 1. GitHub Auto-Fetch Banner */}
            <div className={styles.githubBanner}>
              <div className={styles.githubBannerTop}>
                <GithubIcon size={18} className={styles.ghIcon} />
                <span className={styles.ghTitle}>Import from GitHub Repository (Optional)</span>
              </div>
              <div className={styles.githubInputRow}>
                <input
                  type="text"
                  className={styles.ghInput}
                  placeholder="e.g. https://github.com/vllm-project/vllm or owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
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
                  className={`${styles.statusAlert} ${
                    githubStatus.type === 'success' ? styles.statusSuccess : styles.statusError
                  }`}
                >
                  {githubStatus.type === 'success' ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>{githubStatus.message}</span>
                </div>
              )}
            </div>

            {/* 2. Core Information Grid */}
            <div className={styles.fieldsGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Tool Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. NeuroGen Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Category *</label>
                <select
                  className={styles.select}
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

              <div className={styles.inputGroupFull}>
                <label className={styles.label}>Short Tagline / Summary *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Next-gen neural network engine for automated code synthesis"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Website URL</label>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Pricing Model</label>
                <select
                  className={styles.select}
                  value={pricing}
                  onChange={(e) => setPricing(e.target.value)}
                >
                  <option value="Free">Free</option>
                  <option value="Freemium">Freemium</option>
                  <option value="Paid">Paid</option>
                  <option value="Open Source">Open Source</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Creator / Company Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. NeuroLabs Inc."
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>License</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. MIT, Apache 2.0, Proprietary"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                />
              </div>
            </div>

            {/* Platform Selector */}
            <div className={styles.platformGroup}>
              <label className={styles.label}>Supported Platforms</label>
              <div className={styles.platformPills}>
                {['Web', 'API', 'Mac', 'Windows', 'Linux', 'iOS', 'CLI'].map((plat) => {
                  const isSelected = platforms.includes(plat);
                  return (
                    <button
                      type="button"
                      key={plat}
                      className={`${styles.platPill} ${isSelected ? styles.platActive : ''}`}
                      onClick={() => handlePlatformToggle(plat)}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Markdown Documentation Editor */}
            <div className={styles.editorContainer}>
              <div className={styles.editorNav}>
                <div className={styles.docTypeTabs}>
                  <button
                    type="button"
                    className={`${styles.docTypeBtn} ${docType === 'readme' ? styles.activeDoc : ''}`}
                    onClick={() => setDocType('readme')}
                  >
                    README / Overview (MD)
                  </button>
                  <button
                    type="button"
                    className={`${styles.docTypeBtn} ${docType === 'changelog' ? styles.activeDoc : ''}`}
                    onClick={() => setDocType('changelog')}
                  >
                    Changelog (MD)
                  </button>
                </div>

                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${editorTab === 'write' ? styles.activeView : ''}`}
                    onClick={() => setEditorTab('write')}
                  >
                    <Edit3 size={13} />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${editorTab === 'preview' ? styles.activeView : ''}`}
                    onClick={() => setEditorTab('preview')}
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {editorTab === 'write' ? (
                <>
                  <div className={styles.editorToolbar}>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('bold')}
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('italic')}
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('heading')}
                      title="Heading"
                    >
                      <Heading size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('code')}
                      title="Inline Code"
                    >
                      <Code size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('list')}
                      title="Bullet List"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.toolBtn}
                      onClick={() => insertMarkdownTag('link')}
                      title="Insert Link"
                    >
                      <Link size={13} />
                    </button>
                  </div>

                  <textarea
                    className={styles.editorTextarea}
                    rows={8}
                    value={docType === 'readme' ? readme : changelog}
                    onChange={(e) => {
                      if (docType === 'readme') setReadme(e.target.value);
                      else setChangelog(e.target.value);
                    }}
                    placeholder={`Write your ${docType} in Markdown...`}
                  />
                </>
              ) : (
                <div className={styles.previewBox}>
                  <MarkdownRenderer content={docType === 'readme' ? readme : changelog} />
                </div>
              )}
            </div>

            {/* 4. Automation & Bot Hook Configuration (Upcoming bot integration) */}
            <div className={styles.automationBox}>
              <div className={styles.automationHeader}>
                <Bot size={16} className={styles.botIcon} />
                <div>
                  <h4 className={styles.botTitle}>Automated Bot Sync Hook (Optional)</h4>
                  <span className={styles.botDesc}>
                    Configure webhooks for Guidora bots to periodically pull updated README & Changelog.
                  </span>
                </div>
              </div>

              <div className={styles.botInputsRow}>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="Webhook URL (e.g. https://api.yourdomain.com/hooks/guidora)"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <select
                  className={styles.select}
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value)}
                >
                  <option value="Hourly">Sync Hourly</option>
                  <option value="Daily">Sync Daily</option>
                  <option value="On Push">On Release / Push</option>
                </select>
              </div>
            </div>

            {/* Footer actions */}
            <div className={styles.footerRow}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !name.trim() || !tagline.trim()}
              >
                <Sparkles size={15} />
                <span>{isSubmitting ? 'Saving Tool...' : 'Submit Tool to Directory'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
