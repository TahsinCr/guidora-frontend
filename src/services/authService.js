import { getCurrentUser, updateCurrentUser, getAllUsers } from './userService';

const AUTH_USER_KEY = 'guidora_current_user';
const PASSWORDS_KEY = 'guidora_user_passwords';

// Seed default password for TahsinCr
function getStoredPasswords() {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {
      'tahsin@guidora.io': 'TahsinCr',
      'tahsincrs@gmail.com': 'TahsinCr',
      'TahsinCr': 'TahsinCr',
    };
  } catch (e) {
    return { 'TahsinCr': 'TahsinCr' };
  }
}

export function login({ usernameOrEmail, password }) {
  const cleanInput = usernameOrEmail.trim();
  const cleanPass = password.trim();
  const passwords = getStoredPasswords();

  const allUsers = getAllUsers();
  
  // Find user by username, email or ID
  const user = allUsers.find((u) => 
    u.email.toLowerCase() === cleanInput.toLowerCase() ||
    (u.username && u.username.toLowerCase() === cleanInput.toLowerCase()) ||
    u.name.toLowerCase() === cleanInput.toLowerCase()
  );

  // Check valid credentials (match TahsinCr credentials or user password)
  const isTahsinMatch = 
    (cleanInput.toLowerCase() === 'tahsincr' || cleanInput.toLowerCase() === 'tahsincrs@gmail.com' || cleanInput.toLowerCase() === 'tahsin@guidora.io') &&
    (cleanPass === (passwords['TahsinCr'] || 'TahsinCr'));

  if (!isTahsinMatch && (!user || passwords[user.email] !== cleanPass)) {
    throw new Error('Geçersiz kullanıcı adı veya şifre.');
  }

  // Active user object
  const loggedInUser = user || {
    id: 'usr_tahsin_01',
    name: 'Tahsin Cr',
    username: 'TahsinCr',
    email: 'tahsincrs@gmail.com',
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

export function register({ username, email, password, name, title, bio, avatar, location }) {
  const allUsers = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('Bu e-posta adresi zaten kullanımda.');
  }

  const cleanName = name?.trim() || cleanUsername;
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

export function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: null }));
  }
  return true;
}

export function changePassword(oldPassword, newPassword) {
  const user = getCurrentUser();
  if (!user) throw new Error('Oturum açmış kullanıcı bulunamadı.');

  const passwords = getStoredPasswords();
  const currentSavedPass = passwords[user.email] || passwords[user.username] || 'TahsinCr';

  if (oldPassword !== currentSavedPass) {
    throw new Error('Mevcut şifreniz hatalı.');
  }

  passwords[user.email] = newPassword;
  if (user.username) passwords[user.username] = newPassword;
  passwords['TahsinCr'] = newPassword; // keep updated for main user
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));

  return true;
}

