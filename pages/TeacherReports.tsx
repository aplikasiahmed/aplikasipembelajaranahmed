
import React, { useState } from 'react';
import { Download, FileText, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { db } from '../services/supabaseMock';

const TeacherReports: React.FC = () => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success'>('idle');

  const handleExport = (type: 'pdf' | 'excel', category: 'nilai' | 'absensi') => {
    alert(`Mengekspor Laporan ${category.toUpperCase()} dalam format ${type.toUpperCase()}... (Fitur ini akan menggunakan library jspdf/xlsx di implementasi penuh)`);
  };

  const handleReset = () => {
    db.resetAllData();
    setResetStatus('success');
    setShowConfirmReset(false);
    setTimeout(() => setResetStatus('idle'), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan & Pengaturan</h1>
          <p className="text-slate-500">Kelola ekspor data dan pembersihan database berkala.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reports Section */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Download className="text-emerald-600" size={24} /> Ekspor Laporan
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-700">Laporan Nilai Siswa</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExport('pdf', 'nilai')}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <FileText size={18} /> PDF
                </button>
                <button 
                  onClick={() => handleExport('excel', 'nilai')}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                >
                  <Download size={18} /> Excel
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-700">Laporan Kehadiran (Absensi)</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExport('pdf', 'absensi')}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <FileText size={18} /> PDF
                </button>
                <button 
                  onClick={() => handleExport('excel', 'absensi')}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                >
                  <Download size={18} /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle size={24} /> Zona Berbahaya
          </h2>
          <p className="text-slate-500 text-sm">
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda telah mengekspor data penting sebelum melakukan reset.
          </p>
          
          <div className="pt-4">
            {resetStatus === 'success' ? (
              <div className="bg-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-bold">
                <CheckCircle size={20} /> Seluruh data telah berhasil direset!
              </div>
            ) : !showConfirmReset ? (
              <button 
                onClick={() => setShowConfirmReset(true)}
                className="w-full bg-red-50 text-red-600 border border-red-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 size={20} /> Reset Semua Nilai & Absensi
              </button>
            ) : (
              <div className="bg-red-600 text-white p-6 rounded-2xl space-y-4 animate-slideUp">
                <p className="font-bold text-center">Apakah Anda yakin ingin menghapus semua data semester ini?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 bg-red-700 text-white py-3 rounded-xl font-bold hover:bg-red-800 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 bg-white text-red-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Ya, Reset Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
