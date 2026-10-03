import { getCurrentUser, updateCurrentUser, getAllUsers } from './userService';
import * as authApi from './api/authApi';
import { clearAccessToken } from './api/tokenManager';

const AUTH_USER_KEY = 'guidora_current_user';

export async function login({ usernameOrEmail, password, rememberMe = false }) {
  const cleanInput = usernameOrEmail.trim();
  const cleanPass = password.trim();

  // 1. Authenticate via backend API (works identically for Vite in-process mock engine and real .NET 10 WebAPI)
  try {
    const apiResult = await authApi.login({
      email: cleanInput,
      password: cleanPass,
      rememberMe,
    });

    if (apiResult) {
      const returnedUser = apiResult?.data?.user || apiResult?.user || (import.meta.env.VITE_USE_MOCK === 'true' ? apiResult?.data : userFromAccessToken(apiResult.accessToken?.token));
      const user = {
        id: returnedUser?.id || `usr_${cleanInput.toLowerCase()}`,
        name: returnedUser?.name || cleanInput.split('@')[0],
        username: returnedUser?.username || cleanInput.split('@')[0],
        email: returnedUser?.email || cleanInput,
        role: returnedUser?.role || 'member',
        permissions: returnedUser?.permissions || [],
        avatar: returnedUser?.avatar || cleanInput.slice(0, 2).toUpperCase(),
        title: returnedUser?.title || '',
        bio: returnedUser?.bio || '',
        location: returnedUser?.location || 'Global',
        joinedDate: returnedUser?.joinedDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        savedToolIds: returnedUser?.savedToolIds || [],
        submittedToolIds: returnedUser?.submittedToolIds || [],
        reputation: returnedUser?.reputation || 0,
      };

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: user }));
      }
      return user;
    }
  } catch (apiErr) {
    // If backend returned an active validation or auth failure, display message
    if (apiErr.statusCode !== 0 && apiErr.statusCode !== 404 && apiErr.statusCode !== 502) {
      throw new Error(apiErr.message || 'Geçersiz kullanıcı adı veya şifre.');
    }
    // If client is configured to disallow offline fallback, throw connection error
    if (import.meta.env?.VITE_USE_MOCK !== 'true' || import.meta.env?.VITE_ALLOW_MOCK_FALLBACK !== 'true') {
      throw new Error(apiErr.message || 'Sunucuya bağlanılamadı.');
    }
  }

  // 2. Offline fallback (only engaged when backend is completely unreachable and fallback is enabled)
  const allUsers = getAllUsers();
  const matchedUser = allUsers.find((u) => 
    u.email.toLowerCase() === cleanInput.toLowerCase() ||
    (u.username && u.username.toLowerCase() === cleanInput.toLowerCase()) ||
    u.name.toLowerCase() === cleanInput.toLowerCase()
  );

  if (!matchedUser) {
    throw new Error('Geçersiz kullanıcı adı veya şifre.');
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedUser));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: matchedUser }));
  }
  return matchedUser;
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
  if (!oldPassword || !newPassword) {
    throw new Error('Lütfen tüm şifre alanlarını doldurun.');
  }
  if (newPassword.length < 6) {
    throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
  }
  return true;
}


// JWT claims supply display identity; the API enforces every permission.
export function userFromAccessToken(token) {
  if (!token) throw new Error('Sunucu oturum kimliği döndürmedi.');
  const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(segment), (c) => c.charCodeAt(0))));
  const prefix = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';
  const permissions = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || claims.role || [];
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return {
    id: claims[prefix + 'nameidentifier'] || claims.sub,
    name: claims[prefix + 'name'] || claims.unique_name || claims.name,
    email: claims[prefix + 'emailaddress'] || claims.email,
    role: list.includes('Role.Manage') ? 'admin' : list.includes('Product.Report.Review') ? 'moderator' : 'member',
    permissions: list,
    savedToolIds: [], submittedToolIds: [],
  };
}

export async function restoreSession() {
  try {
    const result = await authApi.refreshSession();
    const user = userFromAccessToken(result.accessToken?.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: user }));
    return user;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    clearAccessToken();
    window.dispatchEvent(new CustomEvent('guidora_auth_change', { detail: null }));
    return null;
  }
}
