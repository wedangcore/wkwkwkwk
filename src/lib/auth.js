// src/lib/auth.js
import { apiFetch } from './api';

export const login = async (username, password) => {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const logout = async () => {
  return await apiFetch('/api/auth/logout', {
    method: 'POST',
  });
};

export const signup = async (userData) => {
  return await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const forgotPassword = async (email) => {
  return await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyUser  = async (email, code) => {
  return await apiFetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
};
