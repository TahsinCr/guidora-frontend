import React, { useMemo } from 'react';
import { marked } from 'marked';
import styles from './MarkdownRenderer.module.scss';

// Configure marked with GitHub-flavored markdown and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

export default function MarkdownRenderer({ content, className = '' }) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content);
    } catch (err) {
      console.error('Markdown parsing error:', err);
      return `<p>${content}</p>`;
    }
  }, [content]);

  return (
    <div
      className={`${styles.markdownBody} ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

