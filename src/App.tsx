import { Routes, Route, Navigate } from 'react-router-dom';

/**
 * Root application component.
 * Routes are placeholders — full implementation follows in task 8.1.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold text-gray-900">Task Management App</h1>
            <p className="mt-2 text-gray-600">Dashboard — coming soon.</p>
          </div>
        }
      />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-gray-50 p-8">
            <h2 className="text-xl font-semibold text-gray-700">Page not found</h2>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
