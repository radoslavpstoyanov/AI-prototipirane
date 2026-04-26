/**
 * results.js — Results rendering module
 *
 * Responsibilities (Task 02):
 *   - Listen for 'product:generate' events from the form.
 *   - Show the loading spinner and disable the generate button.
 *   - Simulate an API delay (Task 02 dummy logic).
 *   - Render dummy text into the result cards and show them.
 */

import { setGenerateDisabled } from './form.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIMULATED_DELAY_MS = 2500;

// Dummy data for Task 02 testing
const DUMMY_RESULTS = {
  short: 'Представяме ви иновативен продукт, съчетаващ модерен дизайн и върхови технологии. Идеален за ежедневно ползване, той предлага ненадминат комфорт и надеждност във всяка ситуация.',
  long: 'Този продукт е създаден с мисъл за потребителя. Благодарение на висококачествените материали и прецизната изработка, той гарантира дълготрайност и отлична производителност.\n\nНезависимо дали сте у дома или в движение, ще оцените неговата практичност и интуитивен интерфейс. Всяка функция е внимателно проектирана, за да улесни вашето ежедневие и да ви спести ценно време.',
  bullets: `
<ul>
  <li>Изключителна издръжливост и качество на изработка</li>
  <li>Иновативни функции за максимално удобство</li>
  <li>Ергономичен и стилен дизайн</li>
  <li>Лесен за употреба без нужда от допълнителни настройки</li>
</ul>
  `.trim()
};

// ─── Module state ─────────────────────────────────────────────────────────────

/** @type {HTMLElement} */
let resultsSection;
/** @type {HTMLElement} */
let loadingState;
/** @type {HTMLElement} */
let generatedResults;

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

  resultShort   = document.getElementById('result-short');
  resultLong    = document.getElementById('result-long');
  resultBullets = document.getElementById('result-bullets');

  if (!resultsSection) {
    console.error('[results.js] #results-section not found in DOM.');
  }
}

function _bindEvents() {
  // Listen for form submission events at the document level
  document.addEventListener('product:generate', _handleGenerateEvent);

  // Copy buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', _handleCopy);
  });
}

/**
 * Triggered when the form is valid and submitted.
 * @param {CustomEvent} event 
 */
function _handleGenerateEvent(event) {
  const formData = event.detail;
  console.log('[results.js] Generation triggered with:', formData);

  // 1. Enter loading state
  _showLoading();

  // 2. Simulate API request (Will be replaced in Task 03)
  setTimeout(() => {
    _renderResults(DUMMY_RESULTS);
  }, SIMULATED_DELAY_MS);
}

function _showLoading() {
  // Show section but hide actual results
  resultsSection.hidden = false;
  generatedResults.hidden = true;
  
  // Show spinner
  loadingState.hidden = false;

  // Disable form button
  setGenerateDisabled(true);

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _renderResults({ short, long, bullets }) {
  // Populate DOM
  resultShort.textContent = short;
  resultLong.textContent = long;
  resultBullets.innerHTML = bullets; // Using innerHTML here for dummy bullets (<ul>)

  // Hide spinner, show results
  loadingState.hidden = true;
  generatedResults.hidden = false;

  // Re-enable form button
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

  // Get text (removes HTML tags from bullets list if any, but keeps structure)
  const textToCopy = targetEl.innerText;

  try {
    await navigator.clipboard.writeText(textToCopy);
    
    // Visual feedback
    const originalText = btn.textContent;
    btn.textContent = 'Копирано ✓';
    btn.style.color = 'var(--color-success)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    btn.textContent = 'Грешка';
    setTimeout(() => btn.textContent = 'Копирай', 2000);
  }
}
