import {
  Circle,
  Terminal,
  Image as ImageIcon,
  MessageSquare,
  Video,
  Database,
  Music,
  Briefcase,
  Box,
  Folder,
} from 'lucide-react';

/**
 * Single source of truth for Category ID to Lucide Icon mapping.
 * Adheres to Open/Closed Principle: new categories can be added here
 * without modifying individual consuming components.
 */
export const CATEGORY_ICON_MAP = {
  'generative-art': Circle,
  'developer-tools': Terminal,
  'design-ui': ImageIcon,
  'llms-ai': MessageSquare,
  'video-motion': Video,
  'data-science': Database,
  'audio-music': Music,
  'productivity': Briefcase,
  '3d-motion': Box,
};

/**
 * Safely resolves an icon component for a given category ID with fallback.
 * @param {string} categoryId
 * @returns {import('react').ComponentType<any>} Lucide Icon component
 */
export function getCategoryIcon(categoryId) {
  if (!categoryId) return Folder;
  const slug = String(categoryId).toLowerCase().trim();
  return CATEGORY_ICON_MAP[slug] || Folder;
}

/**
 * Single source of truth for Category ID to Accent Color mapping.
 */
export const CATEGORY_COLOR_MAP = {
  'generative-art': '#A855F7',
  'developer-tools': '#10B981',
  'design-ui': '#06B6D4',
  'llms-ai': '#EAB308',
  'video-motion': '#EC4899',
  'data-science': '#3B82F6',
  'audio-music': '#F97316',
  'productivity': '#8B5CF6',
  '3d-motion': '#14B8A6',
};

/**
 * Safely resolves an accent color for a given category ID with fallback.
 * @param {string} categoryId
 * @returns {string} Hex color string
 */
export function getCategoryColor(categoryId) {
  if (!categoryId) return '#818cf8';
  const slug = String(categoryId).toLowerCase().trim();
  return CATEGORY_COLOR_MAP[slug] || '#818cf8';
}

