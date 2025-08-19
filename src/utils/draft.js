// Simple localStorage-backed draft store for the portfolio builder
const KEY = 'portfolioBuilder:draft:v1';

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch (e) {
    console.error('Failed to save draft', e);
    return false;
  }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load draft', e);
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error('Failed to clear draft', e);
  }
}
