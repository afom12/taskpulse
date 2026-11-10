import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import { Spinner, Button } from "./components/ui";
import Login from "./pages/Login";
import Register from "./pages/Register";
const Dashboard = lazy(() => import("./pages/Dashboard"));
import AllTasks from "./pages/AllTasks";
import MyTasks from "./pages/MyTasks";
import TaskDetail from "./pages/TaskDetail";
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Team = lazy(() => import("./pages/Team"));
const Reports = lazy(() => import("./pages/Reports"));
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";

function Protected({ children }) {
  const { user, profile, loading, logout } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-sm text-slate-600">Your account has no profile yet. If an admin created your login manually, ask them to add your user document.</p>
        <Button variant="secondary" onClick={logout}>Log out</Button>
      </div>
    );
  return <DataProvider>{children}</DataProvider>;
}

// Role gate: bounces non-admins away from admin pages.
function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/my-tasks" replace />;
}

function Home() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/dashboard" : "/my-tasks"} replace />;
}

function PublicOnly({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  return user && profile ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route element={<Protected><Suspense fallback={<Spinner />}><Layout /></Suspense></Protected>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<AdminOnly><Dashboard /></AdminOnly>} />
        <Route path="tasks" element={<AdminOnly><AllTasks /></AdminOnly>} />
        <Route path="team" element={<AdminOnly><Team /></AdminOnly>} />
        <Route path="reports" element={<AdminOnly><Reports /></AdminOnly>} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
