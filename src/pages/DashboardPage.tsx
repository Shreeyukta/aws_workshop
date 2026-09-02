import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { DashboardSummary } from '../components/DashboardSummary';
import { FilterSortBar } from '../components/FilterSortBar';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Sidebar } from '../components/Sidebar';
import type { TaskFilter, TaskSort } from '../types';

/**
 * DashboardPage — main landing page after the root redirect.
 *
 * Layout:
 *  ┌──────────────┬────────────────────────────┐
 *  │   Sidebar    │   Main content area         │
 *  │  (≥ md)      │  Header + Summary + Filters │
 *  │              │  Task grid (1→2→3 cols)     │
 *  └──────────────┴────────────────────────────┘
 *
 * On viewports < 768 px the sidebar collapses and tasks render in a single
 * column (Tailwind `md:` prefix handles the breakpoint).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 8.2
 */
function DashboardPage() {
  const { queries, actions } = useTaskStore();
  const navigate = useNavigate();

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [filter, setFilter] = useState<TaskFilter>({});
  const [sort, setSort] = useState<TaskSort>({ by: 'createdAt', order: 'asc' });

  // ── Deletion confirmation state ──────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────
  const summary = queries.getSummary();
  const tasks = queries.getTasks(filter, sort);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleDeleteRequest(id: string) {
    setDeletingId(id);
  }

  function handleDeleteConfirm() {
    if (deletingId) {
      actions.deleteTask(deletingId);
    }
    setDeletingId(null);
  }

  function handleDeleteCancel() {
    setDeletingId(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar — hidden on mobile, shown from md breakpoint ── */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 md:block">
        <Sidebar />
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8" aria-label="Dashboard">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              All your tasks in one place.
            </p>
          </div>

          {/* New Task button */}
          <Link
            to="/tasks/new"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Create new task"
          >
            {/* Plus icon */}
            <svg
              className="h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            New Task
          </Link>
        </div>

        {/* ── Status summary chips ── */}
        <section aria-label="Task status summary" className="mb-5">
          <DashboardSummary summary={summary} />
        </section>

        {/* ── Filter / sort bar ── */}
        <section aria-label="Filter and sort" className="mb-6">
          <FilterSortBar
            filter={filter}
            sort={sort}
            onFilterChange={setFilter}
            onSortChange={setSort}
          />
        </section>

        {/* ── Task list or empty state ── */}
        {tasks.length === 0 ? (
          <EmptyState
            message="No tasks here yet. Create your first task to get started."
            ctaLabel="+ New Task"
            onCta={() => navigate('/tasks/new')}
          />
        ) : (
          <section aria-label="Task list">
            {/* Single column on mobile, 2-col on md, 3-col on lg */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Delete confirmation dialog ── */}
      {deletingId && (
        <ConfirmDialog
          message="Delete this task? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}

export default DashboardPage;
