
import * as XLSX from 'xlsx';

interface ExcelMeta {
  title: string;
  subTitle?: string;
  kelas: string;
  semester: string;
  bulan?: string;
  tahun?: string;
}

// Helper: Membuat Worksheet Tunggal dengan Format Header
const createStyledWorksheet = (data: any[], meta?: ExcelMeta) => {
    const aoa: any[][] = [];
    const colCount = Object.keys(data[0]).length;

    if (meta) {
      aoa.push([meta.title]);
      aoa.push(['PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI']);
      aoa.push([`KELAS ${meta.kelas}`]);
      let infoString = `Semester : ${meta.semester}`;
      if (meta.bulan) {
        infoString += `  |  Bulan : ${meta.bulan} ${meta.tahun || ''}`;
      }
      aoa.push([infoString]);
      aoa.push([]); 
    }

    // Header Tabel
    const headers = Object.keys(data[0]);
    aoa.push(headers);

    // Data
    data.forEach(row => {
      aoa.push(Object.values(row));
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Merge Cells untuk Header Kustom
    if (meta) {
      const mergeEndCol = colCount > 0 ? colCount - 1 : 4;
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: mergeEndCol } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: mergeEndCol } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: mergeEndCol } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: mergeEndCol } },
      ];
      // Lebar kolom
      worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    }

    return worksheet;
};

// Fungsi Export Single Sheet
export const generateExcel = (
  data: any[], 
  fileName: string, 
  sheetName: string, // Sheet name akan diisi nama kelas dari Caller
  meta?: ExcelMeta
) => {
  try {
    if (!data || data.length === 0) return false;
    const worksheet = createStyledWorksheet(data, meta);
    const workbook = XLSX.utils.book_new();
    // Gunakan sheetName yang dikirim (Nama Kelas)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel Error:", error);
    return false;
  }
};

// Fungsi Export Multi Sheet (Batch)
export const generateBatchExcel = (
    datasets: { data: any[], sheetName: string, meta: ExcelMeta }[],
    fileName: string
) => {
    try {
        if (!datasets || datasets.length === 0) return false;
        const workbook = XLSX.utils.book_new();

        datasets.forEach(ds => {
            const worksheet = createStyledWorksheet(ds.data, ds.meta);
            // Sanitasi nama sheet (Excel max 31 chars, no special chars)
            const safeSheetName = ds.sheetName.replace(/[\\/?*[\]]/g, "").substring(0, 30);
            XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
        });

        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error("Batch Excel Error:", error);
        return false;
    }
}
