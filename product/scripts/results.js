/**
 * results.js — Results rendering module
 */

import { setGenerateDisabled } from './form.js';
import { generateDescription } from './api.js';
import { saveToHistory } from './history.js';
import { showToast } from './notifications.js';

// ─── Module state ─────────────────────────────────────────────────────────────

/** @type {HTMLElement} */
let resultsSection;
/** @type {HTMLElement} */
let loadingState;
/** @type {HTMLElement} */
let generatedResults;
/** @type {HTMLElement} */
let errorState;
/** @type {HTMLElement} */
let errorMessage;

/** @type {HTMLElement} */
let resultShort;
/** @type {HTMLElement} */
let resultLong;
/** @type {HTMLElement} */
let resultBullets;

let currentLoadedId = null;
let currentProductData = null;

// ─── Public API ───────────────────────────────────────────────────────────────

export function initResults() {
  _bindElements();
  _bindEvents();
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _bindElements() {
  resultsSection   = document.getElementById('results-section');
  loadingState     = document.getElementById('loading-state');
  generatedResults = document.getElementById('generated-results');
  errorState       = document.getElementById('error-state');
  errorMessage     = document.getElementById('error-message');

  resultShort   = document.getElementById('result-short');
  resultLong    = document.getElementById('result-long');
  resultBullets = document.getElementById('result-bullets');
}

function _bindEvents() {
  document.addEventListener('product:generate', _handleGenerateEvent);
  document.addEventListener('history:load', _handleHistoryLoad);
  document.addEventListener('history:deleted', _handleHistoryDeleted);

  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', _handleCopy);
  });

  const downloadBtn = document.getElementById('download-txt-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', _handleDownload);
  }
}

/**
 * Handle loading a saved result from history
 */
function _handleHistoryLoad(event) {
  const item = event.detail;
  currentLoadedId = item.id;
  currentProductData = item.formData;
  
  // Make sure the main section container is visible
  resultsSection.hidden = false;
  
  _renderResults(item.results);
  
  // Also scroll to the results smoothly
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Triggered when the form is valid and submitted.
 * @param {CustomEvent} event 
 */
async function _handleGenerateEvent(event) {
  const formData = event.detail;
  
  _showLoading();

  try {
    const results = await generateDescription(formData);
    const savedItem = saveToHistory(formData, results); // Task 04: Save to local storage
    if (savedItem) {
      currentLoadedId = savedItem.id;
      currentProductData = formData;
    }
    _renderResults(results);
    showToast('Успешно генериране!', 'success');
  } catch (error) {
    _showError(error.message);
    showToast(error.message, 'error');
  } finally {
    setGenerateDisabled(false);
  }
}

/**
 * Handle deletion of a history item
 */
function _handleHistoryDeleted(event) {
  const deletedId = event.detail.id;
  
  // If the item we just deleted is the one currently shown on the screen
  if (deletedId === currentLoadedId) {
    resultsSection.hidden = true;
    currentLoadedId = null;
  }
}

function _showLoading() {
  resultsSection.hidden = false;
  generatedResults.hidden = true;
  errorState.hidden = true;
  
  loadingState.hidden = false;
  setGenerateDisabled(true);

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _showError(msg) {
  loadingState.hidden = true;
  generatedResults.hidden = true;
  
  errorMessage.textContent = msg;
  errorState.hidden = false;
  
  // setGenerateDisabled(false) is now handled in finally block of _handleGenerateEvent
}

function _renderResults({ short, long, bullets }) {
  resultShort.textContent = short;
  resultLong.textContent = long;
  resultBullets.innerHTML = bullets; 

  loadingState.hidden = true;
  errorState.hidden = true;
  generatedResults.hidden = false;

  // setGenerateDisabled(false) is now handled in finally block of _handleGenerateEvent
}

/**
 * Handle copy to clipboard functionality
 */
async function _handleCopy(event) {
  const btn = event.currentTarget;
  const targetId = btn.getAttribute('data-target');
  const targetEl = document.getElementById(targetId);

  if (!targetEl) return;

  const textToCopy = targetEl.innerText;

  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast('Копирано в клипборда!', 'success');
  } catch (err) {
    showToast('Грешка при копиране', 'error');
  }
}

/**
 * Handle exporting descriptions to a .txt file
 */
function _handleDownload() {
  if (!currentProductData) return;

  const rawName = currentProductData.productName || 'продукт';
  
  // Use the name exactly as entered by the user
  const formattedName = rawName;
  
  // Format category name (use the human-readable text from form data OR get it from the form if loading from old history)
  let formattedCategory = currentProductData.productCategoryText;
  
  if (!formattedCategory) {
    const categorySelect = document.getElementById('product-category');
    if (categorySelect && categorySelect.selectedIndex > 0) {
      formattedCategory = categorySelect.options[categorySelect.selectedIndex].text;
    }
  }
  
  formattedCategory = formattedCategory || 'Друго';
  
  const dateStr = new Date().toLocaleDateString('bg-BG');

  const content = `Име на продукт: ${formattedName}
Категория: ${formattedCategory}
Дата: ${dateStr}

Кратко описание
${resultShort.innerText}

Подробно описание
${resultLong.innerText}

Основни акценти
${resultBullets.innerText}

Генерирано с DescribeAI
`;

  // Filename sanitization - keep user's original casing but remove forbidden filesystem characters
  const safeName = rawName
    .replace(/[<>:"/\\|?*]/g, '') // Remove forbidden chars
    .trim()
    .slice(0, 80);                // Slightly longer limit for original names
    
  const filename = `${safeName || 'opisanie'}.txt`;

  // Create blob with UTF-8 encoding
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
