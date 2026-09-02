import { AppState } from './types';

const STORAGE_KEY = 'task-app-state';

/**
 * Creates a fresh default AppState with an Inbox list.
 * Used as fallback when localStorage is unavailable or corrupted.
 */
function createDefaultState(): AppState {
  const inboxId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    tasks: [],
    lists: [
      {
        id: inboxId,
        name: 'Inbox',
        isInbox: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

/**
 * Loads app state from localStorage.
 * On any parse failure or missing data, returns a fresh default state.
 *
 * @returns {AppState} The loaded state or a fresh default state.
 */
export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createDefaultState();
    }

    const state: AppState = JSON.parse(stored);

    // Basic validation: ensure state has tasks and lists arrays
    if (
      !state ||
      typeof state !== 'object' ||
      !Array.isArray(state.tasks) ||
      !Array.isArray(state.lists)
    ) {
      console.warn('Stored state is invalid; returning default state');
      return createDefaultState();
    }

    return state;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return createDefaultState();
  }
}

/**
 * Saves app state to localStorage.
 * On write failure (e.g., quota exceeded), emits a custom event for toast display.
 *
 * @param {AppState} state - The app state to persist.
 */
export function saveState(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);

    // Emit custom event for toast notification
    const event = new CustomEvent('storageQuotaExceeded', {
      detail: { error },
    });
    window.dispatchEvent(event);
  }
}
