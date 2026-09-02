import { Link } from 'react-router-dom';
import type { Task, Status, Priority } from '../types';

export interface TaskCardProps {
  /** The task to display. */
  task: Task;
  /** Called when the user confirms deletion via the card's delete button. */
  onDelete: (id: string) => void;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Status, string> = {
  'To Do':       'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done':        'bg-green-100 text-green-700',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  Low:    'bg-slate-100 text-slate-600',
  Medium: 'bg-yellow-100 text-yellow-700',
  High:   'bg-red-100 text-red-700',
};

/** Format an ISO 8601 date string (YYYY-MM-DD or full timestamp) to a readable date. */
function formatDate(iso: string): string {
  // Extract just the date part so we parse in local time (avoids off-by-one UTC issues)
  const datePart = iso.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Returns true when a due date is in the past (overdue). */
function isOverdue(iso: string): boolean {
  const datePart = iso.slice(0, 10);
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return datePart < todayStr;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays a single task as a card with status badge, priority badge, optional
 * due-date chip, an edit link, and a delete button.
 *
 * When `status === "Done"` the title receives strikethrough + muted styling.
 * All interactive elements meet the 44×44 CSS px minimum touch-target size.
 *
 * Requirements: 3.2, 4.6, 8.3
 */
export function TaskCard({ task, onDelete }: TaskCardProps) {
  const isDone = task.status === 'Done';

  return (
    <article
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      aria-label={`Task: ${task.title}`}
    >
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <p
          className={[
            'truncate text-sm font-medium',
            isDone ? 'text-gray-400 line-through' : 'text-gray-900',
          ].join(' ')}
        >
          {task.title}
        </p>

        {/* Badges row */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <span
            className={[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              STATUS_STYLES[task.status],
            ].join(' ')}
            aria-label={`Status: ${task.status}`}
          >
            {task.status}
          </span>

          {/* Priority badge */}
          <span
            className={[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              PRIORITY_STYLES[task.priority],
            ].join(' ')}
            aria-label={`Priority: ${task.priority}`}
          >
            {task.priority}
          </span>

          {/* Due date chip */}
          {task.dueDate && (
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                isDone
                  ? 'bg-gray-100 text-gray-400'
                  : isOverdue(task.dueDate)
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-50 text-gray-600',
              ].join(' ')}
              aria-label={`Due date: ${formatDate(task.dueDate)}`}
            >
              {/* Calendar icon */}
              <svg
                className="h-3 w-3 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6c0-.69-.56-1.25-1.25-1.25H4.75Z"
                  clipRule="evenodd"
                />
              </svg>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Edit link — min 44×44 touch target */}
        <Link
          to={`/tasks/${task.id}`}
          aria-label={`Edit task: ${task.title}`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
          </svg>
        </Link>

        {/* Delete button — min 44×44 touch target */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task: ${task.title}`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
