import ExcelJS from 'https://esm.sh/exceljs@4.4.0';
import FileSaver from 'https://esm.sh/file-saver@2.0.5';

interface ExcelMeta {
  title: string;
  subTitle?: string;
  kelas: string;
  semester: string;
  bulan?: string;
  tahun?: string;
  withValidation?: boolean; 
}

const setupWorksheet = (sheet: any, data: any[], meta?: ExcelMeta) => {
    // 1. Atur Lebar Kolom (Sesuai Screenshot)
    sheet.columns = [
        { width: 5 },  // A: NO
        { width: 15 }, // B: NIS
        { width: 35 }, // C: NAMA SISWA
        { width: 10 }, // D: KELAS
        { width: 12 }, // E: SEMESTER
        { width: 15 }, // F: JENIS TUGAS
        { width: 25 }, // G: KET/MATERI
        { width: 10 }, // H: NILAI
    ];

    // 2. Header Judul (TANPA MERGE) - Sesuai Permintaan
    if (meta) {
        // Row 1
        const cellA1 = sheet.getCell('A1');
        cellA1.value = meta.title;
        cellA1.font = { bold: true, name: 'Calibri', size: 11 };

        // Row 2
        const cellA2 = sheet.getCell('A2');
        cellA2.value = 'PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI';
        cellA2.font = { name: 'Calibri', size: 11 };

        // Row 3
        const cellA3 = sheet.getCell('A3');
        cellA3.value = `KELAS ${meta.kelas}`;
        cellA3.font = { name: 'Calibri', size: 11 };

        // Row 4
        let infoString = `Semester : ${meta.semester}`;
        if (meta.bulan) {
            infoString += `  |  Bulan : ${meta.bulan} ${meta.tahun || ''}`;
        }
        const cellA4 = sheet.getCell('A4');
        cellA4.value = infoString;
        cellA4.font = { name: 'Calibri', size: 11 };
        
        // Row 5 kosong
    }

    // 3. Header Tabel (Mulai Baris 6)
    const headers = Object.keys(data[0]);
    const headerRow = sheet.getRow(6);
    headerRow.values = headers;
    
    // Styling Header Tabel
    headerRow.eachCell((cell: any) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // 4. Isi Data (Mulai Baris 7)
    data.forEach((row, index) => {
        const currentRow = sheet.getRow(7 + index);
        currentRow.values = Object.values(row);
        
        // Styling Border Data
        currentRow.eachCell((cell: any) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // 5. FITUR DATA VALIDATION (DROPDOWN) - PASTI MUNCUL
    if (meta?.withValidation) {
        // Asumsi data sampai baris 100
        const startRow = 7;
        const endRow = 100;

        for (let i = startRow; i <= endRow; i++) {
            // Kolom E (Semester) -> Index 5
            sheet.getCell(`E${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"1,2"'], // Dropdown Semester
                showErrorMessage: true,
                errorTitle: 'Input Salah',
                error: 'Pilih 1 atau 2'
            };

            // Kolom F (Jenis Tugas) -> Index 6
            sheet.getCell(`F${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"Harian,UTS,UAS,Praktik"'], // Dropdown Jenis Tugas
                showErrorMessage: true,
                errorTitle: 'Input Salah',
                error: 'Pilih jenis tugas yang tersedia'
            };
        }
    }
};

export const generateExcel = async (
  data: any[], 
  fileName: string, 
  sheetName: string, 
  meta?: ExcelMeta
) => {
  try {
    if (!data || data.length === 0) return false;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

    setupWorksheet(worksheet, data, meta);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Fix: Handle inconsistent file-saver exports from esm.sh
    const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;
    saveAs(blob, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel Error:", error);
    return false;
  }
};

export const generateBatchExcel = async (
    datasets: { data: any[], sheetName: string, meta: ExcelMeta }[],
    fileName: string
) => {
    try {
        if (!datasets || datasets.length === 0) return false;

        const workbook = new ExcelJS.Workbook();

        datasets.forEach(ds => {
            const safeSheetName = ds.sheetName.replace(/[\\/?*[\]]/g, "").substring(0, 30);
            const worksheet = workbook.addWorksheet(safeSheetName);
            setupWorksheet(worksheet, ds.data, ds.meta);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Fix: Handle inconsistent file-saver exports from esm.sh
        const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;
        saveAs(blob, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error("Batch Excel Error:", error);
        return false;
    }
}