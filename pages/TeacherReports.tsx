
import React, { useState, useRef } from 'react';
import { Download, FileText, Trash2, AlertTriangle, CheckCircle, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { db } from '../services/supabaseMock';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const TeacherReports: React.FC = () => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success'>('idle');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (type: 'pdf' | 'excel', category: 'nilai' | 'absensi') => {
    alert(`Fitur ekspor ${category} ke ${type} dalam pengembangan.`);
  };

  const handleReset = async () => {
    await db.resetAllData();
    setResetStatus('success');
    setShowConfirmReset(false);
    setTimeout(() => setResetStatus('idle'), 3000);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error("File Excel kosong.");

        // Sinkronisasi dengan Header Excel Anda: nis, namalengkap, jeniskelamin, grade, rombel
        const formattedStudents = data.map((row: any) => ({
          nis: String(row.nis || ''),
          namalengkap: String(row.namalengkap || ''),
          jeniskelamin: String(row.jeniskelamin || ''),
          grade: String(row.grade || ''),
          rombel: String(row.rombel || '')
        })).filter(s => s.nis && s.namalengkap);

        if (formattedStudents.length === 0) {
          throw new Error("Format kolom salah. Pastikan header: nis, namalengkap, jeniskelamin, grade, rombel.");
        }

        const result = await Swal.fire({
          title: 'Import Data',
          text: `Ditemukan ${formattedStudents.length} siswa. Kirim ke Database?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Import',
          confirmButtonColor: '#059669'
        });

        if (result.isConfirmed) {
          await db.upsertStudents(formattedStudents as any);
          Swal.fire({ icon: 'success', title: 'Berhasil!', text: `${formattedStudents.length} siswa terupdate.`, confirmButtonColor: '#059669' });
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Laporan & Pengaturan</h1>
          <p className="text-slate-500 text-sm">Kelola database siswa dan ekspor laporan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" /> Data Siswa
          </h2>
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center space-y-4">
            <p className="text-xs text-emerald-800">Upload file Excel dengan kolom: <b>nis, namalengkap, jeniskelamin, grade, rombel</b>.</p>
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full bg-white border-2 border-dashed border-emerald-300 py-6 rounded-2xl text-emerald-700 font-bold hover:bg-emerald-100 transition-all flex flex-col items-center gap-2">
              {importing ? <Loader2 size={24} className="animate-spin" /> : <><Upload size={24} /><span className="text-sm">Klik untuk Import Excel</span></>}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Download className="text-emerald-600" /> Ekspor Laporan
          </h2>
          <div className="space-y-3">
            <button onClick={() => handleExport('excel', 'nilai')} className="w-full bg-slate-50 border border-slate-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
              <FileSpreadsheet size={18} /> Laporan Nilai (Excel)
            </button>
            <button onClick={() => handleExport('pdf', 'absensi')} className="w-full bg-slate-50 border border-slate-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-700 transition-all">
              <FileText size={18} /> Laporan Absensi (PDF)
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-red-100 space-y-4">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2"><AlertTriangle /> Zona Berbahaya</h2>
          <p className="text-slate-500 text-xs">Reset database akan menghapus seluruh data Nilai dan Absensi secara permanen.</p>
          {resetStatus === 'success' ? (
            <div className="p-4 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm">Data Berhasil Direset!</div>
          ) : (
            <button onClick={() => setShowConfirmReset(!showConfirmReset)} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all">
              Reset Semua Data Nilai & Absensi
            </button>
          )}
          {showConfirmReset && (
            <div className="p-4 bg-red-600 text-white rounded-xl space-y-3 animate-slideUp">
              <p className="font-bold text-center text-sm">Konfirmasi Hapus Seluruh Data?</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 bg-red-800 py-2 rounded-lg text-sm font-bold">Batal</button>
                <button onClick={handleReset} className="flex-1 bg-white text-red-600 py-2 rounded-lg text-sm font-bold">Ya, Hapus</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
