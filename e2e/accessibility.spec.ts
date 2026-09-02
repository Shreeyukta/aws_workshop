/**
 * E2E tests — Accessibility
 *
 * Requirements: 8.1, 8.3
 *
 * Covers:
 *  - axe-core WCAG 2.1 AA scans on Dashboard, New Task, Edit Task, and List pages
 *  - Keyboard navigation: create → edit → delete flow (Tab / Enter / Escape)
 *  - ARIA labels on icon-only buttons verified via attribute checks
 *
 * NOTE: axe-core automated scans detect a significant portion of WCAG issues but
 * do not replace manual testing with assistive technologies. Results here are
 * indicative, not exhaustive.
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { AppState, Task, TaskList } from '../src/types';

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
    id: 'task-a11y',
    listId: 'inbox-1',
    title: 'Accessibility Task',
    status: 'To Do',
    priority: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── axe scans ────────────────────────────────────────────────────────────────

test.describe('Accessibility — axe-core WCAG 2.1 AA scans', () => {
  // ── Dashboard page ─────────────────────────────────────────────────────────
  test('Dashboard page has no WCAG 2.1 AA violations', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'ax-dash', listId: 'inbox-1', title: 'Axe Dashboard Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Dashboard"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // ── New Task page ───────────────────────────────────────────────────────────
  test('New Task page has no WCAG 2.1 AA violations', async ({ page }) => {
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.goto('/tasks/new');
    await page.waitForSelector('[aria-label="Create new task"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // ── Edit Task page ──────────────────────────────────────────────────────────
  test('Edit Task page has no WCAG 2.1 AA violations', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'ax-edit', listId: 'inbox-1', title: 'Axe Edit Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto(`/tasks/ax-edit`);
    await page.waitForSelector('[aria-label="Edit task"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // ── List page ───────────────────────────────────────────────────────────────
  test('List page has no WCAG 2.1 AA violations', async ({ page }) => {
    const inbox = makeInbox();
    const customList = makeList('list-ax', 'My List');
    const task = makeTask({ id: 'ax-list-task', listId: 'list-ax', title: 'List Axe Task' });
    await seedState(page, { tasks: [task], lists: [inbox, customList] });

    await page.goto('/lists/list-ax');
    await page.waitForSelector('main');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

test.describe('Accessibility — keyboard navigation', () => {
  // ── Create a task using keyboard only ─────────────────────────────────────
  test('can create a task using keyboard navigation', async ({ page }) => {
    // Requirement 8.3
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.goto('/dashboard');

    // Focus the "New Task" link via Tab and activate it
    await page.keyboard.press('Tab');
    // Keep tabbing until the "Create new task" link is focused
    // (We can also just navigate directly since the URL is deterministic)
    await page.getByRole('link', { name: 'Create new task' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/tasks/new');

    // Tab to the title field and type
    await page.getByLabel('Title').focus();
    await page.keyboard.type('Keyboard Created Task');

    // Tab to the submit button and press Enter
    await page.getByRole('button', { name: 'Create task' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('article', { name: 'Task: Keyboard Created Task' })).toBeVisible();
  });

  // ── Edit a task using keyboard only ───────────────────────────────────────
  test('can open and save an edit form using keyboard navigation', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'kb-edit', listId: 'inbox-1', title: 'Keyboard Edit Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Focus the edit link for the task
    const editLink = page.getByRole('link', { name: 'Edit task: Keyboard Edit Task' });
    await editLink.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/tasks\/kb-edit/);

    // Change the title using keyboard
    const titleInput = page.getByLabel('Title');
    await titleInput.focus();
    await page.keyboard.press('Control+A'); // select all
    await page.keyboard.type('Renamed via Keyboard');

    // Submit with Enter on the Save button
    await page.getByRole('button', { name: 'Save changes' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('article', { name: 'Task: Renamed via Keyboard' })).toBeVisible();
  });

  // ── Confirm-dialog keyboard flow: Enter confirms, Escape cancels ──────────
  test('Escape key cancels the delete dialog without deleting the task', async ({ page }) => {
    // Requirement 5.1 (keyboard cancel)
    const inbox = makeInbox();
    const task = makeTask({ id: 'kb-del-cancel', listId: 'inbox-1', title: 'Escape Cancel Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Open the delete dialog via keyboard
    const deleteBtn = page.getByRole('button', { name: 'Delete task: Escape Cancel Task' });
    await deleteBtn.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Task still exists
    await expect(page.getByRole('article', { name: 'Task: Escape Cancel Task' })).toBeVisible();
  });

  test('Enter key confirms the delete dialog and removes the task', async ({ page }) => {
    // Requirement 5.2 (keyboard confirm)
    const inbox = makeInbox();
    const task = makeTask({ id: 'kb-del-confirm', listId: 'inbox-1', title: 'Enter Confirm Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    // Open the delete dialog
    const deleteBtn = page.getByRole('button', { name: 'Delete task: Enter Confirm Task' });
    await deleteBtn.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The Cancel button is auto-focused on open; Tab to Confirm, then Enter
    // (or just press Enter — the ConfirmDialog responds to Enter globally)
    await page.keyboard.press('Enter');

    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('article', { name: 'Task: Enter Confirm Task' })).not.toBeVisible();
  });

  // ── Focus trap inside the ConfirmDialog ───────────────────────────────────
  test('Tab key stays within the ConfirmDialog (focus trap)', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'kb-trap', listId: 'inbox-1', title: 'Focus Trap Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Delete task: Focus Trap Task' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The Cancel button gets auto-focus on open
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();

    // Tab once → Confirm button should be focused
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeFocused();

    // Tab again → should wrap back to Cancel (focus trap)
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();

    // Clean up: dismiss the dialog
    await page.keyboard.press('Escape');
  });
});

// ─── ARIA labels on icon-only interactive elements ────────────────────────────

test.describe('Accessibility — ARIA labels on icon-only buttons', () => {
  test('TaskCard edit link has an aria-label', async ({ page }) => {
    // Requirement 8.3
    const inbox = makeInbox();
    const task = makeTask({ id: 'aria-1', listId: 'inbox-1', title: 'ARIA Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    const editLink = page.getByRole('link', { name: 'Edit task: ARIA Task' });
    await expect(editLink).toBeVisible();
    await expect(editLink).toHaveAttribute('aria-label', 'Edit task: ARIA Task');
  });

  test('TaskCard delete button has an aria-label', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'aria-2', listId: 'inbox-1', title: 'ARIA Delete Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/dashboard');

    const deleteBtn = page.getByRole('button', { name: 'Delete task: ARIA Delete Task' });
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toHaveAttribute('aria-label', 'Delete task: ARIA Delete Task');
  });

  test('Sidebar "New list" button is accessible', async ({ page }) => {
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');

    // The "New list" button should be discoverable by its text
    const newListBtn = page.getByRole('button', { name: 'New list' });
    await expect(newListBtn).toBeVisible();
  });

  test('Sidebar list delete button has an aria-label', async ({ page }) => {
    const inbox = makeInbox();
    const list = makeList('aria-list', 'ARIA List');
    await seedState(page, { tasks: [], lists: [inbox, list] });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');

    // Hover to expose the delete button
    await page.getByRole('link', { name: 'Go to list: ARIA List' }).hover();

    const deleteBtn = page.getByRole('button', { name: 'Delete list: ARIA List' });
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toHaveAttribute('aria-label', 'Delete list: ARIA List');
  });

  test('Sidebar list rename button has an aria-label', async ({ page }) => {
    const inbox = makeInbox();
    const list = makeList('aria-rename-list', 'Rename Me');
    await seedState(page, { tasks: [], lists: [inbox, list] });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');

    await page.getByRole('link', { name: 'Go to list: Rename Me' }).hover();

    const renameBtn = page.getByRole('button', { name: 'Rename list: Rename Me' });
    await expect(renameBtn).toBeVisible();
    await expect(renameBtn).toHaveAttribute('aria-label', 'Rename list: Rename Me');
  });

  test('Edit Task page "Delete this task" button has an aria-label', async ({ page }) => {
    const inbox = makeInbox();
    const task = makeTask({ id: 'aria-edit-del', listId: 'inbox-1', title: 'Edit Delete ARIA Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.goto('/tasks/aria-edit-del');
    await page.waitForSelector('[aria-label="Edit task"]');

    const deleteBtn = page.getByRole('button', { name: 'Delete this task' });
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toHaveAttribute('aria-label', 'Delete this task');
  });

  test('DashboardSummary chips have accessible aria-labels', async ({ page }) => {
    const inbox = makeInbox();
    const tasks = [
      makeTask({ id: 's1', listId: 'inbox-1', title: 'T1', status: 'To Do' }),
      makeTask({ id: 's2', listId: 'inbox-1', title: 'T2', status: 'In Progress' }),
      makeTask({ id: 's3', listId: 'inbox-1', title: 'T3', status: 'Done' }),
    ];
    await seedState(page, { tasks, lists: [inbox] });

    await page.goto('/dashboard');

    const summary = page.getByRole('region', { name: 'Task status summary' });
    await expect(summary.getByLabel(/To Do: 1 task/i)).toBeVisible();
    await expect(summary.getByLabel(/In Progress: 1 task/i)).toBeVisible();
    await expect(summary.getByLabel(/Done: 1 task/i)).toBeVisible();
  });
});
