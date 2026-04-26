/**
 * settings.js — API key management and settings modal
 */

const STORAGE_KEY = 'describeai_gemini_key';

let modal;
let settingsBtn;
let closeBtn;
let saveBtn;
let inputField;
let errorRetryBtn; // From the results section, opens settings

export function initSettings() {
  modal = document.getElementById('settings-modal');
  settingsBtn = document.getElementById('settings-btn');
  closeBtn = document.getElementById('close-settings-btn');
  saveBtn = document.getElementById('save-settings-btn');
  inputField = document.getElementById('api-key-input');
  errorRetryBtn = document.getElementById('error-retry-btn');

  if (!modal) return;

  // Load existing key
  const existingKey = getApiKey();
  if (existingKey) {
    inputField.value = existingKey;
  }

  // Bind events
  settingsBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  saveBtn.addEventListener('click', saveKeyAndClose);
  
  if (errorRetryBtn) {
    errorRetryBtn.addEventListener('click', openModal);
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function openModal() {
  modal.showModal();
}

export function closeModal() {
  modal.close();
}

function saveKeyAndClose() {
  const key = inputField.value.trim();
  if (key) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  closeModal();
}
