/**
 * E2E tests — Task list flows
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * Covers:
 *  - Create task list → assign task → view scoped list → verify only that task shown
 *  - Create task without list → verify it appears in Inbox
 *  - Delete non-empty list → confirm dialog shows task count → confirm → list and tasks gone
 *
 * All tests seed state via page.addInitScript (no reliance on cross-test state).
 */

import { test, expect, Page } from '@playwright/test';
import type { AppState, Task, TaskList } from '../src/types';

// Force desktop viewport so sidebar is visible in all list-flow tests.
// (The sidebar uses `hidden md:block`, so it is not rendered on mobile viewports.
//  List-flow tests inherently require sidebar interaction; they are not mobile tests.)
test.use({ viewport: { width: 1280, height: 900 } });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedState(page: Page, state: AppState) {
  await page.addInitScript((serialised) => {
    localStorage.setItem('task-app-state', serialised);
  }, JSON.stringify(state));
}

function makeInbox(id = 'inbox-1'): TaskList {
  return {
    id,
    name: 'Inbox',
    isInbox: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeList(id: string, name: string): TaskList {
  return {
    id,
    name,
    isInbox: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    listId: 'inbox-1',
    title: 'Test Task',
    status: 'To Do',
    priority: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function readState(page: Page): Promise<AppState | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('task-app-state');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Task list flows', () => {
  // ── 1. Create a list, assign a task to it, view the scoped list ───────────
  test('creates a list and shows only its tasks when viewed', async ({ page }) => {
    // Requirement 6.1, 6.2, 6.3
    const inbox = makeInbox();
    // Pre-seed with Inbox only; we'll create the custom list through the UI
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.goto('/dashboard');

    // Open the "New list" input in the Sidebar
    await page.getByRole('button', { name: 'New list' }).click();
    const newListInput = page.getByLabel('New list name');
    await expect(newListInput).toBeVisible();
    await newListInput.fill('Work');
    await newListInput.press('Enter');

    // After creation we should be on /lists/:id for the new list
    await expect(page).toHaveURL(/\/lists\//);
    await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();

    // Grab the listId from the URL
    const workListUrl = page.url();
    const workListId = workListUrl.split('/lists/')[1];
    expect(workListId).toBeTruthy();

    // Create a task assigned to the Work list
    await page.getByRole('link', { name: /Create new task in Work/i }).click();
    await page.getByLabel('Title').fill('Work Task');
    // The list selector should default to the Work list because of the ?listId param
    await page.getByRole('button', { name: 'Create task' }).click();

    // The form navigates to /dashboard on success.
    // Wait for the dashboard URL so we know the task is in-memory state
    // and the useEffect has had a chance to persist to localStorage.
    await expect(page).toHaveURL('/dashboard');

    // Navigate back to the Work list via the sidebar (in-app navigation, no full reload)
    await page.getByRole('link', { name: /Go to list: Work/i }).click();
    await expect(page).toHaveURL(/\/lists\//);

    // The Work list should show the Work Task
    await expect(page.getByRole('article', { name: 'Task: Work Task' })).toBeVisible();

    // Navigate to the Inbox list — the Work Task should NOT be there
    await page.getByRole('link', { name: /Go to list: Inbox/i }).click();
    await expect(page.getByRole('article', { name: 'Task: Work Task' })).not.toBeVisible();
  });

  // ── 2. Create task without specifying a list → appears in Inbox ───────────
  test('a task created without an explicit list goes to Inbox', async ({ page }) => {
    // Requirement 6.5
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.goto('/tasks/new');

    await page.getByLabel('Title').fill('Inbox Task');
    // Do NOT change the list selector — it should default to Inbox
    await page.getByRole('button', { name: 'Create task' }).click();

    await expect(page).toHaveURL('/dashboard');

    // Verify via localStorage that the task's listId is the Inbox id
    const state = await readState(page);
    expect(state?.tasks).toHaveLength(1);
    expect(state?.tasks[0].listId).toBe(inbox.id);
    expect(state?.tasks[0].title).toBe('Inbox Task');

    // Navigate to the Inbox list and confirm the task is visible there
    await page.getByRole('link', { name: /Go to list: Inbox/i }).click();
    await expect(page.getByRole('article', { name: 'Task: Inbox Task' })).toBeVisible();
  });

  // ── 3. Delete non-empty list → dialog shows task count, then removes all ──
  test('deleting a non-empty list shows the task count in the confirm dialog', async ({ page }) => {
    // Requirement 6.1, 6.4
    const inbox = makeInbox();
    const workList = makeList('work-1', 'Work');
    const task1 = makeTask({ id: 't1', listId: 'work-1', title: 'Work Task 1' });
    const task2 = makeTask({ id: 't2', listId: 'work-1', title: 'Work Task 2' });

    await seedState(page, { tasks: [task1, task2], lists: [inbox, workList] });

    await page.goto('/dashboard');

    // Hover over the Work list item to reveal the delete button
    const workNavLink = page.getByRole('link', { name: 'Go to list: Work' });
    await workNavLink.hover();

    // Click the delete button for the Work list
    await page.getByRole('button', { name: 'Delete list: Work' }).click();

    // The ConfirmDialog should appear and mention the number of tasks
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('2 task');   // "2 tasks" in the message

    // Confirm the deletion
    await dialog.getByRole('button', { name: 'Confirm' }).click();

    await expect(dialog).not.toBeVisible();

    // The Work list should no longer appear in the sidebar
    await expect(page.getByRole('link', { name: 'Go to list: Work' })).not.toBeVisible();

    // The tasks that belonged to Work should also be gone from the store
    const state = await readState(page);
    const workTasks = state?.tasks.filter((t) => t.listId === 'work-1') ?? [];
    expect(workTasks).toHaveLength(0);
  });

  // ── 4. Cancel list deletion → list and tasks remain ───────────────────────
  test('cancelling list deletion leaves the list and its tasks intact', async ({ page }) => {
    // Requirement 6.4 (cancel path)
    const inbox = makeInbox();
    const workList = makeList('work-cancel', 'Work');
    const task = makeTask({ id: 'tw', listId: 'work-cancel', title: 'Work Task' });

    await seedState(page, { tasks: [task], lists: [inbox, workList] });

    await page.goto('/dashboard');

    // Trigger the delete dialog
    await page.getByRole('link', { name: 'Go to list: Work' }).hover();
    await page.getByRole('button', { name: 'Delete list: Work' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Cancel — dismiss without confirming
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).not.toBeVisible();

    // The Work list is still in the sidebar
    await expect(page.getByRole('link', { name: 'Go to list: Work' })).toBeVisible();

    // Tasks still exist
    const state = await readState(page);
    const workTasks = state?.tasks.filter((t) => t.listId === 'work-cancel') ?? [];
    expect(workTasks).toHaveLength(1);
  });

  // ── 5. Inbox list has no delete or rename UI ──────────────────────────────
  test('Inbox list does not show rename or delete buttons', async ({ page }) => {
    // Requirement 6.1 (Inbox is protected)
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.goto('/dashboard');

    // No delete button for Inbox
    await expect(page.getByRole('button', { name: 'Delete list: Inbox' })).not.toBeVisible();
    // No rename button for Inbox
    await expect(page.getByRole('button', { name: 'Rename list: Inbox' })).not.toBeVisible();
  });

  // ── 6. Rename a custom list ───────────────────────────────────────────────
  test('renames a list inline', async ({ page }) => {
    // Requirement 6.1
    const inbox = makeInbox();
    const myList = makeList('my-list', 'Old Name');
    await seedState(page, { tasks: [], lists: [inbox, myList] });

    await page.goto('/dashboard');

    // Hover over the list to expose action buttons
    await page.getByRole('link', { name: 'Go to list: Old Name' }).hover();

    // Click rename
    await page.getByRole('button', { name: 'Rename list: Old Name' }).click();

    // A rename input should appear
    const renameInput = page.getByLabel('Rename list: Old Name');
    await expect(renameInput).toBeVisible();
    await renameInput.clear();
    await renameInput.fill('New Name');
    await renameInput.press('Enter');

    // The link should now show the new name
    await expect(page.getByRole('link', { name: 'Go to list: New Name' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to list: Old Name' })).not.toBeVisible();
  });
});
