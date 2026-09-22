/**
 * Security utilities for input sanitization, external link safety, and role verification
 */
import DOMPurify from 'dompurify';

/**
 * Validates and sanitizes external URLs to prevent javascript:, data:, vbscript: injection attacks.
 * Only allows valid http:// and https:// URLs.
 * @param {string} url
 * @returns {string|null} Sanitized safe URL or null if dangerous/invalid
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Explicitly block dangerous script and data schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    // Allow only http: and https: schemes
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch (err) {
    // If relative URL starting with / or #
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    return null;
  }
}

/**
 * Safely opens an external URL in a new tab with tabnabbing defense
 * @param {string} url
 */
export function safeOpenExternal(url) {
  const safe = sanitizeUrl(url);
  if (!safe) return;
  const win = window.open(safe, '_blank', 'noopener,noreferrer');
  if (win) {
    win.opener = null;
  }
}

/**
 * Sanitizes HTML string using DOMPurify with strict allowed tags and attributes
 * @param {string} dirtyHtml
 * @returns {string} Clean HTML string
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'strong', 'em', 'del', 'hr', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'span', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Strips HTML tags and harmful characters from plain text inputs (names, tags, titles)
 * @param {string} text
 * @returns {string}
 */
export function sanitizePlainText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '')
    .trim();
}
