import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadState, saveState } from './storage';
import { AppState } from './types';

describe('storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadState()', () => {
    it('should return default state when localStorage is empty', () => {
      const state = loadState();

      expect(state).toBeDefined();
      expect(state.tasks).toEqual([]);
      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Inbox');
      expect(state.lists[0].isInbox).toBe(true);
    });

    it('should load valid state from localStorage', () => {
      const mockState: AppState = {
        tasks: [
          {
            id: 'task-1',
            listId: 'list-1',
            title: 'Test task',
            status: 'To Do',
            priority: 'Medium',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        lists: [
          {
            id: 'list-1',
            name: 'My List',
            isInbox: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      localStorage.setItem('task-app-state', JSON.stringify(mockState));

      const loaded = loadState();
      expect(loaded).toEqual(mockState);
      expect(loaded.tasks).toHaveLength(1);
      expect(loaded.lists).toHaveLength(1);
    });

    it('should return default state on JSON parse error', () => {
      localStorage.setItem('task-app-state', '{invalid json}');

      const state = loadState();
      expect(state.tasks).toEqual([]);
      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Inbox');
    });

    it('should return default state if stored data lacks tasks array', () => {
      localStorage.setItem('task-app-state', JSON.stringify({ lists: [] }));

      const state = loadState();
      expect(state.tasks).toEqual([]);
      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Inbox');
    });

    it('should return default state if stored data lacks lists array', () => {
      localStorage.setItem('task-app-state', JSON.stringify({ tasks: [] }));

      const state = loadState();
      expect(state.tasks).toEqual([]);
      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Inbox');
    });

    it('should return default state if stored data is null', () => {
      localStorage.setItem('task-app-state', 'null');

      const state = loadState();
      expect(state.tasks).toEqual([]);
      expect(state.lists).toHaveLength(1);
      expect(state.lists[0].name).toBe('Inbox');
    });
  });

  describe('saveState()', () => {
    it('should save state to localStorage', () => {
      const state: AppState = {
        tasks: [
          {
            id: 'task-1',
            listId: 'list-1',
            title: 'Test task',
            status: 'To Do',
            priority: 'Medium',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        lists: [
          {
            id: 'list-1',
            name: 'My List',
            isInbox: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      saveState(state);

      const stored = localStorage.getItem('task-app-state');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(state);
    });

    it('should emit storageQuotaExceeded event on write failure', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const state: AppState = {
        tasks: [],
        lists: [],
      };

      saveState(state);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'storageQuotaExceeded',
        })
      );

      dispatchEventSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should save empty state correctly', () => {
      const state: AppState = {
        tasks: [],
        lists: [],
      };

      saveState(state);

      const stored = localStorage.getItem('task-app-state');
      expect(stored).toBe(JSON.stringify(state));
    });

    it('should overwrite previous state', () => {
      const state1: AppState = {
        tasks: [
          {
            id: 'task-1',
            listId: 'list-1',
            title: 'Task 1',
            status: 'To Do',
            priority: 'Low',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        lists: [],
      };

      const state2: AppState = {
        tasks: [
          {
            id: 'task-2',
            listId: 'list-2',
            title: 'Task 2',
            status: 'Done',
            priority: 'High',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        lists: [],
      };

      saveState(state1);
      saveState(state2);

      const stored = JSON.parse(localStorage.getItem('task-app-state')!);
      expect(stored).toEqual(state2);
      expect(stored.tasks[0].id).toBe('task-2');
    });
  });

  describe('roundtrip (load/save)', () => {
    it('should survive a save-load cycle', () => {
      const originalState: AppState = {
        tasks: [
          {
            id: 'task-1',
            listId: 'list-1',
            title: 'Test task',
            description: 'Test description',
            status: 'In Progress',
            priority: 'High',
            dueDate: '2024-12-31',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
          },
        ],
        lists: [
          {
            id: 'list-1',
            name: 'Project A',
            isInbox: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      saveState(originalState);
      const loaded = loadState();

      expect(loaded).toEqual(originalState);
    });
  });
});
