// Storage keys
const USER_KEY = 'guidora_current_user';
const ORGANIZATIONS_KEY = 'guidora_organizations';

// Initial Mock User
const DEFAULT_USER = {
  id: 'usr_tahsin_01',
  name: 'Tahsin Can',
  email: 'tahsin@guidora.io',
  role: 'admin', // 'admin' | 'creator' | 'member'
  avatar: 'TC',
  bio: 'Lead AI Engineer & Product Architect',
  organizationId: 'org_neurolabs',
  savedToolIds: ['neurogen-studio', 'cursor-editor', 'midjourney'],
};

// Initial Organizations (Verified / Admin created)
const DEFAULT_ORGANIZATIONS = [
  {
    id: 'org_neurolabs',
    name: 'NeuroLabs Inc.',
    slug: 'neurolabs',
    initials: 'NL',
    website: 'https://neurolabs.ai',
    description: 'Pioneering multimodal neural generative software and context-aware dev tools.',
    verified: true,
    verificationSource: 'admin', // 'admin' | 'bot' (future automated bot validation)
    createdAt: '2025-11-10',
    memberCount: 24,
    toolIds: ['neurogen-studio', 'vision-forge'],
  },
  {
    id: 'org_anthropic',
    name: 'Anthropic',
    slug: 'anthropic',
    initials: 'AN',
    website: 'https://anthropic.com',
    description: 'AI safety and research company developing helpful, honest, and harmless AI systems.',
    verified: true,
    verificationSource: 'admin',
    createdAt: '2025-08-15',
    memberCount: 350,
    toolIds: ['claude-3-5-sonnet'],
  },
  {
    id: 'org_openai',
    name: 'OpenAI',
    slug: 'openai',
    initials: 'OA',
    website: 'https://openai.com',
    description: 'Dedicated to developing safe and beneficial artificial general intelligence for humanity.',
    verified: true,
    verificationSource: 'admin',
    createdAt: '2025-06-01',
    memberCount: 800,
    toolIds: ['chatgpt-plus', 'sora-video'],
  },
  {
    id: 'org_cursor',
    name: 'Anysphere',
    slug: 'anysphere',
    initials: 'AS',
    website: 'https://cursor.com',
    description: 'Building Cursor, the AI-first code editor designed for pair-programming at lightspeed.',
    verified: true,
    verificationSource: 'admin',
    createdAt: '2026-01-20',
    memberCount: 42,
    toolIds: ['cursor-editor'],
  },
];

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function updateCurrentUser(updatedFields) {
  try {
    const current = getCurrentUser();
    const nextUser = { ...current, ...updatedFields };
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return nextUser;
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function getOrganizations() {
  try {
    const raw = localStorage.getItem(ORGANIZATIONS_KEY);
    if (!raw) {
      localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(DEFAULT_ORGANIZATIONS));
      return DEFAULT_ORGANIZATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_ORGANIZATIONS;
  }
}

export function getOrganizationById(id) {
  const orgs = getOrganizations();
  return orgs.find((o) => o.id === id || o.slug === id) || null;
}

/**
 * Admin-only: Add a new verified organization to the platform.
 * (Note: Regular users / tools cannot create an organization through the tool submit form.
 * It is either verified and created by Admin, or verified by automated bot hooks in future updates).
 */
export function adminCreateOrganization(orgData) {
  const orgs = getOrganizations();
  const newOrg = {
    id: `org_${Date.now()}`,
    slug: orgData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    initials: orgData.initials || orgData.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    verified: true,
    verificationSource: 'admin',
    createdAt: new Date().toISOString().split('T')[0],
    memberCount: 1,
    toolIds: [],
    ...orgData,
  };

  const updated = [newOrg, ...orgs];
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(updated));
  return newOrg;
}

