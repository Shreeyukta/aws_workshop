import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  /** The message / question shown to the user inside the dialog. */
  message: string;
  /** Called when the user confirms (clicks "Confirm" button or presses Enter). */
  onConfirm: () => void;
  /** Called when the user cancels (clicks "Cancel" button, presses Escape, or clicks the backdrop). */
  onCancel: () => void;
}

/**
 * A reusable, focus-trapped confirmation modal overlay.
 *
 * Keyboard behaviour:
 *   - Escape  → cancel
 *   - Enter   → confirm
 *   - Tab     → cycles focus between the two buttons (focus trap)
 *
 * Requirements: 5.1, 6.4
 */
export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus the cancel button when the dialog opens (safer default for destructive actions)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Global key handler — Escape cancels, Enter confirms
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Tab') {
        // Focus trap: keep Tab/Shift-Tab inside the two buttons
        const buttons = [cancelRef.current, confirmRef.current].filter(
          Boolean,
        ) as HTMLButtonElement[];
        if (buttons.length < 2) return;

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-message"
      onClick={(e) => {
        // Dismiss on backdrop click, but not on dialog content click
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="mx-4 w-full max-w-sm rounded-lg bg-white shadow-xl"
      >
        {/* Body */}
        <div className="p-6">
          <p
            id="confirm-dialog-message"
            className="text-sm text-gray-700"
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-[44px] min-w-[88px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] min-w-[88px] rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
