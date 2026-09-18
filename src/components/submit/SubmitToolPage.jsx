import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Search,
  ExternalLink,
  Code2,
  List,
  Heading,
  Bold,
  Italic,
  Quote,
  Link,
  Bot,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import TagPicker from './TagPicker';
import { addTool, fetchGithubRepoData } from '@/services/toolsService';
import { CATEGORIES } from '@/services/mockData';
import { getOrganizations } from '@/services/userService';
import styles from './SubmitToolPage.module.scss';

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

export default function SubmitToolPage({ onBack, onToolCreated }) {
  // 1. Form Inputs
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('generative-art');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [organizations] = useState(getOrganizations());
  const [organizationId, setOrganizationId] = useState('org_neurolabs');
  const [selectedTags, setSelectedTags] = useState([
    { id: 'web', name: 'Web', tagCategoryId: 'platform', tagCategoryName: 'Platform & Environment' },
    { id: 'freemium', name: 'Freemium', only: true, tagCategoryId: 'pricing', tagCategoryName: 'Pricing & Licensing' },
  ]);

  // 2. Bot Sync Hook Settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('Daily');

  // 3. GitHub Auto-fetch
  const [repoUrl, setRepoUrl] = useState('');
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [repoFetchStatus, setRepoFetchStatus] = useState(null);

  // 4. Markdown Studio State
  const [activeDoc, setActiveDoc] = useState('readme'); // 'readme' | 'changelog'
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'
  const [readmeContent, setReadmeContent] = useState(
    `# Overview\n\nDescribe how your tool works, its architecture, and real-world developer use cases.\n\n### Key Features\n- High-throughput neural processing\n- Native API & SDK integrations\n- Enterprise privacy & compliance`
  );
  const [changelogContent, setChangelogContent] = useState(
    `# Release History\n\n## v1.0.0 (Initial Release)\n- Core platform release with web interface and REST API.\n- Multi-tenant workspace support.\n- Real-time streaming token completions.`
  );

  // 5. Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Find primary pricing and license from selected tags
      const pricingTag = selectedTags.find((t) => t.tagCategoryId === 'pricing')?.name || 'Freemium';
      const licenseTag = selectedTags.find((t) => t.tagCategoryId === 'license')?.name || 'MIT';
      const platformTags = selectedTags
        .filter((t) => t.tagCategoryId === 'platform')
        .map((t) => t.name);

      const selectedOrg = organizations.find((o) => o.id === organizationId);

      const newTool = await addTool({
        name: name.trim(),
        categoryId,
        description: tagline.trim(),
        websiteUrl: websiteUrl.trim(),
        organizationId: selectedOrg?.id || null,
        creatorName: selectedOrg ? selectedOrg.name : `${name.trim()} Labs`,
        creatorInitials: selectedOrg ? selectedOrg.initials : name.trim().slice(0, 2).toUpperCase(),
        creatorVerified: !!selectedOrg?.verified,
        pricing: pricingTag,
        license: licenseTag,
        platforms: platformTags.length > 0 ? platformTags : ['Web'],
        tags: selectedTags.map((t) => t.id),
        tagObjects: selectedTags,
        repoUrl: repoUrl.trim(),
        readme: readmeContent,
        changelog: changelogContent,
        webhookUrl: webhookUrl.trim(),
        syncFrequency,
      });

      if (onToolCreated) {
        onToolCreated(newTool);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check inputs.');
      setIsSubmitting(false);
    }
  };

  // Filter categories for dropdown (exclude 'all')
  const validCategories = CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <div className={styles.submitPageContainer}>
      {/* Top Breadcrumb Navigation Bar */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb Navigation">
        <button className={styles.backBtn} onClick={onBack} title="Return to Directory">
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </button>
        <span className={styles.crumbDivider}>/</span>
        <span className={styles.crumbActive}>Submit AI Platform & Tool</span>
      </nav>

      {/* Main Studio Frame */}
      <div className={styles.studioCard}>
        {/* Studio Header */}
        <header className={styles.studioHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <Sparkles size={22} className={styles.sparkleIcon} />
            </div>
            <div className={styles.headerTitles}>
              <h1 className={styles.mainTitle}>Add AI Tool to Directory</h1>
              <p className={styles.subTitle}>
                Register your AI platform with automated GitHub synchronization, hierarchical tag taxonomy, and live Markdown documentation.
              </p>
            </div>
          </div>
        </header>

        {/* Fast GitHub Import Strip */}
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
                <span>Fetching Data...</span>
              ) : (
                <>
                  <GithubIcon size={15} />
                  <span>Fetch Repo Data</span>
                </>
              )}
            </button>
          </div>

          {repoFetchStatus && (
            <div
              className={`${styles.fetchStatusAlert} ${
                repoFetchStatus.type === 'success' ? styles.statusSuccess : styles.statusError
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
        <form className={styles.studioForm} onSubmit={handleSubmit}>
          <div className={styles.studioGrid}>
            {/* Left Column (Specifications & Taxonomy) */}
            <div className={styles.leftColumn}>
              <div className={styles.sectionHeader}>
                <Layers size={16} className={styles.sectionIcon} />
                <span>TOOL SPECIFICATIONS</span>
              </div>

              {/* Tool Name & Category Row */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tool Name *</label>
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
                  <label className={styles.label}>Category *</label>
                  <select
                    className={styles.selectInput}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {validCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Short Tagline */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Short Tagline / Summary *</label>
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
                  <label className={styles.label}>Website URL</label>
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
                    Organization / Creator
                    <span className={styles.labelHint}>(Admin or Bot Verified)</span>
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

              {/* Hierarchical Tag System Component */}
              <TagPicker
                selectedTags={selectedTags}
                onChange={setSelectedTags}
              />

              {/* Bot Hook Automation Card */}
              <div className={styles.botCard}>
                <div className={styles.botCardHeader}>
                  <Bot size={16} className={styles.botIcon} />
                  <span className={styles.botTitle}>Automated Bot Sync Hook</span>
                </div>
                <p className={styles.botDesc}>
                  Configure webhooks for Guidora bots to periodically inspect your documentation and update your tool listing automatically.
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
                      className={`${styles.docTabBtn} ${activeDoc === 'readme' ? styles.docTabActive : ''}`}
                      onClick={() => setActiveDoc('readme')}
                    >
                      <span>README / Overview</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.docTabBtn} ${activeDoc === 'changelog' ? styles.docTabActive : ''}`}
                      onClick={() => setActiveDoc('changelog')}
                    >
                      <span>Release Changelog</span>
                    </button>
                  </div>

                  <div className={styles.modeTabs}>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${editorMode === 'write' ? styles.modeActive : ''}`}
                      onClick={() => setEditorMode('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${editorMode === 'preview' ? styles.modeActive : ''}`}
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
                    <span className={styles.syntaxHint}>Markdown syntax supported</span>
                  </div>
                )}

                {/* Editor or Live Preview Area */}
                <div className={styles.studioContentArea}>
                  {editorMode === 'write' ? (
                    <textarea
                      id="studio-markdown-textarea"
                      className={styles.markdownEditor}
                      value={activeDoc === 'readme' ? readmeContent : changelogContent}
                      onChange={(e) => {
                        if (activeDoc === 'readme') {
                          setReadmeContent(e.target.value);
                        } else {
                          setChangelogContent(e.target.value);
                        }
                      }}
                      placeholder={
                        activeDoc === 'readme'
                          ? '# Overview\n\nExplain how your tool operates...'
                          : '# Changelog\n\n## v1.0.0\n- Release notes...'
                      }
                    />
                  ) : (
                    <div className={styles.markdownPreviewWrap}>
                      <MarkdownRenderer
                        content={activeDoc === 'readme' ? readmeContent : changelogContent}
                      />
                    </div>
                  )}
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
            <button type="button" className={styles.cancelBtn} onClick={onBack}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !name.trim() || !tagline.trim()}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Registering Tool...' : 'Submit Tool to Directory'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

