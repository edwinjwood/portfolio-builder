export function getApiBase() {
  const metaBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
  if (metaBase) return metaBase.replace(/\/$/, '');
  const nodeBase = (typeof process !== 'undefined' && process.env && process.env.API_URL) || '';
  return nodeBase ? nodeBase.replace(/\/$/, '') : '';
}

export function buildApiUrl(path) {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
