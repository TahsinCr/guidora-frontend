import React from 'react';
import { FileText, Tag, CheckCircle2 } from 'lucide-react';
import styles from './DocContent.module.scss';

export default function DocContent({ tool, activeTab }) {
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
          <span>Product Gallery</span>
        </h2>
        <div className={styles.galleryGrid}>
          <div className={styles.galleryPlaceholder}>Main Workspace Preview</div>
          <div className={styles.galleryPlaceholder}>Canvas & Code Inspector</div>
        </div>
      </div>
    );
  }

  if (activeTab === 'changelog') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>Release Changelog</span>
        </h2>
        <div className={styles.changelogItem}>
          <span className={styles.versionPill}>{tool.version || 'v2.4.1'}</span>
          <p className={styles.paragraph}>
            Added multi-modal image-to-code pipelines, expanded memory window to 100k tokens, and improved collaborative sync performance.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'reviews') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>Community Reviews ({tool.reviewCount || '128'})</span>
        </h2>
        <p className={styles.paragraph}>
          Rated <strong>{tool.rating || 4.8} / 5.0</strong> by 128 verified AI practitioners and engineers.
        </p>
      </div>
    );
  }

  if (activeTab === 'alternatives') {
    return (
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>Direct Alternatives</span>
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
      {/* 1. Tool Overview Card */}
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <FileText size={18} className={styles.headerIcon} />
          <span>Tool Overview</span>
        </h2>

        <p className={styles.paragraph}>
          {overviewLead}
        </p>

        <p className={styles.paragraph}>
          {overviewDetail}
        </p>

        <div className={styles.featuresSection}>
          <h3 className={styles.subHeading}>Key Features</h3>
          <div className={styles.bulletList}>
            {keyFeatures.map((feat, idx) => (
              <div key={idx} className={styles.bulletItem}>
                <span className={styles.bulletDot}>•</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Classifications & Tags Card */}
      <div className={styles.contentCard}>
        <h2 className={styles.cardHeader}>
          <Tag size={18} className={styles.headerIcon} />
          <span>Classifications & Tags</span>
        </h2>

        <div className={styles.tagsSection}>
          <span className={styles.tagsLabel}>Core Capabilities</span>
          <div className={styles.tagsList}>
            {capabilities.map((tag, idx) => (
              <span key={idx} className={styles.tagPill}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

