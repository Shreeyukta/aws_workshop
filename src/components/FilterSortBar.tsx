import type { TaskFilter, TaskSort, Status, Priority } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterSortBarProps {
  /** Current filter state controlled by the parent. */
  filter: TaskFilter;
  /** Current sort state controlled by the parent. */
  sort: TaskSort;
  /** Called when any filter value changes. */
  onFilterChange: (filter: TaskFilter) => void;
  /** Called when the sort key or direction changes. */
  onSortChange: (sort: TaskSort) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: Status | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'To Do', value: 'To Do' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Done', value: 'Done' },
];

const PRIORITY_OPTIONS: { label: string; value: Priority | '' }[] = [
  { label: 'All Priorities', value: '' },
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
];

const SORT_BY_OPTIONS: { label: string; value: TaskSort['by'] }[] = [
  { label: 'Creation Date', value: 'createdAt' },
  { label: 'Due Date', value: 'dueDate' },
  { label: 'Priority', value: 'priority' },
];

const SORT_ORDER_OPTIONS: { label: string; value: TaskSort['order'] }[] = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

// ─── Shared select style ──────────────────────────────────────────────────────

/**
 * Shared Tailwind classes for all <select> elements.
 * min-h-[44px] and py-2.5 ensure the 44 CSS px touch-target (Req 8.3).
 */
const SELECT_CLS =
  'min-h-[44px] w-full rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-8 ' +
  'text-sm text-gray-900 shadow-sm ' +
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'hover:border-gray-400 ' +
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A controlled filter-and-sort toolbar for the task dashboard.
 *
 * Provides four dropdowns:
 *   1. Status filter — "All Statuses", "To Do", "In Progress", "Done"
 *   2. Priority filter — "All Priorities", "Low", "Medium", "High"
 *   3. Due-date filter — a native date picker (ISO string)
 *   4. Sort by + direction — key ("createdAt" | "dueDate" | "priority") and order
 *
 * All state is fully controlled: the parent owns the current values and
 * receives updates via `onFilterChange` / `onSortChange`.
 *
 * Requirements: 3.4, 3.5, 8.3
 */
export function FilterSortBar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: FilterSortBarProps) {
  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Status | '';
    onFilterChange({
      ...filter,
      status: value === '' ? undefined : value,
    });
  }

  function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Priority | '';
    onFilterChange({
      ...filter,
      priority: value === '' ? undefined : value,
    });
  }

  function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value; // ISO date string "YYYY-MM-DD" or ""
    onFilterChange({
      ...filter,
      dueDate: value === '' ? undefined : value,
    });
  }

  function handleSortByChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSortChange({
      ...sort,
      by: e.target.value as TaskSort['by'],
    });
  }

  function handleSortOrderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSortChange({
      ...sort,
      order: e.target.value as TaskSort['order'],
    });
  }

  function handleClearFilters() {
    onFilterChange({ listId: filter.listId }); // preserve listId, clear the rest
    onSortChange({ by: 'createdAt', order: 'asc' });
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const hasActiveFilters =
    filter.status !== undefined ||
    filter.priority !== undefined ||
    filter.dueDate !== undefined;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section
      aria-label="Filter and sort tasks"
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3">
        {/* ── Filter group label (visually hidden on small screens) ── */}
        <div className="hidden shrink-0 items-center sm:flex">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Filters
          </span>
        </div>

        {/* ── Status filter ── */}
        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="filter-status"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filter.status ?? ''}
            onChange={handleStatusChange}
            className={SELECT_CLS}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Priority filter ── */}
        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="filter-priority"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Priority
          </label>
          <select
            id="filter-priority"
            value={filter.priority ?? ''}
            onChange={handlePriorityChange}
            className={SELECT_CLS}
            aria-label="Filter by priority"
          >
            {PRIORITY_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Due-date filter ── */}
        <div className="min-w-[160px] flex-1">
          <label
            htmlFor="filter-due-date"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Due by
          </label>
          <input
            id="filter-due-date"
            type="date"
            value={filter.dueDate ?? ''}
            onChange={handleDueDateChange}
            className={
              'min-h-[44px] w-full rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-3 ' +
              'text-sm text-gray-900 shadow-sm ' +
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
              'hover:border-gray-400'
            }
            aria-label="Filter by due date"
          />
        </div>

        {/* ── Divider ── */}
        <div
          className="hidden h-10 w-px bg-gray-200 sm:block"
          aria-hidden="true"
        />

        {/* ── Sort group label ── */}
        <div className="hidden shrink-0 items-center sm:flex">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sort
          </span>
        </div>

        {/* ── Sort by ── */}
        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="sort-by"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Sort by
          </label>
          <select
            id="sort-by"
            value={sort.by}
            onChange={handleSortByChange}
            className={SELECT_CLS}
            aria-label="Sort tasks by"
          >
            {SORT_BY_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Sort direction ── */}
        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="sort-order"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Direction
          </label>
          <select
            id="sort-order"
            value={sort.order}
            onChange={handleSortOrderChange}
            className={SELECT_CLS}
            aria-label="Sort direction"
          >
            {SORT_ORDER_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Clear button — only visible when filters are active ── */}
        {hasActiveFilters && (
          <div className="flex shrink-0 items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className={
                'flex min-h-[44px] min-w-[44px] items-center justify-center ' +
                'rounded-md border border-gray-300 bg-white px-3 ' +
                'text-sm text-gray-600 shadow-sm ' +
                'hover:bg-gray-50 hover:text-gray-900 ' +
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
              }
              aria-label="Clear all filters"
            >
              {/* ✕ icon */}
              <svg
                className="mr-1.5 h-3.5 w-3.5 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
              Clear
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FilterSortBar;
