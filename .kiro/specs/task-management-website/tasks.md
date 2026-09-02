# Implementation Plan: Task Management Website

## Overview

A pure client-side SPA built with React + TypeScript. Implementation follows a bottom-up approach: data models and core logic first, then the state store, then UI components, then routing and integration, and finally end-to-end and responsive/accessibility tests. Each group targets a distinct module boundary so tasks within a wave can be worked in parallel without file conflicts.

---

## Tasks

- [x] 1. Project scaffolding and shared types
  - [x] 1.1 Initialise Vite + React + TypeScript project, install and configure Tailwind CSS, React Router v6, Vitest, React Testing Library, fast-check, and Playwright
    - Create `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
    - Add `index.html` entry point and `src/main.tsx` mounting `<App />`
    - _Requirements: 7.1, 8.1_

  - [x] 1.2 Define all shared TypeScript interfaces and enum-like string literals in `src/types.ts`
    - `Task`, `TaskList`, `AppState`, `StatusSummary`, `TaskFilter`, `TaskSort`, `NewTaskInput`, `TaskInput`, `ValidationResult`
    - `Status = "To Do" | "In Progress" | "Done"` and `Priority = "Low" | "Medium" | "High"`
    - _Requirements: 2.2, 2.3, 3.3, 4.4_

---

- [x] 2. Validator module
  - [x] 2.1 Implement all pure validator functions in `src/validator.ts`
    - `validateTaskTitle`, `validateListName`, `validateDueDate`, `validateStatus`, `validatePriority`
    - Reject empty/whitespace-only titles and list names; reject malformed ISO dates; reject unknown enum values
    - _Requirements: 1.4, 2.5, 4.3_

  - [ ]* 2.2 Write unit tests for Validator in `src/validator.test.ts`
    - Concrete boundary cases: empty string, whitespace-only, max-length, valid/invalid dates, unknown status/priority
    - _Requirements: 2.5, 4.3_

  - [ ]* 2.3 Write property test — Property 2: Task title non-emptiness invariant
    - **Property 2: For any string composed entirely of whitespace, `validateTaskTitle` SHALL return `ok: false` and the task array SHALL remain unchanged**
    - **Validates: Requirements 2.5, 4.3**
    - Tag: `Feature: task-management-website, Property 2: Task title non-emptiness invariant`
    - _Requirements: 2.5, 4.3_

---

- [x] 3. localStorage helpers
  - [x] 3.1 Implement `src/storage.ts` — `loadState(): AppState` and `saveState(state: AppState): void`
    - Wrap reads in try/catch; return fresh default state (empty tasks, one Inbox list) on parse failure
    - Catch write failures (quota exceeded) and emit a custom event for toast display
    - _Requirements: 7.1_

  - [ ]* 3.2 Write unit tests for storage helpers in `src/storage.test.ts`
    - Mock `localStorage`; test happy path, malformed JSON, and missing key
    - _Requirements: 7.1_

  - [ ]* 3.3 Write property test — Property 3: Task persistence round-trip
    - **Property 3: For any valid `Task`, `loadState(saveState({tasks:[task], lists:[inbox]}))` SHALL produce a task whose fields are strictly equal to the original**
    - **Validates: Requirements 7.1**
    - Tag: `Feature: task-management-website, Property 3: Task persistence round-trip`
    - _Requirements: 7.1_

---

- [x] 4. State store — useTaskStore
  - [x] 4.1 Implement the reducer in `src/store/reducer.ts`
    - Action types: `ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `ADD_LIST`, `RENAME_LIST`, `DELETE_LIST`
    - Enforce defaults (`status → "To Do"`, `priority → "Medium"`, `listId → Inbox id`) on `ADD_TASK`
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.4, 4.5, 5.2, 6.1_

  - [x] 4.2 Implement query helpers in `src/store/queries.ts`
    - `getTasks(tasks, filter?, sort?)` — pure filter + sort over task array
    - `getSummary(tasks): StatusSummary` — count tasks by status
    - `getListById(lists, id)` — find list by id
    - _Requirements: 3.3, 3.4, 3.5, 6.3_

  - [x] 4.3 Implement `useTaskStore` hook and `TaskStoreContext` in `src/store/useTaskStore.ts`
    - Wire `useReducer` + `useEffect` sync to `localStorage` on every state change
    - Expose action dispatchers and query helpers; provide context at app root
    - _Requirements: 2.1, 2.6, 4.2, 4.4, 5.2, 6.1_

  - [ ]* 4.4 Write unit tests for reducer in `src/store/reducer.test.ts`
    - Test every action type with concrete initial states; verify Inbox protection (cannot delete/rename)
    - _Requirements: 2.2, 2.3, 4.4, 5.2, 6.1_

  - [ ]* 4.5 Write property test — Property 1: Task creation defaults
    - **Property 1: For any non-empty title without explicit status/priority, `ADD_TASK` SHALL produce `status = "To Do"` and `priority = "Medium"`**
    - **Validates: Requirements 2.2, 2.3**
    - Tag: `Feature: task-management-website, Property 1: Task creation defaults`
    - _Requirements: 2.2, 2.3_

  - [ ]* 4.6 Write property test — Property 4: Filter correctness
    - **Property 4: For any task array and any `TaskFilter`, `getTasks(tasks, filter)` SHALL contain exactly those tasks satisfying every predicate — no over-inclusion, no omission**
    - **Validates: Requirements 3.4, 6.3**
    - Tag: `Feature: task-management-website, Property 4: Filter correctness`
    - _Requirements: 3.4, 6.3_

  - [ ]* 4.7 Write property test — Property 5: Sort ordering
    - **Property 5: For any task array and any `TaskSort`, `getTasks(tasks, undefined, sort)` SHALL be a permutation of the input ordered by the sort key and direction, with total count preserved**
    - **Validates: Requirements 3.5**
    - Tag: `Feature: task-management-website, Property 5: Sort ordering`
    - _Requirements: 3.5_

  - [ ]* 4.8 Write property test — Property 6: Status update preserves dashboard counts
    - **Property 6: For any status transition X → Y on one task, `getSummary` SHALL decrement X by 1, increment Y by 1, and leave all other counts unchanged**
    - **Validates: Requirements 4.4, 3.3**
    - Tag: `Feature: task-management-website, Property 6: Status update preserves dashboard counts`
    - _Requirements: 4.4, 3.3_

  - [ ]* 4.9 Write property test — Property 7: Task deletion shrinks list
    - **Property 7: For any task in the array, confirming deletion SHALL produce an array that does not contain that task and whose length is exactly one less**
    - **Validates: Requirements 5.2**
    - Tag: `Feature: task-management-website, Property 7: Task deletion shrinks list`
    - _Requirements: 5.2_

  - [ ]* 4.10 Write property test — Property 8: Cancelled deletion is a no-op
    - **Property 8: For any task array, cancelling a pending deletion SHALL leave the array identical in length, contents, and order**
    - **Validates: Requirements 5.3**
    - Tag: `Feature: task-management-website, Property 8: Cancelled deletion is a no-op`
    - _Requirements: 5.3_

  - [ ]* 4.11 Write property test — Property 9: Inbox fallback invariant
    - **Property 9: For any task created without an explicit `listId`, the stored task's `listId` SHALL equal the Inbox list's id**
    - **Validates: Requirements 6.5**
    - Tag: `Feature: task-management-website, Property 9: Inbox fallback invariant`
    - _Requirements: 6.5_

  - [ ]* 4.12 Write property test — Property 10: List CRUD invariants
    - **Property 10: `addList` increments list length by 1; `renameList` changes only the targeted name; `deleteList(id, true)` removes the list and all its tasks**
    - **Validates: Requirements 6.1**
    - Tag: `Feature: task-management-website, Property 10: List CRUD invariants`
    - _Requirements: 6.1_

