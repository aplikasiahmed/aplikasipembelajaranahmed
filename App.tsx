
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PublicProfile from './pages/PublicProfile';
import PublicGrades from './pages/PublicGrades';
import PublicAbsensi from './pages/PublicAbsensi';
import PublicTasks from './pages/PublicTasks';
import PublicMaterials from './pages/PublicMaterials';
import TeacherInputGrades from './pages/TeacherInputGrades';
import TeacherReports from './pages/TeacherReports';

// Higher Order Component for Route Protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    // Redirect to home if not logged in, as login is now a modal
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] md:min-h-[50vh] space-y-2 md:space-y-4 animate-fadeIn px-4 text-center">
    <div className="bg-slate-200/50 p-3 md:p-4 rounded-full mb-2">
      <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
    <h1 className="text-lg md:text-3xl font-bold text-slate-800">{title}</h1>
    <p className="text-[10px] md:text-sm text-slate-500 max-w-xs">Halaman ini sedang dalam tahap pengembangan konten oleh Tim PAI.</p>
  </div>
);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/profil" element={<PublicProfile />} />
          <Route path="/nilai" element={<PublicGrades />} />
          <Route path="/absensi" element={<PublicAbsensi />} />
          <Route path="/tugas" element={<PublicTasks />} />
          <Route path="/kerjakan-tugas" element={<PlaceholderPage title="Kerjakan Tugas PAI" />} />
          <Route path="/materi" element={<PublicMaterials />} />
          
          {/* Protected Teacher Routes */}
          <Route path="/guru" element={
            <ProtectedRoute>
              <PlaceholderPage title="Dashboard Guru" />
            </ProtectedRoute>
          } />
          <Route path="/guru/nilai" element={
            <ProtectedRoute>
              <TeacherInputGrades />
            </ProtectedRoute>
          } />
          <Route path="/guru/absensi" element={
            <ProtectedRoute>
              <PlaceholderPage title="Input Absensi Guru" />
            </ProtectedRoute>
          } />
          <Route path="/guru/laporan" element={
            <ProtectedRoute>
              <TeacherReports />
            </ProtectedRoute>
          } />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
