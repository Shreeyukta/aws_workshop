import { useParams } from 'react-router-dom';

/**
 * EditTaskPage — stub placeholder.
 * Full implementation follows in task 8.5.
 */
function EditTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
      <p className="mt-2 text-gray-600">
        Task ID: <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">{taskId}</code>
      </p>
      <p className="mt-1 text-gray-600">Full implementation coming in task 8.5.</p>
    </div>
  );
}

export default EditTaskPage;
