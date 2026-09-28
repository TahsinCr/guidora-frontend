/**
 * In-Memory Access Token Store
 * 
 * Security Architecture:
 * - Access token is kept strictly in JavaScript runtime closure/memory.
 * - NEVER stored in localStorage, sessionStorage, or accessible browser cookies to prevent XSS exfiltration.
 * - When page reloads, the memory store starts empty; the app transparently performs a silent refresh
 *   via the browser's HttpOnly `guidora_refresh` cookie.
 */

let memoryAccessToken = null;
let tokenChangeListeners = [];

export function getAccessToken() {
  return memoryAccessToken;
}

export function setAccessToken(token) {
  memoryAccessToken = token;
  notifyListeners(token);
}

export function clearAccessToken() {
  memoryAccessToken = null;
  notifyListeners(null);
}

export function onTokenChange(listener) {
  tokenChangeListeners.push(listener);
  return () => {
    tokenChangeListeners = tokenChangeListeners.filter((l) => l !== listener);
  };
}

function notifyListeners(token) {
  for (const listener of tokenChangeListeners) {
    try {
      listener(token);
    } catch (e) {
      console.error('Error in token change listener:', e);
    }
  }
}
