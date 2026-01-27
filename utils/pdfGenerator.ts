
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

/**
 * Fungsi untuk generate PDF Laporan Nilai atau Absensi
 * Menghasilkan file PDF asli (Teks dapat diseleksi), bukan gambar.
 */
export const generatePDFReport = (
  type: 'nilai' | 'absensi',
  data: any[],
  meta: { kelas: string; semester: string; bulan?: string; tahun?: string }
) => {
  try {
    // 1. Inisialisasi Dokumen PDF (A4 Portrait)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 2. Header Laporan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    const title = type === 'nilai' ? 'LAPORAN NILAI SISWA' : 'REKAPITULASI ABSENSI SISWA';
    const subTitle = 'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI';
    
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(subTitle, pageWidth / 2, 21, { align: 'center' });
    
    // Garis Bawah Header
    doc.setLineWidth(0.3);
    doc.line(15, 25, pageWidth - 15, 25);

    // 3. Info Meta Data (Kelas, Semester, dll)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Kelas : ${meta.kelas}`, 15, 32);
    doc.text(`Semester : ${meta.semester}`, 15, 37);
    
    if (type === 'absensi' && meta.bulan) {
       doc.text(`Bulan : ${meta.bulan} ${meta.tahun}`, pageWidth - 15, 32, { align: 'right' });
    }
    doc.text(`Tanggal Cetak : ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 15, 37, { align: 'right' });

    // 4. Konfigurasi Tabel
    let head = [];
    let body = [];

    if (type === 'nilai') {
        head = [['No', 'NIS', 'Nama Siswa', 'Materi / Keterangan', 'Jenis', 'Nilai']];
        body = data.map((item, index) => [
            index + 1,
            item.data_siswa?.nis || '-',
            item.data_siswa?.namalengkap || 'Siswa',
            item.description || '-',
            item.subject_type?.toUpperCase() || '-',
            item.score
        ]);
    } else {
        // Absensi
        head = [['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alfa']];
        body = data.map((item, index) => [
            index + 1,
            item.NIS,
            item['NAMA SISWA'],
            item.H,
            item.S,
            item.I,
            item.A
        ]);
    }

    // 5. Generate Tabel menggunakan AutoTable
    autoTable(doc, {
        head: head,
        body: body,
        startY: 45,
        theme: 'grid',
        headStyles: { 
            fillColor: [5, 150, 105], // Emerald-600 color
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: 50
        },
        columnStyles: type === 'nilai' ? {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 20 },
            5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
        } : {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'center', cellWidth: 15, textColor: [220, 38, 38] } // Merah untuk Alfa
        },
        styles: {
            cellPadding: 1.2 // Dikurangi menjadi 1 agar lebih rapat dan muat banyak baris
            valign: 'middle'
        }
    });

    // 6. Footer (Tanda Tangan Guru)
    // Mengurangi jarak margin atas tanda tangan (dari 15 ke 10)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Cek jika halaman tidak cukup (batas aman ~270mm untuk A4)
    if (finalY > 265) {
        doc.addPage();
        doc.text('Mengetahui,', 140, 30);
        doc.text('Guru Mata Pelajaran', 140, 35);
        doc.text('Ahmad Nawasyi, S.Pd', 140, 55);
    } else {
        doc.text('Mengetahui,', 140, finalY);
        doc.text('Guru Mata Pelajaran', 140, finalY + 5);
        doc.text('Ahmad Nawasyi, S.Pd', 140, finalY + 25);
    }

    // 7. Simpan File
    const fileName = type === 'nilai' 
        ? `Laporan_Nilai_${meta.kelas}_Sem${meta.semester}.pdf` 
        : `Rekap_Absen_${meta.kelas}_${meta.bulan}.pdf`;
        
    doc.save(fileName);

    Swal.fire({
      icon: 'success',
      title: 'PDF Berhasil Dibuat',
      text: 'File telah didownload.',
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false
    });

  } catch (error) {
    console.error('PDF Error:', error);
    Swal.fire('Gagal', 'Terjadi kesalahan saat membuat PDF.', 'error');
  }
};
