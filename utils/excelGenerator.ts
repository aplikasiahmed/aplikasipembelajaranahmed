
import * as XLSX from 'xlsx';

export const generateExcel = (data: any[], fileName: string, sheetName: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel Error:", error);
    return false;
  }
};
