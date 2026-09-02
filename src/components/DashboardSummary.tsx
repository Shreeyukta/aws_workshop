import type { StatusSummary } from '../types';

export interface DashboardSummaryProps {
  /** Pre-computed status counts from getSummary(). */
  summary: StatusSummary;
}

// ─── Chip configuration ───────────────────────────────────────────────────────

interface ChipConfig {
  label: string;
  count: number;
  /** Tailwind classes for the chip's background, text, and ring colours. */
  colorClasses: string;
  /** Accessible label for screen readers. */
  ariaLabel: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays a row of three status-count chips summarising the task board:
 * "To Do" (gray/blue), "In Progress" (yellow/orange), and "Done" (green).
 *
 * This is a pure, data-driven component — it receives a pre-computed
 * `StatusSummary` and renders it without reaching into the store directly,
 * making it trivially testable and reusable.
 *
 * Requirements: 3.3, 4.4
 */
export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const chips: ChipConfig[] = [
    {
      label: 'To Do',
      count: summary.todo,
      colorClasses:
        'bg-gray-100 text-gray-700 ring-gray-200',
      ariaLabel: `To Do: ${summary.todo} task${summary.todo !== 1 ? 's' : ''}`,
    },
    {
      label: 'In Progress',
      count: summary.inProgress,
      colorClasses:
        'bg-yellow-100 text-yellow-800 ring-yellow-200',
      ariaLabel: `In Progress: ${summary.inProgress} task${summary.inProgress !== 1 ? 's' : ''}`,
    },
    {
      label: 'Done',
      count: summary.done,
      colorClasses:
        'bg-green-100 text-green-700 ring-green-200',
      ariaLabel: `Done: ${summary.done} task${summary.done !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-3"
      role="region"
      aria-label="Task status summary"
    >
      {chips.map(({ label, count, colorClasses, ariaLabel }) => (
        <div
          key={label}
          className={[
            'inline-flex items-center gap-2 rounded-full px-4 py-2',
            'text-sm font-medium ring-1 ring-inset',
            colorClasses,
          ].join(' ')}
          aria-label={ariaLabel}
        >
          {/* Status label */}
          <span>{label}</span>

          {/* Count badge — slightly bolder to make the number stand out */}
          <span
            className="inline-flex items-center justify-center rounded-full bg-white/60 px-1.5 py-0.5 text-xs font-semibold tabular-nums shadow-sm"
            aria-hidden="true"
          >
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default DashboardSummary;
