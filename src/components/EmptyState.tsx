export interface EmptyStateProps {
  /** Primary message shown to the user when there is no content. */
  message: string;
  /** Label for the optional call-to-action button. Rendered only when both `ctaLabel` and `onCta` are provided. */
  ctaLabel?: string;
  /** Callback invoked when the user clicks the call-to-action button. Rendered only when both `ctaLabel` and `onCta` are provided. */
  onCta?: () => void;
}

/**
 * Shown whenever a list or the dashboard has no tasks.
 * Optionally renders a call-to-action button that prompts the user to create
 * their first task.
 *
 * The CTA button meets the 44×44 CSS px minimum touch-target requirement.
 *
 * Requirements: 3.6
 */
export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  const showCta = Boolean(ctaLabel && onCta);

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gray-200 px-6 py-16 text-center"
      role="status"
      aria-label={message}
    >
      {/* Decorative icon */}
      <svg
        className="h-12 w-12 text-gray-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
        />
      </svg>

      <p className="text-sm text-gray-500">{message}</p>

      {showCta && (
        <button
          type="button"
          onClick={onCta}
          className="min-h-[44px] min-w-[44px] rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
