
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

// Helper internal untuk menggambar konten halaman
const drawPageContent = (doc: jsPDF, type: 'nilai' | 'absensi', data: any[], meta: any) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0);
    
    const title = type === 'nilai' ? 'LAPORAN NILAI SISWA' : 'REKAPITULASI ABSENSI SISWA';
    const subTitle = 'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI';
    
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(subTitle, pageWidth / 2, 21, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KELAS ${meta.kelas}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(15, 32, pageWidth - 15, 32);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (type === 'absensi' && meta.bulan) {
       doc.text(`Bulan : ${meta.bulan} ${meta.tahun}`, 15, 38);
       doc.text(`Semester : ${meta.semester}`, pageWidth - 15, 38, { align: 'right' });
    } else {
       doc.text(`Semester : ${meta.semester}`, 15, 38);
    }

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

    autoTable(doc, {
        head: head,
        body: body,
        startY: 42,
        theme: 'grid',
        headStyles: { 
            fillColor: [5, 150, 105],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: { fontSize: 8, textColor: 50 },
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
            6: { halign: 'center', cellWidth: 15, textColor: [220, 38, 38] }
        },
        styles: { cellPadding: 1, valign: 'middle' }
    });

    // Tanda Tangan
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY > 250) {
        // Jika mepet bawah, tidak addPage di sini karena konteksnya per halaman, 
        // tapi secara visual mungkin terpotong. Sederhananya biarkan flow autoTable.
        // Untuk footer tanda tangan manual:
    }
    
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const signX = 140;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    
    doc.text(`Tangerang, ${currentDate}`, signX, finalY);
    doc.text('Mengetahui,', signX, finalY + 5);
    doc.text('Guru Mata Pelajaran', signX, finalY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ahmad Nawasyi, S.Pd', signX, finalY + 35);
};

export const generatePDFReport = (
  type: 'nilai' | 'absensi',
  data: any[],
  meta: { kelas: string; semester: string; bulan?: string; tahun?: string }
) => {
  try {
    const doc = new jsPDF();
    drawPageContent(doc, type, data, meta);
    
    // Footer Halaman
    const pageCount = doc.getNumberOfPages();
    // PERBAIKAN: Menggunakan Backticks (`) untuk string template agar tidak error syntax
    const title = type === 'nilai' 
      ? `LAPORAN NILAI SISWA ${meta.kelas} semester ${meta.semester}` 
      : `Rekap Absensi_PAI ${meta.kelas} ${meta.bulan} semester ${meta.semester}`;
      
    const downloadDate = new Date().toLocaleDateString('id-ID');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(100);
        doc.text(`${title} - ${downloadDate}`, 15, pageHeight - 10);
        doc.text(`Hal ${i} dari ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    const fileName = type === 'nilai' 
        ? `Laporan_Nilai_${meta.kelas}_Sem${meta.semester}.pdf` 
        : `Rekap_Absen_${meta.kelas}_${meta.bulan}__Semesster${meta.semester}.pdf`;
    doc.save(fileName);

    Swal.fire({ icon: 'success', title: 'PDF Berhasil Dibuat', timer: 1500, showConfirmButton: false, heightAuto: false });
  } catch (error) {
    console.error('PDF Error:', error);
    Swal.fire('Gagal', 'Terjadi kesalahan PDF.', 'error');
  }
};

// Fungsi Baru untuk Batch PDF
export const generateBatchPDFReport = (
    type: 'nilai' | 'absensi',
    datasets: { data: any[], meta: any }[]
) => {
    try {
        const doc = new jsPDF();
        
        datasets.forEach((ds, index) => {
            if (index > 0) doc.addPage();
            drawPageContent(doc, type, ds.data, ds.meta);
        });

        // Footer Halaman Global
        const pageCount = doc.getNumberOfPages();
        const title = type === 'nilai' ? 'Rekap Nilai' : 'Rekap Absensi';
        const downloadDate = new Date().toLocaleDateString('id-ID');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`${title} - ${downloadDate}`, 15, pageHeight - 10);
            doc.text(`Hal ${i} dari ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
        }

        const fileName = type === 'nilai' 
            ? `Laporan_Nilai_SEMUA_KELAS_Sem${datasets[0].meta.semester}.pdf` 
            : `Rekap_Absen_SEMUA_KELAS_${datasets[0].meta.bulan}.pdf`;
        doc.save(fileName);

        Swal.fire({ icon: 'success', title: 'PDF Batch Berhasil', text: 'Semua kelas dalam satu file.', timer: 1500, showConfirmButton: false, heightAuto: false });

    } catch (error) {
        console.error('Batch PDF Error:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan Batch PDF.', 'error');
    }
}
