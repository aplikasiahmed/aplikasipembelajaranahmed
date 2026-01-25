
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  User, 
  BookOpen, 
  ClipboardCheck, 
  Award, 
  Settings, 
  LogOut,
  ShieldCheck,
  FileEdit
} from 'lucide-react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTeacherPage = location.pathname.startsWith('/guru');
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const navLinks = [
    { name: 'Beranda', path: '/', icon: Home },
    { name: 'Nilai Siswa', path: '/nilai', icon: Award },
    { name: 'Absensi', path: '/absensi', icon: ClipboardCheck },
    { name: 'Tugas', path: '/tugas', icon: FileEdit },
    { name: 'Materi PAI', path: '/materi', icon: BookOpen },
    { name: 'Profil Guru', path: '/profil', icon: User },
  ];

  const teacherLinks = [
    { name: 'Dashboard', path: '/guru', icon: Settings },
    { name: 'Input Nilai', path: '/guru/nilai', icon: Award },
    { name: 'Input Absensi', path: '/guru/absensi', icon: ClipboardCheck },
    { name: 'Laporan', path: '/guru/laporan', icon: ShieldCheck },
  ];

  if (isTeacherPage && !isLoginPage) {
    return (
      <div className="min-h-screen flex bg-slate-50">
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 p-1.5 rounded-lg text-white">
                <Settings size={18} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-sm leading-tight">Admin PAI</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Panel Pengajar</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {teacherLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  location.pathname === link.path 
                    ? 'bg-amber-50 text-amber-700 font-bold shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-amber-600'
                }`}
              >
                <link.icon size={16} />
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </aside>
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <header className="md:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Settings size={18} />
              <span className="font-bold">Admin Panel</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 p-1.5"><LogOut size={18} /></button>
          </header>
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white shrink-0">
              <BookOpen size={20} />
            </div>
            <span className="font-bold text-[13px] sm:text-lg text-slate-800 whitespace-nowrap">Pendidikan Agama Islam</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-semibold transition-colors ${
                  location.pathname === link.path ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!isLoginPage && (
              <Link 
                to="/login" 
                className="bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold hover:bg-slate-700 transition-all"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="p-3 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {!isTeacherPage && !isLoginPage && <BottomNav />}
    </div>
  );
};

export default Layout;
