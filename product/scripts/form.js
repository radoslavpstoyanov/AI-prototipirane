/**
 * form.js — Product input form module
 *
 * Responsibilities (Task 01):
 *   - Bind all form DOM elements
 *   - Live character counter for the textarea
 *   - Tone card visual sync (radio → card highlight via :has() + JS fallback)
 *   - Client-side validation with inline error messages
 *   - Expose `getFormData()` for downstream modules (Task 03 — AI API)
 *   - Dispatch a custom "product:generate" event when the form is valid
 *
 * What this module does NOT do (intentional boundaries):
 *   - Call any AI API  → api.js  (Task 03)
 *   - Render results   → results.js (Task 02)
 *   - Persist history  → history.js (Task 04)
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURES_MAX_LENGTH = 1000;
const NEAR_LIMIT_THRESHOLD = 0.8; // 80 % of max → show warning colour

const VALIDATION_MESSAGES = {
  productName:     'Моля, въведи името на продукта.',
  productCategory: 'Моля, избери категория.',
  productFeatures: 'Моля, добави поне една характеристика.',
};

// ─── Module state ─────────────────────────────────────────────────────────────

/** @type {HTMLFormElement} */
let form;

/** @type {HTMLButtonElement} */
let generateBtn;

/** @type {HTMLButtonElement} */
let resetBtn;

/** @type {HTMLTextAreaElement} */
let featuresTextarea;

/** @type {HTMLSpanElement} */
let charCounter;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the form module.
 * Should be called once from main.js after the DOM is ready.
 */
export function initForm() {
  _bindElements();
  _bindEvents();
  _syncCharCounter(); // initialise counter display
}

/**
 * Collect and return the current form values.
 *
 * @returns {{ productName: string, productCategory: string, productFeatures: string, productTone: string }}
 */
export function getFormData() {
  const data = new FormData(form);
  return {
    productName:     (data.get('productName')     ?? '').trim(),
    productCategory: (data.get('productCategory') ?? '').trim(),
    productFeatures: (data.get('productFeatures') ?? '').trim(),
    productTone:     _getSelectedTone(),
  };
}

/**
 * Disable or enable the generate button.
 * Called externally (e.g. by results.js during loading).
 *
 * @param {boolean} disabled
 */
export function setGenerateDisabled(disabled) {
  generateBtn.disabled = disabled;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _bindElements() {
  form            = document.getElementById('product-form');
  generateBtn     = document.getElementById('generate-btn');
  resetBtn        = document.getElementById('reset-btn');
  featuresTextarea = document.getElementById('product-features');
  charCounter     = document.getElementById('features-counter');

  if (!form) {
    console.error('[form.js] #product-form not found in DOM.');
  }
}

function _bindEvents() {
  // Textarea → live character counter
  featuresTextarea.addEventListener('input', _syncCharCounter);

  // Tone cards → keep hidden <select> in sync (JS fallback for :has())
  _bindToneCards();

  // Form submit
  form.addEventListener('submit', _handleSubmit);

  // Reset → clear validation errors & counter
  form.addEventListener('reset', _handleReset);

  // Inline validation on blur
  form.querySelectorAll('.form-control').forEach((el) => {
    el.addEventListener('blur', () => _validateField(el));
  });
}

/** Sync the character counter badge below the textarea */
function _syncCharCounter() {
  const length = featuresTextarea.value.length;
  charCounter.textContent = `${length} / ${FEATURES_MAX_LENGTH}`;

  charCounter.classList.remove('near-limit', 'at-limit');

  if (length >= FEATURES_MAX_LENGTH) {
    charCounter.classList.add('at-limit');
  } else if (length / FEATURES_MAX_LENGTH >= NEAR_LIMIT_THRESHOLD) {
    charCounter.classList.add('near-limit');
  }
}

/** Wire tone radio inputs so the hidden <select> stays consistent */
function _bindToneCards() {
  const radios = form.querySelectorAll('.tone-radio');
  const hiddenSelect = document.getElementById('product-tone');

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (hiddenSelect) hiddenSelect.value = radio.value;
    });
  });
}

/**
 * Return the value of the currently checked tone radio.
 * Falls back to the hidden <select> value if none is checked.
 */
function _getSelectedTone() {
  const checked = form.querySelector('.tone-radio:checked');
  if (checked) return checked.value;

  const hiddenSelect = document.getElementById('product-tone');
  return hiddenSelect ? hiddenSelect.value : 'professional';
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate all required fields.
 * @returns {boolean} true if the form is valid
 */
function _validateForm() {
  let isValid = true;

  const fieldsToValidate = [
    form.querySelector('#product-name'),
    form.querySelector('#product-category'),
    form.querySelector('#product-features'),
  ];

  fieldsToValidate.forEach((field) => {
    if (!_validateField(field)) isValid = false;
  });

  return isValid;
}

/**
 * Validate a single field and display/remove its error message.
 * @param {HTMLElement} field
 * @returns {boolean}
 */
function _validateField(field) {
  if (!field) return true;

  const errorId = `${field.id}-error`;
  let errorEl = document.getElementById(errorId);

  const isSelectEmpty = field.tagName === 'SELECT' && !field.value;
  const isInputEmpty  = field.tagName !== 'SELECT' && !field.value.trim();
  const hasError      = isSelectEmpty || isInputEmpty;

  if (hasError) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);

    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.id = errorId;
      errorEl.className = 'field-error';
      errorEl.setAttribute('role', 'alert');
      field.closest('.form-group').appendChild(errorEl);
    }
    errorEl.textContent = VALIDATION_MESSAGES[field.name] ?? 'Това поле е задължително.';
    return false;
  }

  // Clear error state
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  if (errorEl) errorEl.remove();
  return true;
}

// ─── Event handlers ───────────────────────────────────────────────────────────

function _handleSubmit(event) {
  event.preventDefault();

  if (!_validateForm()) return;

  const formData = getFormData();

  // Dispatch a custom event — results.js and api.js will listen for this
  form.dispatchEvent(
    new CustomEvent('product:generate', {
      bubbles: true,
      detail: formData,
    })
  );
}

function _handleReset() {
  // Remove all inline validation errors
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });

  // Reset char counter
  setTimeout(_syncCharCounter, 0); // after browser clears the textarea value
}
