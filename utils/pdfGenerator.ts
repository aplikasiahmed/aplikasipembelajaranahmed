
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
    const pageHeight = doc.internal.pageSize.getHeight();

    // 2. Header Laporan (Centered)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    const title = type === 'nilai' ? 'LAPORAN NILAI SISWA' : 'REKAPITULASI ABSENSI SISWA';
    const subTitle = 'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI';
    
    // Baris 1: Judul Utama
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    
    // Baris 2: Sub Judul
    doc.setFontSize(10);
    doc.text(subTitle, pageWidth / 2, 21, { align: 'center' });
    
    // Baris 3: KELAS (Ditebalkan dan di tengah sesuai request)
    doc.setFontSize(12);
    doc.text(`KELAS ${meta.kelas}`, pageWidth / 2, 28, { align: 'center' });
    
    // Garis Bawah Header (Tebal)
    doc.setLineWidth(0.3);
    doc.line(15, 32, pageWidth - 15, 32);

    // 3. Info Meta Data (Di bawah garis)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Kiri: Bulan (jika absensi) atau Semester (jika nilai)
    if (type === 'absensi' && meta.bulan) {
       doc.text(`Bulan : ${meta.bulan} ${meta.tahun}`, 15, 38);
       // Kanan: Semester
       doc.text(`Semester : ${meta.semester}`, pageWidth - 15, 38, { align: 'right' });
    } else {
       doc.text(`Semester : ${meta.semester}`, 15, 38);
    }
    
    // "Tanggal Cetak" dihilangkan sesuai request

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
        startY: 42, // Jarak dari meta data
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
            cellPadding: 1.3, // Padding kecil agar muat banyak
            valign: 'middle'
        }
    });

    // 6. Footer (Tanda Tangan Guru)
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Cek jika halaman tidak cukup (batas aman ~250mm)
    if (finalY > 250) {
        doc.addPage();
        finalY = 30; // Reset Y di halaman baru
    }

    // Format Tanggal: "Tangerang, 20 Januari 2026" (Lokasi default Tangerang sesuai profil)
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const dateString = `Tangerang, ${currentDate}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0); // Hitam

    // Posisi Tanda Tangan (Kanan)
    const signX = 140;
    
    // Tanggal di atas Mengetahui
    doc.text(dateString, signX, finalY);
    doc.text('Guru Mata Pelajaran', signX, finalY + 5);
    
    // Nama Guru (BOLD)
    doc.setFont('helvetica', 'bold');
    doc.text('Ahmad Nawasyi, S.Pd', signX, finalY + 35);
    doc.setFont('helvetica', 'normal'); // Kembalikan ke normal

    // 7. Footer Halaman (Looping semua halaman)
    const pageCount = doc.getNumberOfPages();
    const downloadDate = new Date().toLocaleDateString('id-ID');

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ubah Font menjadi Miring (Italic) & Kecil
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5);
        doc.setTextColor(100); // Abu-abu

        // Kiri: Judul Dokumen + Tanggal Download
        doc.text(`${title} -${subTitle} - ${downloadDate}`, 15, pageHeight - 10);

        // Kanan: Hal x dari y
        doc.text(`Hal ${i} dari ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    // 8. Simpan File
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
