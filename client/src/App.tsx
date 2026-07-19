import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, logout } from './features/auth/authSlice';
import { RootState, AppDispatch } from './app/store';

// Lazy load all pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
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
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Protected Route Guard
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !user.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}



export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(checkAuth());

    const handleLogout = () => {
      dispatch(logout());
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
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
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
      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowedRoles={['Mentor', 'Admin']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/unauthorized"
        element={
          <div className="flex h-screen items-center justify-center text-red-500">
            Unauthorized Access
          </div>
        }
      />

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}
