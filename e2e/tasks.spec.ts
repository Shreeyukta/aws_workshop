/**
 * E2E tests — Core task flows
 *
 * Requirements: 2.1, 2.5, 2.6, 3.1, 3.3, 4.4, 5.1, 5.2, 7.1
 *
 * Covers:
 *  - Create task → verify it appears on dashboard
 *  - Edit task status → verify summary counts update immediately
 *  - Delete task → confirm dialog → verify removed without page reload
 *  - Attempt blank-title task → verify inline error, count unchanged
 *  - Reload page → verify tasks persist from localStorage
 *
 * Each test is self-contained: state is injected via page.addInitScript
 * (where needed) or built through the UI, and localStorage is cleared
 * between tests via beforeEach.
 */

import { test, expect, Page } from '@playwright/test';
import type { AppState, Task, TaskList } from '../src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seed localStorage with a known AppState before the page loads. */
async function seedState(page: Page, state: AppState) {
  await page.addInitScript((serialised) => {
    localStorage.setItem('task-app-state', serialised);
  }, JSON.stringify(state));
}

/** Build a minimal Inbox TaskList. */
function makeInbox(id = 'inbox-1'): TaskList {
  return {
    id,
    name: 'Inbox',
    isInbox: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Build a minimal Task. */
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

/** Read the raw AppState from localStorage inside the running page. */
async function readState(page: Page): Promise<AppState | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('task-app-state');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Core task flows', () => {
  // Start each test with a clean state (just an Inbox list, no tasks).
  test.beforeEach(async ({ page }) => {
    const cleanState: AppState = {
      tasks: [],
      lists: [makeInbox()],
    };
    await seedState(page, cleanState);
  });

  // ── 1. Create task → verify it appears on the dashboard ───────────────────
  test('creates a task via the form and it appears on the dashboard', async ({ page }) => {
    // Requirement 2.1, 2.6, 3.1
    await page.goto('/dashboard');

    // Navigate to the new-task form
    await page.getByRole('link', { name: 'Create new task' }).click();
    await expect(page).toHaveURL('/tasks/new');

    // Fill in the title
    const titleInput = page.getByLabel('Title');
    await titleInput.fill('My E2E Task');

    // Submit the form
    await page.getByRole('button', { name: 'Create task' }).click();

    // Should navigate back to dashboard after success
    await expect(page).toHaveURL('/dashboard');

    // The task card should now be visible
    await expect(page.getByRole('article', { name: 'Task: My E2E Task' })).toBeVisible();
  });

  // ── 2. Edit task status → summary counts update immediately ───────────────
  test('editing task status immediately updates the dashboard summary counts', async ({ page }) => {
    // Requirement 4.4, 3.3
    const inbox = makeInbox();
    const task = makeTask({ id: 'task-status-1', listId: inbox.id, title: 'Status Task', status: 'To Do' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // The summary should show 1 To Do initially
    const summaryRegion = page.getByRole('region', { name: 'Task status summary' });
    await expect(summaryRegion.getByLabel(/To Do: 1 task/i)).toBeVisible();
    await expect(summaryRegion.getByLabel(/In Progress: 0 tasks/i)).toBeVisible();

    // Open the edit page for the task
    await page.getByRole('link', { name: 'Edit task: Status Task' }).click();
    await expect(page).toHaveURL(/\/tasks\/task-status-1/);

    // Change the status to "In Progress"
    await page.getByLabel('Status').selectOption('In Progress');

    // Save
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Back on the dashboard the counts should reflect the change
    await expect(page).toHaveURL('/dashboard');
    const updatedSummary = page.getByRole('region', { name: 'Task status summary' });
    await expect(updatedSummary.getByLabel(/To Do: 0 tasks/i)).toBeVisible();
    await expect(updatedSummary.getByLabel(/In Progress: 1 task/i)).toBeVisible();
  });

  // ── 3. Delete task → confirm dialog → verify removed without page reload ──
  test('deletes a task after confirming the dialog', async ({ page }) => {
    // Requirement 5.1, 5.2
    const inbox = makeInbox();
    const task = makeTask({ id: 'task-delete-1', listId: inbox.id, title: 'Delete Me' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Verify the task is present
    const taskCard = page.getByRole('article', { name: 'Task: Delete Me' });
    await expect(taskCard).toBeVisible();

    // Click the delete button on the task card
    await page.getByRole('button', { name: 'Delete task: Delete Me' }).click();

    // A ConfirmDialog should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/delete this task/i)).toBeVisible();

    // Confirm the deletion
    await dialog.getByRole('button', { name: 'Confirm' }).click();

    // The dialog should close and the task should be gone — no full page reload
    await expect(dialog).not.toBeVisible();
    await expect(taskCard).not.toBeVisible();

    // Verify the URL has NOT changed (no reload)
    expect(page.url()).toContain('/dashboard');
  });

  // ── 4. Cancel deletion → task remains unchanged ────────────────────────────
  test('cancelling the delete dialog leaves the task unchanged', async ({ page }) => {
    // Requirement 5.1, 5.3 (cancelled deletion is a no-op)
    const inbox = makeInbox();
    const task = makeTask({ id: 'task-cancel-1', listId: inbox.id, title: 'Keep Me' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Click delete, then cancel
    await page.getByRole('button', { name: 'Delete task: Keep Me' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Dialog closed, task still visible
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('article', { name: 'Task: Keep Me' })).toBeVisible();
  });

  // ── 5. Blank-title task → inline error, count unchanged ───────────────────
  test('submitting a blank title shows an inline error and does not create a task', async ({ page }) => {
    // Requirement 2.5, 4.3
    await page.goto('/tasks/new');

    // Count cards before (should be 0 tasks in state)
    // Leave the title empty and submit
    await page.getByRole('button', { name: 'Create task' }).click();

    // An inline error message should appear near the title field
    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/title/i);

    // We should still be on the new-task page (not redirected)
    await expect(page).toHaveURL('/tasks/new');

    // State should have no tasks
    const state = await readState(page);
    expect(state?.tasks).toHaveLength(0);
  });

  // ── 6. Whitespace-only title shows error ──────────────────────────────────
  test('submitting a whitespace-only title shows an inline error', async ({ page }) => {
    // Requirement 2.5
    await page.goto('/tasks/new');

    await page.getByLabel('Title').fill('   ');
    await page.getByRole('button', { name: 'Create task' }).click();

    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible();
    await expect(page).toHaveURL('/tasks/new');

    const state = await readState(page);
    expect(state?.tasks).toHaveLength(0);
  });

  // ── 7. Tasks persist across page reload (localStorage) ────────────────────
  test('tasks survive a full page reload via localStorage', async ({ page }) => {
    // Requirement 7.1
    const inbox = makeInbox();
    const task = makeTask({ id: 'task-persist-1', listId: inbox.id, title: 'Persisted Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Task is visible before reload
    await expect(page.getByRole('article', { name: 'Task: Persisted Task' })).toBeVisible();

    // Reload the page
    await page.reload();

    // Task should still be visible after reload (loaded from localStorage)
    await expect(page.getByRole('article', { name: 'Task: Persisted Task' })).toBeVisible();
  });

  // ── 8. New task defaults to "To Do" status and "Medium" priority ──────────
  test('a newly created task has default status "To Do" and priority "Medium"', async ({ page }) => {
    // Requirement 2.2, 2.3
    await page.goto('/tasks/new');

    await page.getByLabel('Title').fill('Defaults Task');
    await page.getByRole('button', { name: 'Create task' }).click();

    await expect(page).toHaveURL('/dashboard');

    // Check the task card shows the correct default badges
    const card = page.getByRole('article', { name: 'Task: Defaults Task' });
    await expect(card.getByLabel('Status: To Do')).toBeVisible();
    await expect(card.getByLabel('Priority: Medium')).toBeVisible();
  });

  // ── 9. Done task receives strikethrough styling ────────────────────────────
  test('a task with status "Done" renders with strikethrough styling', async ({ page }) => {
    // Requirement 4.6
    const inbox = makeInbox();
    const task = makeTask({ id: 'task-done-1', listId: inbox.id, title: 'Done Task', status: 'Done' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // The title paragraph inside the card should have a line-through class
    const titleEl = page.getByRole('article', { name: 'Task: Done Task' }).locator('p').first();
    await expect(titleEl).toHaveClass(/line-through/);
  });
});
