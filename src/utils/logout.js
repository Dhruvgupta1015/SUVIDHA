/**
 * logout.js — Centralized logout utility for SUVIDHA
 *
 * Single source of truth for clearing session state and redirecting to /auth.
 * Used by KioskLayout (UI logout button + session timeout) and api.js (401 interceptor).
 *
 * Usage:
 *   import { logout } from '../utils/logout';
 *   logout();                    // clears storage and redirects to /auth
 *   logout('/auth?role=officer') // redirect to a specific auth route
 */

export function logout(redirectPath = '/auth') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Hard redirect — clears all React state and forces a fresh app mount
  window.location.href = redirectPath;
}

export default logout;
