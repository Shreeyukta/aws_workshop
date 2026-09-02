import { AppState, Task, TaskList, NewTaskInput, TaskInput, Status, Priority } from '../types';

// Action types
export const ADD_TASK = 'ADD_TASK';
export const UPDATE_TASK = 'UPDATE_TASK';
export const DELETE_TASK = 'DELETE_TASK';
export const ADD_LIST = 'ADD_LIST';
export const RENAME_LIST = 'RENAME_LIST';
export const DELETE_LIST = 'DELETE_LIST';

// Discriminated union for type safety
export type Action =
  | { type: typeof ADD_TASK; payload: NewTaskInput }
  | { type: typeof UPDATE_TASK; payload: { id: string; updates: TaskInput } }
  | { type: typeof DELETE_TASK; payload: { id: string } }
  | { type: typeof ADD_LIST; payload: { name: string } }
  | { type: typeof RENAME_LIST; payload: { id: string; name: string } }
  | { type: typeof DELETE_LIST; payload: { id: string } };

/**
 * Pure reducer function for task management state.
 * Handles all state mutations for tasks and lists with proper defaults and constraints.
 *
 * @param state - Current application state
 * @param action - Dispatched action with discriminated union type
 * @returns New application state (immutable transformation)
 */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case ADD_TASK:
      return addTask(state, action.payload);

    case UPDATE_TASK:
      return updateTask(state, action.payload.id, action.payload.updates);

    case DELETE_TASK:
      return deleteTask(state, action.payload.id);

    case ADD_LIST:
      return addList(state, action.payload.name);

    case RENAME_LIST:
      return renameList(state, action.payload.id, action.payload.name);

    case DELETE_LIST:
      return deleteList(state, action.payload.id);

    default:
      return state;
  }
}

/**
 * Add a new task with enforced defaults.
 * - status defaults to "To Do" if not provided
 * - priority defaults to "Medium" if not provided
 * - listId defaults to Inbox id if not provided
 */
function addTask(state: AppState, input: NewTaskInput): AppState {
  // Find the Inbox list to use as default listId
  const inboxList = state.lists.find((list) => list.isInbox);
  if (!inboxList) {
    console.warn('No Inbox list found; cannot add task');
    return state;
  }

  const now = new Date().toISOString();

  const newTask: Task = {
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

  return {
    ...state,
    tasks: [...state.tasks, newTask],
  };
}

/**
 * Update an existing task with partial updates.
 * Only the provided fields are updated; others remain unchanged.
 */
function updateTask(state: AppState, taskId: string, updates: TaskInput): AppState {
  const taskIndex = state.tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    console.warn(`Task with id ${taskId} not found`);
    return state;
  }

  const now = new Date().toISOString();

  const updatedTask: Task = {
    ...state.tasks[taskIndex],
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.priority !== undefined && { priority: updates.priority }),
    ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
    ...(updates.listId !== undefined && { listId: updates.listId }),
    updatedAt: now,
  };

  const newTasks = [...state.tasks];
  newTasks[taskIndex] = updatedTask;

  return {
    ...state,
    tasks: newTasks,
  };
}

/**
 * Delete a task by id.
 */
function deleteTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  };
}

/**
 * Add a new list to the state.
 */
function addList(state: AppState, name: string): AppState {
  const now = new Date().toISOString();

  const newList: TaskList = {
    id: crypto.randomUUID(),
    name,
    isInbox: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...state,
    lists: [...state.lists, newList],
  };
}

/**
 * Rename a list by id.
 * The Inbox list (marked with isInbox: true) cannot be renamed — this is a no-op.
 */
function renameList(state: AppState, listId: string, newName: string): AppState {
  const listIndex = state.lists.findIndex((list) => list.id === listId);

  if (listIndex === -1) {
    console.warn(`List with id ${listId} not found`);
    return state;
  }

  const list = state.lists[listIndex];

  // Protect Inbox list from renaming
  if (list.isInbox) {
    console.warn('Cannot rename the Inbox list');
    return state;
  }

  const now = new Date().toISOString();

  const updatedList: TaskList = {
    ...list,
    name: newName,
    updatedAt: now,
  };

  const newLists = [...state.lists];
  newLists[listIndex] = updatedList;

  return {
    ...state,
    lists: newLists,
  };
}

/**
 * Delete a list by id.
 * The Inbox list (marked with isInbox: true) cannot be deleted — this is a no-op.
 * When a list is deleted, all tasks in that list are also deleted.
 */
function deleteList(state: AppState, listId: string): AppState {
  const listToDelete = state.lists.find((list) => list.id === listId);

  if (!listToDelete) {
    console.warn(`List with id ${listId} not found`);
    return state;
  }

  // Protect Inbox list from deletion
  if (listToDelete.isInbox) {
    console.warn('Cannot delete the Inbox list');
    return state;
  }

  return {
    ...state,
    lists: state.lists.filter((list) => list.id !== listId),
    tasks: state.tasks.filter((task) => task.listId !== listId),
  };
}