- [x] 5. Checkpoint — core logic tests
  - Ensure all Validator, storage, reducer, and query tests pass before proceeding to UI. Ask the user if any issues arise.

---

- [x] 6. Shared UI components
  - [x] 6.1 Implement `<ConfirmDialog>` in `src/components/ConfirmDialog.tsx`
    - Props: `message`, `onConfirm`, `onCancel`; rendered as a modal overlay
    - Focus-trapped, keyboard-accessible (Escape → cancel, Enter → confirm)
    - _Requirements: 5.1, 6.4_

  - [x] 6.2 Implement `<EmptyState>` in `src/components/EmptyState.tsx`
    - Props: `message`, optional `ctaLabel` and `onCta`
    - Shows the prompt to create a first task when there are no tasks
    - _Requirements: 3.6_

  - [x] 6.3 Implement `<TaskCard>` in `src/components/TaskCard.tsx`
    - Renders title, status badge, priority badge, due date chip, edit link, delete button
    - Applies strikethrough + muted Tailwind classes when `status === "Done"`
    - Min touch target 44×44 CSS px on interactive elements
    - _Requirements: 3.2, 4.6, 8.3_

  - [x] 6.4 Implement `<DashboardSummary>` in `src/components/DashboardSummary.tsx`
    - Displays three status count chips (To Do / In Progress / Done) from `getSummary`
    - _Requirements: 3.3, 4.4_

  - [x] 6.5 Implement `<FilterSortBar>` in `src/components/FilterSortBar.tsx`
    - Controlled dropdowns for status filter, priority filter, due-date filter, and sort key/direction
    - Dispatches `TaskFilter` / `TaskSort` changes to parent via callbacks
    - _Requirements: 3.4, 3.5_

  - [x] 6.6 Implement `<Sidebar>` in `src/components/Sidebar.tsx`
    - Lists all task lists; highlights active list
    - Inline "New list" input, rename in-place, delete button (hidden for Inbox)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 6.7 Write component tests for shared UI components in `src/components/*.test.tsx`
    - `<TaskCard>`: renders fields, applies Done styling, calls delete handler
    - `<DashboardSummary>`: correct counts for a known task array
    - `<FilterSortBar>`: dispatches correct callback values on change
    - `<ConfirmDialog>`: calls `onConfirm`/`onCancel` correctly, keyboard behavior
    - `<EmptyState>`: renders when list is empty
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.6, 5.1_

