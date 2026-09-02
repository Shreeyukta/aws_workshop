import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { TaskStoreProvider } from './store/useTaskStore';
import { EmptyState } from './components/EmptyState';
import DashboardPage from './pages/DashboardPage';
import ListPage from './pages/ListPage';
import NewTaskPage from './pages/NewTaskPage';
import EditTaskPage from './pages/EditTaskPage';

/**
 * Root application component.
 * Wires up all React Router v6 routes inside TaskStoreProvider.
 *
 * Routes:
 *   /                  → redirect to /dashboard
 *   /dashboard         → <DashboardPage>
 *   /lists/:listId     → <ListPage>
 *   /tasks/new         → <NewTaskPage>
 *   /tasks/:taskId     → <EditTaskPage>
 *   *                  → <EmptyState> "Page not found"
 *
 * Requirements: 3.1, 6.3
 */
function App() {
  return (
    <TaskStoreProvider>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Main views */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/lists/:listId" element={<ListPage />} />
        <Route path="/tasks/new" element={<NewTaskPage />} />
        <Route path="/tasks/:taskId" element={<EditTaskPage />} />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 p-8">
              <EmptyState
                message="Page not found."
                ctaLabel="Go to Dashboard"
                onCta={() => {
                  window.location.href = '/dashboard';
                }}
              />
              <p className="mt-4 text-center text-sm text-gray-500">
                Or{' '}
                <Link to="/dashboard" className="text-blue-600 underline hover:text-blue-800">
                  click here
                </Link>{' '}
                to go back to the dashboard.
              </p>
            </div>
          }
        />
      </Routes>
    </TaskStoreProvider>
  );
}

export default App;
