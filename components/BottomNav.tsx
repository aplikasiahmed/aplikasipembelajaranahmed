
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Award, ClipboardCheck, BookOpen, FileEdit } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navLinks = [
    { name: 'Beranda', path: '/', icon: Home },
    { name: 'Nilai', path: '/nilai', icon: Award },
    { name: 'Absen', path: '/absensi', icon: ClipboardCheck },
    { name: 'Tugas', path: '/tugas', icon: FileEdit },
    { name: 'Materi', path: '/materi', icon: BookOpen },
    { name: 'Profil', path: '/profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-2 z-50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-0.5 transition-colors flex-1 ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <link.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-medium">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
