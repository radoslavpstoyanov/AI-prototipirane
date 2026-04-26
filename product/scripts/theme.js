/**
 * theme.js — Manage light/dark mode and persistence
 */

const THEME_KEY = 'describeai_theme';
const DARK_ICON = '🌙';
const LIGHT_ICON = '☀️';

let themeBtn;
let themeIcon;

export function initTheme() {
  themeBtn = document.getElementById('theme-btn');
  themeIcon = document.getElementById('theme-icon');

  if (!themeBtn) return;

  // Initial theme setup
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  _applyTheme(initialTheme);

  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    _applyTheme(newTheme);
  });
}

function _applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  
  if (themeIcon) {
    themeIcon.textContent = theme === 'light' ? DARK_ICON : LIGHT_ICON;
  }
}
