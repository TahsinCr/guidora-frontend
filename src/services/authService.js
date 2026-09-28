import { getCurrentUser, updateCurrentUser, getAllUsers } from './userService';
import * as authApi from './api/authApi';
import { clearAccessToken } from './api/tokenManager';

const AUTH_USER_KEY = 'guidora_current_user';
const PASSWORDS_KEY = 'guidora_user_passwords';

const MOCK_ADMIN_EMAIL = (import.meta.env?.VITE_MOCK_ADMIN_EMAIL || 'tahsincrs@gmail.com').toLowerCase().trim();
const MOCK_ADMIN_PASSWORD = (import.meta.env?.VITE_MOCK_ADMIN_PASSWORD || '9PS1CgoOmsBIj5O9V7SQfDZMIibHvI4Q').trim();
const MOCK_ADMIN_USERNAME = (import.meta.env?.VITE_MOCK_ADMIN_USERNAME || 'tahsincr').trim();

// Seed default password for mock admin
function getStoredPasswords() {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {
      [MOCK_ADMIN_EMAIL]: MOCK_ADMIN_PASSWORD,
      [MOCK_ADMIN_USERNAME]: MOCK_ADMIN_PASSWORD,
    };
  } catch (e) {
    return {
      [MOCK_ADMIN_EMAIL]: MOCK_ADMIN_PASSWORD,
      [MOCK_ADMIN_USERNAME]: MOCK_ADMIN_PASSWORD,
    };
  }
}

export async function login({ usernameOrEmail, password, rememberMe = false }) {
  const cleanInput = usernameOrEmail.trim();
  const cleanPass = password.trim();

  // Try real .NET 10 WebAPI login first
  try {
    const apiResult = await authApi.login({
      email: cleanInput,
      password: cleanPass,
      rememberMe,
    });

    if (apiResult) {
      const user = {
        id: `usr_${cleanInput.toLowerCase()}`,
        name: cleanInput.split('@')[0],
        username: cleanInput.split('@')[0],
        email: cleanInput,
        role: 'admin',
        avatar: cleanInput.slice(0, 2).toUpperCase(),
        title: 'Platform Member',
        bio: 'Verified Guidora User',
        location: 'Global',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        savedToolIds: [],
        submittedToolIds: [],
        reputation: 500,
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: user }));
      }
      return user;
    }
  } catch (apiErr) {
    // If backend is offline (statusCode 0), gracefully fall back to local demo authentication
    if (apiErr.statusCode !== 0 && apiErr.statusCode !== 404 && apiErr.statusCode !== 502) {
      // It's a genuine 401 or validation error from active backend
      throw new Error(apiErr.message || 'Geçersiz kullanıcı adı veya şifre.');
    }
  }

  // Fallback demo auth when backend is not running
  const passwords = getStoredPasswords();
  const allUsers = getAllUsers();
  
  const user = allUsers.find((u) => 
    u.email.toLowerCase() === cleanInput.toLowerCase() ||
    (u.username && u.username.toLowerCase() === cleanInput.toLowerCase()) ||
    u.name.toLowerCase() === cleanInput.toLowerCase()
  );

  const isAdminMatch = 
    (cleanInput.toLowerCase() === MOCK_ADMIN_USERNAME.toLowerCase() || cleanInput.toLowerCase() === MOCK_ADMIN_EMAIL.toLowerCase()) &&
    (cleanPass === (passwords[MOCK_ADMIN_EMAIL] || passwords[MOCK_ADMIN_USERNAME] || MOCK_ADMIN_PASSWORD));

  if (!isAdminMatch && (!user || passwords[user.email] !== cleanPass)) {
    throw new Error('Geçersiz kullanıcı adı veya şifre.');
  }

  const loggedInUser = user || {
    id: 'usr_admin_01',
    name: 'Tahsin Cr',
    username: MOCK_ADMIN_USERNAME,
    email: MOCK_ADMIN_EMAIL,
    role: 'admin',
    avatar: 'TC',
    title: 'Lead AI Engineer & Product Architect',
    bio: 'Building next-generation AI developer directories and intelligent tool architectures.',
    location: 'Istanbul, Turkey',
    joinedDate: 'September 2024',
    savedToolIds: ['neurogen-studio', 'cursor-editor', 'midjourney', 'v0-dev'],
    submittedToolIds: ['neurogen-studio'],
    reputation: 980,
  };

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedInUser));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: loggedInUser }));
  }
  return loggedInUser;
}

export async function register({ username, email, password, name, title, bio, avatar, location }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();
  const cleanName = name?.trim() || cleanUsername;

  // Try real .NET 10 WebAPI registration
  try {
    const parts = cleanName.split(' ');
    const firstName = parts[0] || cleanUsername;
    const lastName = parts.slice(1).join(' ') || 'User';

    const apiResult = await authApi.register({
      email: cleanEmail,
      password,
      firstName,
      lastName,
      rememberMe: true,
    });

    if (apiResult) {
      const newUser = {
        id: `usr_${cleanUsername}`,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        role: 'member',
        avatar: avatar?.trim() || cleanUsername.slice(0, 2).toUpperCase(),
        title: title?.trim() || 'AI Community Member',
        bio: bio?.trim() || 'New explorer in the Guidora AI ecosystem.',
        location: location?.trim() || 'Global',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        savedToolIds: [],
        submittedToolIds: [],
        reputation: 100,
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: newUser }));
      }
      return newUser;
    }
  } catch (apiErr) {
    if (apiErr.statusCode !== 0 && apiErr.statusCode !== 404 && apiErr.statusCode !== 502) {
      throw new Error(apiErr.message || 'Kayıt işlemi başarısız.');
    }
  }

  // Fallback demo registration when backend is offline
  const allUsers = getAllUsers();
  if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('Bu e-posta adresi zaten kullanımda.');
  }

  const initials = cleanName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || cleanUsername.slice(0, 2).toUpperCase();

  const newUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role: 'member',
    avatar: avatar?.trim() || initials,
    title: title?.trim() || 'AI Community Member',
    bio: bio?.trim() || 'New explorer in the Guidora AI ecosystem.',
    location: location?.trim() || 'Global',
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    savedToolIds: [],
    submittedToolIds: [],
    reputation: 100,
  };

  const passwords = getStoredPasswords();
  passwords[cleanEmail] = password;
  passwords[cleanUsername] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));

  const updatedAll = [newUser, ...allUsers];
  localStorage.setItem('guidora_all_users', JSON.stringify(updatedAll));
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: newUser }));
  }

  return newUser;
}

export async function logout() {
  try {
    await authApi.logout();
  } catch {
    // ignore network errors on logout
  } finally {
    clearAccessToken();
    localStorage.removeItem(AUTH_USER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: null }));
    }
  }
  return true;
}

export function changePassword(oldPassword, newPassword) {
  const user = getCurrentUser();
  if (!user) throw new Error('Oturum açmış kullanıcı bulunamadı.');

  const passwords = getStoredPasswords();
  const currentSavedPass = passwords[user.email] || passwords[user.username] || MOCK_ADMIN_PASSWORD;

  if (oldPassword !== currentSavedPass) {
    throw new Error('Mevcut şifreniz hatalı.');
  }

  passwords[user.email] = newPassword;
  if (user.username) passwords[user.username] = newPassword;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));

  return true;
}

