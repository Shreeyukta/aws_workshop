import { TaskForm } from '../components/TaskForm';

/**
 * NewTaskPage — renders <TaskForm> in create mode.
 *
 * No `existingTask` is passed, so TaskForm uses creation defaults:
 *   - status  → "To Do"
 *   - priority → "Medium"
 *   - listId  → Inbox (when no list is selected)
 *
 * On successful submission TaskForm navigates to /dashboard (its default).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */
function NewTaskPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">New Task</h1>
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <TaskForm />
        </div>
      </div>
    </div>
  );
}

export default NewTaskPage;
