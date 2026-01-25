
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PublicProfile from './pages/PublicProfile';
import PublicGrades from './pages/PublicGrades';
import PublicMaterials from './pages/PublicMaterials';
import TeacherInputGrades from './pages/TeacherInputGrades';
import TeacherReports from './pages/TeacherReports';
import TeacherLogin from './pages/TeacherLogin';

// Higher Order Component for Route Protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-fadeIn">
    <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
    <p className="text-slate-500">Halaman ini sedang dalam tahap pengembangan.</p>
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
          <Route path="/absensi" element={<PlaceholderPage title="Absensi Siswa (Publik)" />} />
          <Route path="/tugas" element={<PlaceholderPage title="Pengumpulan Tugas Siswa" />} />
          <Route path="/materi" element={<PublicMaterials />} />
          <Route path="/login" element={<TeacherLogin />} />
          
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
