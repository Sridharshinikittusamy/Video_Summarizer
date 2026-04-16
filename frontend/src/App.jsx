import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import CreateTask from './pages/CreateTask';
import ReportView from './pages/ReportView';
import Profile from './pages/Profile';
import Layout from './layouts/Layout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <ErrorBoundary>
            <Router>
              <Routes>
                <Route path="/login" element={<Navigate to="/" />} />

                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="new" element={<CreateTask />} />
                  <Route path="report/:taskId" element={<ReportView />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </Router>
          </ErrorBoundary>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}