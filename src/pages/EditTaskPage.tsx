import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { TaskForm } from '../components/TaskForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

/**
 * EditTaskPage — loads a task by `taskId` URL param and renders it in edit mode.
 *
 * Behaviour:
 * - If the `taskId` param resolves to a known task, renders `<TaskForm>` pre-populated
 *   with the task's current data. On successful save, TaskForm navigates to /dashboard.
 * - If no task is found for the given id, renders `<EmptyState>` with a link back to
 *   the dashboard.
 * - A "Delete task" button triggers `<ConfirmDialog>`. Confirming calls `deleteTask`
 *   and navigates to /dashboard; cancelling leaves the task unchanged.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3
 */
function EditTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { state, actions } = useTaskStore();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Find the task in the current state
  const task = state.tasks.find((t) => t.id === taskId);

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyState
            message="Task not found. It may have been deleted."
            ctaLabel="Back to dashboard"
            onCta={() => navigate('/dashboard')}
          />
        </div>
      </div>
    );
  }

  // ── Delete handlers ───────────────────────────────────────────────────────

  function handleDeleteConfirm() {
    actions.deleteTask(task!.id);
    setShowConfirmDelete(false);
    navigate('/dashboard');
  }

  function handleDeleteCancel() {
    setShowConfirmDelete(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            aria-label="Delete this task"
            className={
              'min-h-[44px] min-w-[44px] rounded-md border border-red-300 bg-white px-4 py-2 ' +
              'text-sm font-medium text-red-600 shadow-sm ' +
              'hover:bg-red-50 hover:border-red-400 ' +
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            }
          >
            Delete task
          </button>
        </div>

        {/* Edit form */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <TaskForm existingTask={task} onSuccessNavigateTo="/dashboard" />
        </div>
      </div>

      {/* Deletion confirmation dialog */}
      {showConfirmDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}

export default EditTaskPage;
