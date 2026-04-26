/**
 * results.js — Results rendering module
 */

import { setGenerateDisabled } from './form.js';
import { generateDescription } from './api.js';
import { saveToHistory } from './history.js';

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

  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', _handleCopy);
  });
}

/**
 * Handle loading a saved result from history
 */
function _handleHistoryLoad(event) {
  const item = event.detail;
  
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
    saveToHistory(formData, results); // Task 04: Save to local storage
    _renderResults(results);
  } catch (error) {
    _showError(error.message);
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
  
  setGenerateDisabled(false);
}

function _renderResults({ short, long, bullets }) {
  resultShort.textContent = short;
  resultLong.textContent = long;
  resultBullets.innerHTML = bullets; 

  loadingState.hidden = true;
  errorState.hidden = true;
  generatedResults.hidden = false;

  setGenerateDisabled(false);
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
    
    const originalText = btn.textContent;
    btn.textContent = 'Копирано ✓';
    btn.style.color = 'var(--color-success)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
    }, 2000);
  } catch (err) {
    btn.textContent = 'Грешка';
    setTimeout(() => btn.textContent = 'Копирай', 2000);
  }
}
