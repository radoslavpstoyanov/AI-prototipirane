/**
 * main.js — Application entry point
 *
 * Bootstraps all modules and wires up the root event listeners.
 * Each logical concern lives in its own module under scripts/.
 *
 * Task coverage:
 *   Task 01 → form.js  (form validation + data collection)
 *   Task 02 → results.js (results section + loading spinner)  ← not yet built
 *   Task 03 → api.js   (AI integration)                       ← not yet built
 */

import { initForm } from './form.js';

// Initialise modules that are ready
initForm();
