/**
 * notifications.js — Toast notification system
 */

let container;

const ICONS = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️'
};

export function showToast(message, type = 'success') {
  if (!container) {
    container = document.getElementById('toast-container');
  }

  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = ICONS[type] || '';
  
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentElement) {
        container.removeChild(toast);
      }
    }, 300); // Wait for transition
  }, 4000);
}
