
import React from 'react';
import { Mail, Instagram, Phone, MapPin, GraduationCap, Award, User } from 'lucide-react';

const PublicProfile: React.FC = () => {
  const profileImageUrl = "https://irqphggbsncuplifywul.supabase.co/storage/v1/object/sign/gambar/profil%20ahmad%20nawasyi%20(2)%20copy.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjA2YTI2NS1hNTMwLTQ5ODktOTBhNS03Yjg2ZmNmZGM0ODYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYW1iYXIvcHJvZmlsIGFobWFkIG5hd2FzeWkgKDIpIGNvcHkuanBnIiwiaWF0IjoxNzY5MzM0NzY1LCJleHAiOjE4NjM5NDI3NjV9.QJzrlkb5m9WovQ7Al_9dVK9tCBGlWwx4vTaHfnO8DzI";
  const bannerImageUrl = "https://t3.ftcdn.net/jpg/01/80/18/52/240_F_180185210_uvZFvaMtpUhjRPI30DNHiSjsUKr3bpnL.jpg";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        {/* Decorative Header Background - Smaller height */}
        <div 
          className="h-40 bg-cover bg-center relative" 
          style={{ backgroundImage: `url('${bannerImageUrl}')` }}
        >
          <div className="absolute inset-0 bg-emerald-900/10"></div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="relative -top-14 flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-4">
            <div className="relative group shrink-0">
              <img 
                src={profileImageUrl} 
                alt="Ahmad Nawasyi"
                className="w-32 h-32 rounded-xl border-4 border-white shadow-lg object-cover bg-slate-100"
              />
            </div>
            
            <div className="flex-1 w-full flex flex-col md:flex-row items-start md:items-end justify-between md:justify-start gap-3 pb-2">
              <div className="space-y-0.5">
                <h1 className="text-[14px] md:text-2xl font-bold text-slate-800 leading-tight">Ahmad Nawasyi, S.Pd</h1>
                <p className="text-emerald-500 font-medium text-[10px] md:text-sm">Guru Pendidikan Agama Islam & Budi Pekerti</p>
                
                {/* Mobile Social Icons - Positioned directly below the name/title */}
                <div className="flex md:hidden gap-1.5 pt-2">
                  <button className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <Instagram size={14} />
                  </button>
                  <button className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <Mail size={14} />
                  </button>
                  <button className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    <Phone size={14} />
                  </button>
                </div>
              </div>
              
              {/* Desktop Social Icons - Kept beside/end for balanced desktop layout */}
              <div className="hidden md:flex gap-1.5 shrink-0">
                <button className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Instagram size={16} />
                </button>
                <button className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Mail size={16} />
                </button>
                <button className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  <Phone size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-0 md:-mt-6">
            <div className="md:col-span-2 space-y-5">
              <section className="bg-white">
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User size={16} className="text-emerald-600" /> Profil Singkat
                </h2>
                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed italic">
                    "Assalamualaikum Warahmatullahi Wabarakatuh. Saya Ahmad Nawasyi, pengampu mata pelajaran PAI & Budi Pekerti. 
                    Misi saya adalah membimbing generasi muda untuk memiliki kecerdasan intelektual sekaligus keluhuran budi pekerti 
                    berdasarkan tuntunan Al-Qur'an dan Sunnah."
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-600" /> Pendidikan
                </h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-1 bg-emerald-500 rounded"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Sarjana Pendidikan Agama Islam (S.Pd.I)</h4>
                      <p className="text-slate-500 text-[10px]">Fokus pada Metodologi Pengajaran Karakter & Akhlak</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Kontak</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-xs">
                    <MapPin className="text-emerald-600 shrink-0" size={14} />
                    <span className="text-slate-600">Unit Pendidikan PAI, Gedung Utama Sekolah</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <Mail className="text-emerald-600 shrink-0" size={14} />
                    <span className="text-slate-600">ahmad.nawasyi@sekolah.sch.id</span>
                  </li>
                </ul>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="text-emerald-600" size={14} />
                  <h3 className="font-bold text-emerald-800 text-xs uppercase tracking-wider">Visi</h3>
                </div>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  Menciptakan lingkungan belajar yang religius, inklusif, dan inspiratif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
