import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LoadingScreen } from '@/components/ui';

// Pages
import Login          from '@/pages/Login';
import PendingRole    from '@/pages/PendingRole';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Analytics      from '@/pages/admin/Analytics';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherCourse  from '@/pages/teacher/TeacherCourse';
import TeacherAlerts  from '@/pages/teacher/TeacherAlerts';
import StudentHome    from '@/pages/student/StudentHome';
import StudentCourse  from '@/pages/student/StudentCourse';
import StudyView      from '@/pages/student/StudyView';

function RoleRouter() {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (!profile) return <LoadingScreen message="Cargando perfil..." />;
  const roles = { admin:'/admin', teacher:'/teacher', student:'/student', pending:'/pending' };
  return <Navigate to={roles[profile.role] || '/pending'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"   element={<Login />} />
          <Route path="/pending" element={<PendingRole />} />
          <Route path="/"        element={<RoleRouter />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin"            element={<AdminDashboard />} />
            <Route path="/admin/analytics"  element={<Analytics />} />
          </Route>

          {/* Teacher */}
          <Route element={<ProtectedRoute allowedRoles={['teacher','admin']} />}>
            <Route path="/teacher"                  element={<TeacherDashboard />} />
            <Route path="/teacher/course/:courseId" element={<TeacherCourse />} />
            <Route path="/teacher/alerts"           element={<TeacherAlerts />} />
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student"                    element={<StudentHome />} />
            <Route path="/student/course/:courseId"   element={<StudentCourse />} />
            <Route path="/student/class/:classId"     element={<StudyView />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
