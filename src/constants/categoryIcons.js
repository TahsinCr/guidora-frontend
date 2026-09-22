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

