import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { AppState, Task, TaskList, NewTaskInput, TaskInput, TaskFilter, TaskSort, StatusSummary } from '../types';
import { reducer, ADD_TASK, UPDATE_TASK, DELETE_TASK, ADD_LIST, RENAME_LIST, DELETE_LIST } from './reducer';
import { loadState, saveState } from '../storage';
import { getTasks, getSummary, getListById } from './queries';

/**
 * Store interface — exposes actions and queries
 */
export interface TaskStore {
  state: AppState;
  actions: {
    addTask(input: NewTaskInput): Task;
    updateTask(id: string, patch: Partial<TaskInput>): Task;
    deleteTask(id: string): void;
    addList(name: string): TaskList;
    renameList(id: string, name: string): TaskList;
    deleteList(id: string): void;
  };
  queries: {
    getTasks(filter?: TaskFilter, sort?: TaskSort): Task[];
    getListById(id: string): TaskList | undefined;
    getSummary(): StatusSummary;
  };
}

/**
 * TaskStoreContext — provides store to all descendants
 */
const TaskStoreContext = createContext<TaskStore | undefined>(undefined);

/**
 * useTaskStore — custom hook to consume the store context
 * Throws if used outside TaskStoreProvider
 */
export function useTaskStore(): TaskStore {
  const store = useContext(TaskStoreContext);
  if (!store) {
    throw new Error('useTaskStore must be used within a TaskStoreProvider');
  }
  return store;
}

/**
 * TaskStoreProvider — wraps the app and provides store context
 */
export interface TaskStoreProviderProps {
  children: ReactNode;
}

export function TaskStoreProvider({ children }: TaskStoreProviderProps) {
  // Initialize state from localStorage
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState());

  // Sync state to localStorage on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  /**
   * Action wrapper that dispatches the reducer action.
   * All actions immediately trigger a saveState via the useEffect.
   */
  const actions: TaskStore['actions'] = {
    addTask(input: NewTaskInput): Task {
      dispatch({ type: ADD_TASK, payload: input });
      // The newly added task is the last one in the updated state (available after next render)
      // For now, we return a Task object based on the input; the actual task will be in state
      const inboxList = state.lists.find((list) => list.isInbox);
      if (!inboxList) {
        throw new Error('No Inbox list found');
      }
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        status: input.status ?? 'To Do',
        priority: input.priority ?? 'Medium',
        dueDate: input.dueDate,
        listId: input.listId ?? inboxList.id,
        createdAt: now,
        updatedAt: now,
      };
    },

    updateTask(id: string, patch: Partial<TaskInput>): Task {
      dispatch({ type: UPDATE_TASK, payload: { id, updates: patch } });
      const task = state.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error(`Task with id ${id} not found`);
      }
      const now = new Date().toISOString();
      return {
        ...task,
        ...patch,
        updatedAt: now,
      };
    },

    deleteTask(id: string): void {
      dispatch({ type: DELETE_TASK, payload: { id } });
    },

    addList(name: string): TaskList {
      dispatch({ type: ADD_LIST, payload: { name } });
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        name,
        isInbox: false,
        createdAt: now,
        updatedAt: now,
      };
    },

    renameList(id: string, name: string): TaskList {
      dispatch({ type: RENAME_LIST, payload: { id, name } });
      const list = state.lists.find((l) => l.id === id);
      if (!list) {
        throw new Error(`List with id ${id} not found`);
      }
      const now = new Date().toISOString();
      return {
        ...list,
        name,
        updatedAt: now,
      };
    },

    deleteList(id: string): void {
      dispatch({ type: DELETE_LIST, payload: { id } });
    },
  };

  /**
   * Query helpers — pure functions over the current state
   */
  const queries: TaskStore['queries'] = {
    getTasks(filter?: TaskFilter, sort?: TaskSort): Task[] {
      return getTasks(state.tasks, filter, sort);
    },

    getListById(id: string): TaskList | undefined {
      return getListById(state.lists, id);
    },

    getSummary(): StatusSummary {
      return getSummary(state.tasks);
    },
  };

  const store: TaskStore = {
    state,
    actions,
    queries,
  };

  return (
    <TaskStoreContext.Provider value={store}>
      {children}
    </TaskStoreContext.Provider>
  );
}
