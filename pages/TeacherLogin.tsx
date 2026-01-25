
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, BookOpen, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface TeacherLoginProps {
  onClose: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama pengguna dan kata sandi wajib diisi!',
        confirmButtonColor: '#059669',
        heightAuto: false
      });
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      if ((username.toLowerCase() === 'admin' && password === 'admin123') || (username.length > 0 && password === 'admin123')) {
        localStorage.setItem('isLoggedIn', 'true');
        
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil',
          text: 'Selamat datang di Panel Pengajar!',
          timer: 1500,
          showConfirmButton: false,
          heightAuto: false
        }).then(() => {
          onClose(); // Tutup modal dulu
          navigate('/guru');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Masuk',
          text: 'Nama pengguna atau kata sandi salah.',
          confirmButtonColor: '#059669',
          heightAuto: false
        });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-sm md:max-w-md rounded-[2rem] md:rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative animate-slideUp">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full transition-all duration-200 shadow-lg"
          title="Tutup"
        >
          <X size={18} />
        </button>

        <div className="bg-emerald-700 p-6 md:p-8 text-center text-white">
          <div className="inline-flex bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl mb-3 md:mb-4 backdrop-blur-sm">
            <BookOpen size={24} className="md:w-8 md:h-8" />
          </div>
          <h1 className="text-lg md:text-2xl font-bold">Area Guru</h1>
          <p className="text-emerald-100 text-[10px] md:text-sm mt-1">Silakan masuk untuk mengelola data</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[11px] md:text-sm font-bold text-slate-700 ml-1">Nama Pengguna</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                className="w-full pl-11 pr-4 py-2.5 md:py-3 text-xs md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[11px] md:text-sm font-bold text-slate-700 ml-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full pl-11 pr-11 py-2.5 md:py-3 text-xs md:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-base font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Masuk...' : 'Masuk Sekarang'}
          </button>

          <p className="text-center text-slate-400 text-[9px] md:text-xs leading-relaxed px-4">
            Akses khusus Guru Pendidikan Agama Islam & Budi Pekerti
          </p>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;
