import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, logout } from './features/auth/authSlice';
import { RootState, AppDispatch } from './app/store';
import ToastContainer from './components/ui/ToastContainer';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import { toast } from './services/toast';

// Lazy load all pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Student Pages
const GoalIntake = lazy(() => import('./pages/student/GoalIntake'));
const PlanningLoader = lazy(() => import('./pages/student/PlanningLoader'));
const StudyPlanViewer = lazy(() => import('./pages/student/StudyPlanViewer'));
const Dashboard = lazy(() => import('./pages/student/Dashboard'));
const ReschedulePreview = lazy(() => import('./pages/student/ReschedulePreview'));
const Analytics = lazy(() => import('./pages/student/Analytics'));
const KnowledgeMastery = lazy(() => import('./pages/student/KnowledgeMastery'));
const QuizPlayer = lazy(() => import('./pages/student/QuizPlayer'));
const QuizResult = lazy(() => import('./pages/student/QuizResult'));
const AICompanion = lazy(() => import('./pages/student/AICompanion'));
const CalendarDashboard = lazy(() => import('./pages/student/CalendarDashboard'));
const TrophyCase = lazy(() => import('./pages/student/TrophyCase'));

// Mentor Workspace Pages
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const MentorStudents = lazy(() => import('./pages/mentor/MentorStudents'));
const MentorProgress = lazy(() => import('./pages/mentor/MentorProgress'));
const MentorAnalytics = lazy(() => import('./pages/mentor/MentorAnalytics'));
const MentorResources = lazy(() => import('./pages/mentor/MentorResources'));
const MentorMessages = lazy(() => import('./pages/mentor/MentorMessages'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Protected Route Guard with Silent Role Redirection (Never shows "Access Denied")
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isChecking } = useSelector((state: RootState) => state.auth);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
          <span className="text-sm font-medium tracking-wide">Syncing account...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Silent Role Redirect (Redirects directly without rendering "Access Denied")
  if (allowedRoles && !user.roles.some((role) => allowedRoles.includes(role))) {
    if (user.roles.includes('Mentor')) {
      return <Navigate to="/mentor/dashboard" replace />;
    }
    if (user.roles.includes('Admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

// Role-Aware Dynamic Fallback Route Component
function RoleBasedFallback() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.roles?.includes('Mentor')) {
    return <Navigate to="/mentor/dashboard" replace />;
  }
  if (user.roles?.includes('Admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(checkAuth());

    const handleLogout = () => {
      dispatch(logout());
      toast.info('Your session has expired. Please log in again.', 'Session Expired');
    };
    window.addEventListener('asp_logout', handleLogout);
    return () => window.removeEventListener('asp_logout', handleLogout);
  }, [dispatch]);

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
          <span className="text-sm font-medium tracking-wide">Loading module...</span>
        </div>
      </div>
    }>
      <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals/new"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <GoalIntake />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner/job/:jobId"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <PlanningLoader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner/:planId"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <StudyPlanViewer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scheduler/preview"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <ReschedulePreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mastery"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <KnowledgeMastery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:quizId"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <QuizPlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mock-tests/:quizId"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <QuizPlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/attempt/:attemptId"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <QuizResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companion"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <AICompanion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <CalendarDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trophy"
        element={
          <ProtectedRoute allowedRoles={['Student', 'Admin']}>
            <TrophyCase />
          </ProtectedRoute>
        }
      />

      {/* Mentor Protected Suite Routes */}
      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/students"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/progress"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorProgress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/analytics"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/resources"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/messages"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/settings"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Role-Aware Fallback Redirect */}
      <Route path="*" element={<RoleBasedFallback />} />
    </Routes>
    <ToastContainer />
    </Suspense>
  );
}
