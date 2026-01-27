
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

/**
 * Fungsi untuk mendownload elemen HTML sebagai file PDF
 * @param elementId ID elemen yang akan diconvert
 * @param fileName Nama file hasil download
 */
export const downloadAsPdf = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    Swal.fire('Error', 'Area data tidak ditemukan', 'error');
    return;
  }

  try {
    // Tampilkan loader progres
    Swal.fire({
      title: 'Mengonversi ke PDF...',
      text: 'Mohon tunggu sejenak, sedang menyiapkan file.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      heightAuto: false
    });

    // Capture elemen menjadi canvas (gambar)
    const canvas = await html2canvas(element, {
      scale: 2, // Kualitas tinggi
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Setup PDF (F4: 210 x 330 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 330] 
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Tambahkan gambar ke PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Download File Langsung
    pdf.save(`${fileName}.pdf`);

    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'File PDF telah terdownload.',
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    Swal.fire('Gagal', 'Terjadi kesalahan saat membuat PDF.', 'error');
  }
};
