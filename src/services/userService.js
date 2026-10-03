import { isMockMode } from './config/modeService';

// Storage keys
const USER_KEY = 'guidora_current_user';
const ORGANIZATIONS_KEY = 'guidora_organizations';

// Initial Mock Users
export const MOCK_USERS = [
  {
    id: 'usr_admin_01',
    name: 'Tahsin Cr',
    username: 'tahsincr',
    email: 'tahsincrs@gmail.com',
    role: 'admin', // 'admin' | 'moderator' | 'creator' | 'member'
    avatar: 'TC',
    title: 'Lead AI Engineer & Product Architect',
    bio: 'Building next-generation AI developer directories, intelligent tool orchestration workflows, and modular UI design architectures.',
    location: 'Istanbul, Turkey',
    website: 'https://github.com/Tahsincr',
    joinedDate: 'September 2024',
    organizationId: null,
    savedToolIds: ['neurogen-studio', 'cursor-editor', 'midjourney', 'v0-dev'],
    submittedToolIds: ['neurogen-studio'],
    reputation: 980,
  },
  {
    id: 'usr_mod_04',
    name: 'Deniz Kaya',
    username: 'DenizMod',
    email: 'deniz@guidora.ai',
    role: 'moderator',
    avatar: 'DK',
    title: 'Community Content & Review Moderator',
    bio: 'Reviewing directory submissions, keeping tool evaluations clean, and filtering community reports.',
    location: 'Izmir, Turkey',
    website: 'https://guidora.ai',
    joinedDate: 'December 2025',
    savedToolIds: ['claude-3-5-sonnet', 'cursor-editor'],
    submittedToolIds: [],
    reputation: 520,
  },
  {
    id: 'usr_elena_02',
    name: 'Elena Rostova',
    email: 'elena@neurolabs.ai',
    role: 'creator',
    avatar: 'ER',
    title: 'Senior Neural Interface Designer',
    bio: 'Obsessed with generative tokens, dark mode UI paradigms, and contextual coding assistants.',
    location: 'Berlin, Germany',
    website: 'https://neurolabs.ai',
    joinedDate: 'November 2025',
    savedToolIds: ['codewizard-ai', 'figma'],
    submittedToolIds: ['vision-forge'],
    reputation: 640,
  },
  {
    id: 'usr_dev_03',
    name: 'Alex Vance',
    email: 'alex@community.org',
    role: 'member',
    avatar: 'AV',
    title: 'Fullstack Software Engineer',
    bio: 'Exploring local LLMs, Ollama orchestration, and open-source generative stacks.',
    location: 'San Francisco, CA',
    website: 'https://github.com',
    joinedDate: 'January 2026',
    organizationId: null,
    savedToolIds: ['cursor-editor'],
    submittedToolIds: [],
    reputation: 210,
  },
];

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

export const DEFAULT_USER = MOCK_USERS[0];

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

const ALL_USERS_KEY = 'guidora_all_users';

export function getAllUsers() {
  if (!isMockMode()) return getCurrentUser() ? [getCurrentUser()] : [];
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(MOCK_USERS));
      return [...MOCK_USERS];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...MOCK_USERS];
  }
}

export function getUserById(id) {
  if (!id) return getCurrentUser();
  const all = getAllUsers();
  const found = all.find((u) => u.id === id);
  if (found) return found;
  const current = getCurrentUser();
  if (current.id === id) return current;
  return found || current;
}

export function updateCurrentUser(updatedFields) {
  try {
    const current = getCurrentUser();
    const nextUser = { ...current, ...updatedFields };
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

    // Also update in all users list
    const all = getAllUsers();
    const updatedAll = all.map((u) => (u.id === nextUser.id ? nextUser : u));
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updatedAll));

    return nextUser;
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function adminUpdateUserRole(userId, newRole) {
  const users = getAllUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, role: newRole };
    }
    return u;
  });
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));

  const current = getCurrentUser();
  if (current && current.id === userId) {
    updateCurrentUser({ role: newRole });
  }

  return updated;
}

/**
 * Admin-only: Update detailed profile info for any user (title, reputation, bio)
 */
export function adminUpdateUserDetails(userId, updates) {
  const users = getAllUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, ...updates };
    }
    return u;
  });
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));

  const current = getCurrentUser();
  if (current && current.id === userId) {
    updateCurrentUser(updates);
  }

  return updated;
}

export function adminCreateUser(userData) {
  const users = getAllUsers();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanName = userData.name?.trim() || 'New User';
  const cleanUsername = userData.username?.trim() || cleanName.toLowerCase().replace(/\s+/g, '');
  const cleanEmail = userData.email?.trim() || `${cleanUsername}@guidora.ai`;

  if (users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
    throw new Error('A user with this email already exists.');
  }

  const initials = cleanName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'NU';

  const newUser = {
    id,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    password: userData.password?.trim() || 'password123',
    role: userData.role || 'member',
    avatar: userData.avatar?.trim() || initials,
    title: userData.title?.trim() || 'AI Platform Explorer',
    bio: userData.bio?.trim() || '',
    location: userData.location?.trim() || 'Global',
    website: userData.website?.trim() || '',
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    organizationId: userData.organizationId || null,
    savedToolIds: [],
    submittedToolIds: [],
    reputation: Number(userData.reputation) || 100,
  };

  // Persist password for authentication login
  if (userData.password) {
    try {
      const raw = localStorage.getItem('guidora_user_passwords');
      const passwords = raw ? JSON.parse(raw) : {};
      passwords[cleanEmail.toLowerCase()] = userData.password.trim();
      passwords[cleanUsername.toLowerCase()] = userData.password.trim();
      localStorage.setItem('guidora_user_passwords', JSON.stringify(passwords));
    } catch (e) {
      console.warn('Failed to store password', e);
    }
  }

  const updated = [newUser, ...users];
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));
  return newUser;
}

export function adminDeleteUser(userId) {
  const users = getAllUsers();
  const updated = users.filter((u) => u.id !== userId);
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Permission checks for Admin vs Moderator
 * Moderator can: moderate reviews, edit tools, resolve reports, view stats
 * Moderator CANNOT: change user roles, edit user profiles, delete system backups, delete root categories
 */
export function canUserPerformAction(user, actionKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'moderator') {
    const allowedModeratorActions = [
      'view_admin',
      'moderate_reviews',
      'edit_tools',
      'flag_tools',
      'resolve_reports',
      'manage_tags',
      'view_logs',
      'view_stats',
    ];
    return allowedModeratorActions.includes(actionKey);
  }
  return false;
}




export function getOrganizations() {
  if (!isMockMode()) return [];
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

export function adminDeleteOrganization(orgId) {
  const orgs = getOrganizations();
  const updated = orgs.filter((o) => o.id !== orgId);
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function adminToggleOrgVerification(orgId) {
  const orgs = getOrganizations();
  const updated = orgs.map((o) => {
    if (o.id === orgId) {
      return { ...o, verified: !o.verified };
    }
    return o;
  });
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function adminUpdateOrganization(orgId, updates) {
  const orgs = getOrganizations();
  const updated = orgs.map((o) => {
    if (o.id === orgId) {
      return {
        ...o,
        ...updates,
        slug: updates.slug || (updates.name ? updates.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : o.slug),
        initials: updates.initials || (updates.name ? updates.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : o.initials),
      };
    }
    return o;
  });
  localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(updated));
  return updated;
}


