import { useParams } from 'react-router-dom';

/**
 * ListPage — stub placeholder.
 * Full implementation follows in task 8.3.
 */
function ListPage() {
  const { listId } = useParams<{ listId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">List</h1>
      <p className="mt-2 text-gray-600">
        List ID: <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">{listId}</code>
      </p>
      <p className="mt-1 text-gray-600">Full implementation coming in task 8.3.</p>
    </div>
  );
}

export default ListPage;
