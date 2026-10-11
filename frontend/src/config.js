// API configuration supporting both relative paths (same domain / Vercel monorepo)
// and external backend URL (e.g. Render / Railway / local development).
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
