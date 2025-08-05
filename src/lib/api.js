// src/lib/api.js
export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Terjadi kesalahan saat memanggil API.');
  }

  return response.json();
};
