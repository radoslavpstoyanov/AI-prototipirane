/**
 * history.js — Manage saved descriptions via localStorage and Sidebar UI
 */
import { showToast } from './notifications.js';

const HISTORY_KEY = 'describeai_history';

let sidebar;
let overlay;
let historyBtn;
let closeHistoryBtn;
let historyList;

// Confirm delete modal elements
let confirmModal;
let closeConfirmBtn;
let cancelDeleteBtn;
let confirmDeleteBtn;
let itemToDeleteId = null;

export function initHistory() {
  sidebar = document.getElementById('history-sidebar');
  overlay = document.getElementById('sidebar-overlay');
  historyBtn = document.getElementById('history-btn');
  closeHistoryBtn = document.getElementById('close-history-btn');
  historyList = document.getElementById('history-list');

  confirmModal = document.getElementById('confirm-delete-modal');
  closeConfirmBtn = document.getElementById('close-confirm-btn');
  cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  if (!sidebar) return;

  historyBtn.addEventListener('click', openSidebar);
  closeHistoryBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Modal events
  closeConfirmBtn.addEventListener('click', closeConfirmModal);
  cancelDeleteBtn.addEventListener('click', closeConfirmModal);
  confirmDeleteBtn.addEventListener('click', executeDelete);

  renderHistory();
}

/**
 * Save a newly generated product to history
 * @param {Object} formData 
 * @param {Object} results 
 */
export function saveToHistory(formData, results) {
  const history = getHistory();
  const newItem = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    formData,
    results
  };

  // Add to beginning of array (newest first)
  history.unshift(newItem);
  
  // Keep only the last 50 items to avoid localStorage limits
  if (history.length > 50) {
    history.length = 50;
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  
  return newItem;
}

function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse history:', e);
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  
  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">Все още нямате генерирани описания.</p>';
    return;
  }

  historyList.innerHTML = '';
  
  history.forEach(item => {
    const dateObj = new Date(item.date);
    const dateString = dateObj.toLocaleDateString('bg-BG') + ' ' + dateObj.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    
    // Convert tone value to something readable if we want, or just category
    // We'll map the category to text if it matches our options, or just show the value
    // Use the stored Bulgarian text if available (Task 09), otherwise fallback to the value
    let categoryDisplay = item.formData.productCategoryText || item.formData.productCategory || 'Друго';
    
    // Task 09: Clean up the category display
    // 1. If it's a path like "Group -> Category", take only the last part
    if (categoryDisplay.includes('->')) {
       categoryDisplay = categoryDisplay.split('->').pop().trim();
    }
    // 2. Fallback for older items with English slugs like "electronics-audio"
    else if (!item.formData.productCategoryText && categoryDisplay.includes('-')) {
       categoryDisplay = categoryDisplay.split('-').pop();
       categoryDisplay = categoryDisplay.charAt(0).toUpperCase() + categoryDisplay.slice(1);
    }

    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-title">${item.formData.productName || 'Без име'}</div>
        <button class="btn-delete" aria-label="Изтрий" title="Изтрий">
          <span aria-hidden="true">🗑️</span>
        </button>
      </div>
      <div class="history-item-meta">
        <span>${categoryDisplay}</span>
        <span>${dateString}</span>
      </div>
    `;
    
    // Add event listener specifically for the delete button
    const deleteBtn = el.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', (e) => {
      openConfirmModal(item.id, e);
    });
    
    el.addEventListener('click', () => {
      closeSidebar();
      // Dispatch event to results.js to show this specific history item
      document.dispatchEvent(new CustomEvent('history:load', { detail: item }));
    });

    historyList.appendChild(el);
  });
}

export function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
}

export function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

function openConfirmModal(id, event) {
  event.stopPropagation(); // Prevent the item click from firing and loading the history
  itemToDeleteId = id;
  confirmModal.showModal();
}

function closeConfirmModal() {
  itemToDeleteId = null;
  confirmModal.close();
}

function executeDelete() {
  if (!itemToDeleteId) return;
  
  let history = getHistory();
  history = history.filter(item => item.id !== itemToDeleteId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  
  // Inform the rest of the application that an item was deleted
  document.dispatchEvent(new CustomEvent('history:deleted', { detail: { id: itemToDeleteId } }));
  
  showToast('Продуктът е изтрит.', 'info');
  
  closeConfirmModal();
  renderHistory();
}
