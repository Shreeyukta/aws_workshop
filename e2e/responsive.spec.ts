/**
 * E2E tests — Responsive layout
 *
 * Requirements: 8.1, 8.2, 8.3
 *
 * Covers:
 *  - Correct rendering at 320 px, 768 px, 1280 px, and 2560 px viewport widths
 *  - Sub-768 px: tasks render in a single-column layout
 *  - Touch target size ≥ 44×44 CSS px for buttons and links
 *
 * Viewport height is fixed at 900 px for all tests; only width varies.
 */

import { test, expect, Page } from '@playwright/test';
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

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    listId: 'inbox-1',
    title: 'Responsive Task',
    status: 'To Do',
    priority: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Returns the bounding box of the element at the given selector. */
async function getBoundingBox(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible' });
  return el.boundingBox();
}

// ─── Viewport configurations ──────────────────────────────────────────────────

const VIEWPORTS = [
  { label: 'mobile (320 px)', width: 320, height: 900 },
  { label: 'tablet (768 px)', width: 768, height: 900 },
  { label: 'desktop (1280 px)', width: 1280, height: 900 },
  { label: 'wide (2560 px)', width: 2560, height: 900 },
] as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  // ── 1. All pages render without overflow at each breakpoint ───────────────
  for (const vp of VIEWPORTS) {
    test(`dashboard renders without horizontal overflow at ${vp.label}`, async ({ page }) => {
      // Requirement 8.1
      const inbox = makeInbox();
      const task = makeTask({ id: `task-${vp.width}`, listId: inbox.id });
      await seedState(page, { tasks: [task], lists: [inbox] });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/dashboard');

      // Wait for the main content area
      await page.waitForSelector('[aria-label="Dashboard"]');

      // Check that the body does not have horizontal scroll overflow
      const bodyScrollWidth: number = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(vp.width + 5); // 5 px tolerance for scrollbar
    });
  }

  // ── 2. Sub-768 px: tasks in a single-column layout ────────────────────────
  test('task grid is single-column on 320 px viewport', async ({ page }) => {
    // Requirement 8.2
    const inbox = makeInbox();
    const tasks = [
      makeTask({ id: 't1', listId: 'inbox-1', title: 'Task One' }),
      makeTask({ id: 't2', listId: 'inbox-1', title: 'Task Two' }),
    ];
    await seedState(page, { tasks, lists: [inbox] });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/dashboard');

    // Wait for both task cards
    await page.waitForSelector('[aria-label="Task: Task One"]');
    await page.waitForSelector('[aria-label="Task: Task Two"]');

    // Measure the left offset of both cards — in a single-column layout they
    // should have the same x position (within 1 px tolerance for sub-pixel rendering).
    const box1 = await page.locator('[aria-label="Task: Task One"]').boundingBox();
    const box2 = await page.locator('[aria-label="Task: Task Two"]').boundingBox();

    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (box1 && box2) {
      // Single-column: cards should have the same left edge
      expect(Math.abs(box1.x - box2.x)).toBeLessThanOrEqual(1);

      // And neither card width should exceed the viewport width
      expect(box1.width).toBeLessThanOrEqual(320 + 5);
      expect(box2.width).toBeLessThanOrEqual(320 + 5);
    }
  });

  test('task grid uses multiple columns on 1280 px viewport', async ({ page }) => {
    // Requirement 8.1 — wider viewports use multi-column layout
    const inbox = makeInbox();
    const tasks = Array.from({ length: 4 }, (_, i) =>
      makeTask({ id: `t${i}`, listId: 'inbox-1', title: `Task ${i + 1}` }),
    );
    await seedState(page, { tasks, lists: [inbox] });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');

    // Wait for the first two task cards
    await page.waitForSelector('[aria-label="Task: Task 1"]');
    await page.waitForSelector('[aria-label="Task: Task 2"]');

    const box1 = await page.locator('[aria-label="Task: Task 1"]').boundingBox();
    const box2 = await page.locator('[aria-label="Task: Task 2"]').boundingBox();

    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (box1 && box2) {
      // Multi-column: the two cards should be on the same row (same y) and have
      // different x positions (side by side)
      expect(Math.abs(box1.y - box2.y)).toBeLessThanOrEqual(1);   // same row
      expect(Math.abs(box1.x - box2.x)).toBeGreaterThan(10);       // different columns
    }
  });

  // ── 3. Touch target size ≥ 44×44 CSS px ──────────────────────────────────
  test('New Task button meets 44×44 minimum touch target at 320 px', async ({ page }) => {
    // Requirement 8.3
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/tasks/new');

    // Verify submit button touch target
    const submitBtn = page.getByRole('button', { name: 'Create task' });
    const box = await submitBtn.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('task card action buttons (edit/delete) meet 44×44 touch target', async ({ page }) => {
    // Requirement 8.3
    const inbox = makeInbox();
    const task = makeTask({ id: 'tc-touch', listId: inbox.id, title: 'Touch Target Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    // Edit link
    const editLink = page.getByRole('link', { name: 'Edit task: Touch Target Task' });
    const editBox = await editLink.boundingBox();
    expect(editBox).not.toBeNull();
    if (editBox) {
      expect(editBox.width).toBeGreaterThanOrEqual(44);
      expect(editBox.height).toBeGreaterThanOrEqual(44);
    }

    // Delete button
    const deleteBtn = page.getByRole('button', { name: 'Delete task: Touch Target Task' });
    const deleteBox = await deleteBtn.boundingBox();
    expect(deleteBox).not.toBeNull();
    if (deleteBox) {
      expect(deleteBox.width).toBeGreaterThanOrEqual(44);
      expect(deleteBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Confirm/Cancel dialog buttons meet 44×44 touch target', async ({ page }) => {
    // Requirement 8.3
    const inbox = makeInbox();
    const task = makeTask({ id: 'tc-dialog', listId: inbox.id, title: 'Dialog Touch Task' });
    await seedState(page, { tasks: [task], lists: [inbox] });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    // Open the confirm dialog
    await page.getByRole('button', { name: 'Delete task: Dialog Touch Task' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    for (const btnName of ['Confirm', 'Cancel']) {
      const btn = dialog.getByRole('button', { name: btnName });
      const box = await btn.boundingBox();
      expect(box, `${btnName} button must have a bounding box`).not.toBeNull();
      if (box) {
        expect(box.width, `${btnName} button width`).toBeGreaterThanOrEqual(44);
        expect(box.height, `${btnName} button height`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // ── 4. Sidebar is hidden on mobile, visible on desktop ────────────────────
  test('sidebar is hidden on 320 px viewport', async ({ page }) => {
    // Requirement 8.2
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/dashboard');

    // The sidebar <aside> uses `hidden md:block` — invisible at 320 px
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();
  });

  test('sidebar is visible on 1280 px viewport', async ({ page }) => {
    // Requirement 8.1
    const inbox = makeInbox();
    await seedState(page, { tasks: [], lists: [inbox] });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });
});
