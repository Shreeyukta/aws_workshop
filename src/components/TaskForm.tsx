import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, Status, Priority, NewTaskInput, TaskInput } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import {
  validateTaskTitle,
  validateDueDate,
  validateStatus,
  validatePriority,
} from '../validator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskFormProps {
  /**
   * When provided, the form operates in edit mode and pre-populates fields
   * with the existing task's data. When absent, the form is in create mode.
   */
  existingTask?: Task;
  /**
   * Optional override for the URL to navigate to on successful submit.
   * Defaults to "/dashboard".
   */
  onSuccessNavigateTo?: string;
  /**
   * Optional default list ID to pre-select in the list selector (create mode only).
   * Ignored when existingTask is provided.
   */
  defaultListId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Status[] = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High'];

// ─── Shared field styles ──────────────────────────────────────────────────────

const INPUT_BASE =
  'min-h-[44px] w-full rounded-md border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
  'hover:border-gray-400 ' +
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

const INPUT_NORMAL = `${INPUT_BASE} border-gray-300`;
const INPUT_ERROR  = `${INPUT_BASE} border-red-400 focus:ring-red-500 focus:border-red-500`;

const LABEL_CLS = 'mb-1 block text-sm font-medium text-gray-700';
const ERROR_CLS = 'mt-1 text-xs text-red-600';

// ─── Form field error state ───────────────────────────────────────────────────

interface FormErrors {
  title?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A shared create/edit form for tasks.
 *
 * - Create mode: no `existingTask` prop; defaults status → "To Do", priority → "Medium".
 * - Edit mode:   `existingTask` pre-populates all fields.
 *
 * Validation is performed inline via the `Validator` module. Error messages appear
 * directly adjacent to the offending field. The form submits via `addTask` or
 * `updateTask` from `useTaskStore` — no full page reload occurs on success.
 *
 * All interactive elements meet the 44 × 44 CSS px minimum touch-target size.
 *
 * Requirements: 2.1, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.5
 */
export function TaskForm({ existingTask, onSuccessNavigateTo = '/dashboard', defaultListId }: TaskFormProps) {
  const { state, actions } = useTaskStore();
  const navigate = useNavigate();

  const isEditMode = existingTask !== undefined;

  // ── Form field state ────────────────────────────────────────────────────────

  const [title, setTitle]             = useState(existingTask?.title ?? '');
  const [description, setDescription] = useState(existingTask?.description ?? '');
  const [status, setStatus]           = useState<Status>(existingTask?.status ?? 'To Do');
  const [priority, setPriority]       = useState<Priority>(existingTask?.priority ?? 'Medium');
  const [dueDate, setDueDate]         = useState(existingTask?.dueDate ?? '');
  const [listId, setListId]           = useState(existingTask?.listId ?? defaultListId ?? (state.lists.find((l) => l.isInbox)?.id ?? ''));

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): FormErrors {
    const next: FormErrors = {};

    const titleResult = validateTaskTitle(title);
    if (!titleResult.ok) next.title = titleResult.message;

    const dueDateResult = validateDueDate(dueDate || undefined);
    if (!dueDateResult.ok) next.dueDate = dueDateResult.message;

    const statusResult = validateStatus(status);
    if (!statusResult.ok) next.status = statusResult.message;

    const priorityResult = validatePriority(priority);
    if (!priorityResult.ok) next.priority = priorityResult.message;

    return next;
  }

  // ── Submit handler ──────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const patch: Partial<TaskInput> = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          listId,
        };
        actions.updateTask(existingTask.id, patch);
      } else {
        const input: NewTaskInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          listId,
        };
        actions.addTask(input);
      }

      navigate(onSuccessNavigateTo);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Field change helpers (clear per-field error on edit) ────────────────────

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
  }

  function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDueDate(e.target.value);
    if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value as Status);
    if (errors.status) setErrors((prev) => ({ ...prev, status: undefined }));
  }

  function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPriority(e.target.value as Priority);
    if (errors.priority) setErrors((prev) => ({ ...prev, priority: undefined }));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditMode ? 'Edit task' : 'Create new task'}
      className="space-y-5"
    >
      {/* ── Title (required) ── */}
      <div>
        <label htmlFor="task-title" className={LABEL_CLS}>
          Title <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter task title"
          maxLength={500}
          required
          aria-required="true"
          aria-describedby={errors.title ? 'task-title-error' : undefined}
          aria-invalid={errors.title ? 'true' : 'false'}
          className={errors.title ? INPUT_ERROR : INPUT_NORMAL}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p id="task-title-error" role="alert" className={ERROR_CLS}>
            {errors.title}
          </p>
        )}
      </div>

      {/* ── Description (optional) ── */}
      <div>
        <label htmlFor="task-description" className={LABEL_CLS}>
          Description <span className="text-xs font-normal text-gray-600">(optional)</span>
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description…"
          rows={3}
          className={
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm ' +
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
            'hover:border-gray-400 resize-y ' +
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
          }
          disabled={isSubmitting}
          aria-label="Task description"
        />
      </div>

      {/* ── Status + Priority (side by side on sm+) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Status */}
        <div>
          <label htmlFor="task-status" className={LABEL_CLS}>
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={handleStatusChange}
            aria-describedby={errors.status ? 'task-status-error' : undefined}
            aria-invalid={errors.status ? 'true' : 'false'}
            className={errors.status ? INPUT_ERROR : INPUT_NORMAL}
            disabled={isSubmitting}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.status && (
            <p id="task-status-error" role="alert" className={ERROR_CLS}>
              {errors.status}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="task-priority" className={LABEL_CLS}>
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={handlePriorityChange}
            aria-describedby={errors.priority ? 'task-priority-error' : undefined}
            aria-invalid={errors.priority ? 'true' : 'false'}
            className={errors.priority ? INPUT_ERROR : INPUT_NORMAL}
            disabled={isSubmitting}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p id="task-priority-error" role="alert" className={ERROR_CLS}>
              {errors.priority}
            </p>
          )}
        </div>
      </div>

      {/* ── Due date + List selector (side by side on sm+) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Due date */}
        <div>
          <label htmlFor="task-due-date" className={LABEL_CLS}>
            Due date <span className="text-xs font-normal text-gray-600">(optional)</span>
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
            aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
            aria-invalid={errors.dueDate ? 'true' : 'false'}
            className={errors.dueDate ? INPUT_ERROR : INPUT_NORMAL}
            disabled={isSubmitting}
            aria-label="Due date (YYYY-MM-DD)"
          />
          {errors.dueDate && (
            <p id="task-due-date-error" role="alert" className={ERROR_CLS}>
              {errors.dueDate}
            </p>
          )}
        </div>

        {/* List selector */}
        <div>
          <label htmlFor="task-list" className={LABEL_CLS}>
            List
          </label>
          <select
            id="task-list"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className={INPUT_NORMAL}
            disabled={isSubmitting}
            aria-label="Assign to list"
          >
            {state.lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}{list.isInbox ? ' (Inbox)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className={
            'min-h-[44px] min-w-[88px] rounded-md border border-gray-300 bg-white px-4 py-2 ' +
            'text-sm font-medium text-gray-700 shadow-sm ' +
            'hover:bg-gray-50 hover:border-gray-400 ' +
            'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ' +
            'disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={
            'min-h-[44px] min-w-[88px] rounded-md bg-blue-600 px-4 py-2 ' +
            'text-sm font-medium text-white shadow-sm ' +
            'hover:bg-blue-700 ' +
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
            'disabled:cursor-not-allowed disabled:opacity-50'
          }
          aria-label={isEditMode ? 'Save changes' : 'Create task'}
        >
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