---

- [x] 7. Task form component
  - [x] 7.1 Implement `<TaskForm>` in `src/components/TaskForm.tsx`
    - Shared create/edit form: title (required), description, status, priority, due date, list selector
    - Inline validation via `Validator`; error messages adjacent to fields
    - Submits via `addTask` or `updateTask` from `useTaskStore`; no page reload on success
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.5_

  - [ ]* 7.2 Write component tests for `<TaskForm>` in `src/components/TaskForm.test.tsx`
    - Submit with blank title → inline error shown, no store mutation
    - Submit with valid data → store action called with correct payload
    - Edit pre-population: all fields match existing task values
    - _Requirements: 2.5, 4.1, 4.3_

---

- [ ] 8. Page views and routing
  - [x] 8.1 Implement `src/App.tsx` with React Router v6 routes
    - `/` → redirect to `/dashboard`
    - `/dashboard` → `<DashboardPage>`
    - `/lists/:listId` → `<ListPage>`
    - `/tasks/new` → `<NewTaskPage>`
    - `/tasks/:taskId` → `<EditTaskPage>`
    - Wrap the router with `TaskStoreContext` provider
    - _Requirements: 3.1, 6.3_

  - [x] 8.2 Implement `<DashboardPage>` in `src/pages/DashboardPage.tsx`
    - Renders `<DashboardSummary>`, `<FilterSortBar>`, and a list of `<TaskCard>` for all tasks (respecting active filter/sort)
    - Renders `<EmptyState>` when there are no tasks
    - Single-column layout on viewports < 768 px (Tailwind responsive classes)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 8.2_

  - [ ] 8.3 Implement `<ListPage>` in `src/pages/ListPage.tsx`
    - Same structure as `<DashboardPage>` but `getTasks` receives `{ listId }` filter
    - Renders `<EmptyState>` if list has no tasks or list id is unknown
    - _Requirements: 6.3_

  - [ ] 8.4 Implement `<NewTaskPage>` in `src/pages/NewTaskPage.tsx`
    - Renders `<TaskForm>` in create mode; on success navigates back to Dashboard
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ] 8.5 Implement `<EditTaskPage>` in `src/pages/EditTaskPage.tsx`
    - Loads task by `taskId` param; renders `<EmptyState>` (not found) if absent
    - Renders `<TaskForm>` in edit mode pre-populated with current data
    - On success navigates back; delete button triggers `<ConfirmDialog>` then `deleteTask`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_

  - [ ]* 8.6 Write component/integration tests for page views in `src/pages/*.test.tsx`
    - `<DashboardPage>`: renders tasks, shows summary, empty state when no tasks
    - `<EditTaskPage>`: loads task data, delete flow triggers confirm dialog
    - _Requirements: 3.1, 3.6, 4.1, 5.1_

- [ ] 9. Checkpoint — all unit and component tests
  - Run `vitest --run` and confirm all tests pass. Ask the user if any failures arise.

---

- [ ] 10. Playwright end-to-end tests
  - [ ] 10.1 Write E2E tests for core task flows in `e2e/tasks.spec.ts`
    - Create task → verify appears on dashboard
    - Edit task status → verify summary counts update immediately
    - Delete task → confirm dialog → verify removed without page reload
    - Attempt blank-title task → verify inline error, count unchanged
    - Reload page → verify tasks persist from localStorage
    - _Requirements: 2.1, 2.5, 2.6, 3.1, 3.3, 4.4, 5.1, 5.2, 7.1_

  - [ ] 10.2 Write E2E tests for task list flows in `e2e/lists.spec.ts`
    - Create task list → assign task → view scoped list → verify only that task shown
    - Create task without list → verify it appears in Inbox
    - Delete non-empty list → confirm dialog shows task count → confirm → list and tasks gone
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 10.3 Write responsive layout tests in `e2e/responsive.spec.ts`
    - Viewport tests at 320 px, 768 px, 1280 px, and 2560 px
    - Sub-768 px: tasks in single-column layout
    - Touch target size ≥ 44×44 CSS px for buttons and links
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 10.4 Write accessibility tests in `e2e/accessibility.spec.ts`
    - axe-core scans on Dashboard, New Task, Edit Task, and List pages (WCAG 2.1 AA)
    - Keyboard navigation: create → edit → delete flow using Tab/Enter/Escape
    - ARIA labels on icon-only buttons verified via attribute checks
    - _Requirements: 8.1, 8.3_

- [ ] 11. Final checkpoint — full test suite
  - Run `vitest --run` and `playwright test`. Ensure all tests pass. Ask the user if any issues arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Property tests operate on in-memory state only — `localStorage` must be mocked in test setup
- The Inbox list is created on first app load; it cannot be deleted or renamed — this is enforced in the reducer and hidden in the Sidebar UI
- All page navigation after mutations uses React Router's `useNavigate` (no full page reload)
- Tailwind responsive prefixes (`sm:`, `md:`) handle all layout breakpoints — no custom CSS needed
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "7.1"] },
    { "id": 5, "tasks": ["6.7", "7.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
