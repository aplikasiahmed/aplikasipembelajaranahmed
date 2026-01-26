
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Mail, Lock, Plus, UserCog, ArrowLeft, Trash2, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';
import { AdminUser } from '../types';
import Swal from 'sweetalert2';

const TeacherAdminManagement: React.FC = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const data = await db.getAdmins();
    setAdmins(data);
    setLoading(false);
  };

  const handleAddAdmin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Admin Baru',
      html:
        '<div class="space-y-3">' +
        '<input id="swal-fullname" class="swal2-input" placeholder="Nama Lengkap">' +
        '<input id="swal-username" class="swal2-input" placeholder="Username Login">' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Password Login">' +
        '<select id="swal-role" class="swal2-select" style="margin-top: 15px">' +
        '<option value="Admin">Admin</option>' +
        '<option value="Super Admin">Super Admin</option>' +
        '</select>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#059669',
      preConfirm: () => {
        return {
          fullname: (document.getElementById('swal-fullname') as HTMLInputElement).value,
          username: (document.getElementById('swal-username') as HTMLInputElement).value,
          password: (document.getElementById('swal-password') as HTMLInputElement).value,
          role: (document.getElementById('swal-role') as HTMLSelectElement).value,
        }
      }
    });

    if (formValues) {
      if (!formValues.fullname || !formValues.username || !formValues.password) {
        Swal.fire('Error', 'Semua kolom wajib diisi!', 'error');
        return;
      }

      try {
        await db.addAdmin(formValues as any);
        Swal.fire('Berhasil', 'Admin baru telah ditambahkan.', 'success');
        fetchAdmins();
      } catch (err: any) {
        Swal.fire('Gagal', err.message || 'Username mungkin sudah digunakan.', 'error');
      }
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (admins.length <= 1) {
      Swal.fire('Peringatan', 'Minimal harus ada 1 Admin di sistem.', 'warning');
      return;
    }

    const res = await Swal.fire({
      title: 'Hapus Admin?',
      text: `Akun ${name} akan dihapus secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Hapus'
    });

    if (res.isConfirmed) {
      try {
        await db.deleteAdmin(id);
        Swal.fire('Terhapus', 'Akun admin telah dihapus.', 'success');
        fetchAdmins();
      } catch (err) {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 md:space-y-6 animate-fadeIn pb-20 px-1 md:px-0">
      <button 
        onClick={() => navigate('/guru')}
        className="md:hidden flex items-center gap-1.5 text-slate-800 text-[10px] font-black uppercase tracking-tight py-2 mb-1"
      >
        <ArrowLeft size={14} className="text-slate-900" /> Kembali ke Dashboard
      </button>

      <div className="bg-slate-900 text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-base md:text-2xl font-black leading-tight uppercase tracking-tighter">Kelola Admin</h1>
          <p className="text-slate-400 text-[9px] md:text-sm mt-0.5 opacity-80">Manajemen akses guru pengampu PAI.</p>
        </div>
        <button 
          onClick={handleAddAdmin}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl shadow-xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={18} />
          <span className="hidden md:inline font-black text-xs uppercase tracking-widest">Tambah Guru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {loading ? (
          <div className="md:col-span-2 p-10 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Mengambil Data Admin...</p>
          </div>
        ) : admins.map((admin) => (
          <div key={admin.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-16 h-16 md:w-24 md:h-24" />
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 relative z-10">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${admin.role === 'Super Admin' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                <UserCog size={24} />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xs md:text-base font-black text-slate-800 truncate uppercase tracking-tight">{admin.fullname}</h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${admin.role === 'Super Admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {admin.role}
                  </span>
                  <span className="text-slate-400 text-[8px] font-bold flex items-center gap-1 truncate tracking-tight">
                    <User size={10} /> @{admin.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 md:mt-8 flex gap-2">
              <div className="flex-1 p-2 md:p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Terdaftar Sejak</p>
                <p className="text-[9px] font-bold text-slate-600">{new Date(admin.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button 
                onClick={() => handleDeleteAdmin(admin.id, admin.fullname)}
                className="px-4 md:px-6 rounded-xl md:rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-95"
                title="Hapus Admin"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
        <div className="space-y-1">
          <p className="text-[9px] md:text-[10px] text-amber-800 font-black uppercase tracking-widest">Informasi Keamanan</p>
          <p className="text-[9px] md:text-[10px] text-amber-700 leading-relaxed italic">
            Semua admin memiliki akses penuh ke data nilai dan absensi. Hapus akun guru yang sudah tidak bertugas untuk menjaga kerahasiaan data siswa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherAdminManagement;
