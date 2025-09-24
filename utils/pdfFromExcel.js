const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

async function generarPDFVacacionesDesdeExcel(datosSolicitud) {
  const templatePath = path.join(__dirname, 'UCIA-TH-FT-005  FORMATO DE SOLICITUD Y AUTORIZACIÓN DE VACACIONES.xlsx');
  const tmpDir = path.join(__dirname, '..', 'pdfs');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const timestamp = Date.now();
  const xlsxOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.xlsx`);
  const pdfOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.pdf`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  // Mapeo según solicitud del usuario
  if (ws && ws.getCell) {
    ws.getCell('C7').value = datosSolicitud.ciudad_departamento || '';
    ws.getCell('K7').value = datosSolicitud.fecha_solicitud || '';
    ws.getCell('D8').value = datosSolicitud.nombres_colaborador || '';
    if (ws.getCell('D9')) ws.getCell('D9').value = datosSolicitud.cedula_colaborador || '';
    if (ws.getCell('K9')) ws.getCell('K9').value = datosSolicitud.cargo_colaborador || '';
  }

  await wb.xlsx.writeFile(xlsxOut);

  // Intentar convertir a PDF con LibreOffice en diferentes comandos
  const commands = [
    `soffice --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`,
    `"C:/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`,
    `libreoffice --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`
  ];

  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'ignore' });
      if (fs.existsSync(pdfOut)) {
        return { fileName: path.basename(pdfOut), filePath: pdfOut };
      }
    } catch (_) { /* probar siguiente */ }
  }

  // Fallback 2: PowerShell + COM de Excel (requiere Microsoft Office instalado)
  try {
    const psScript = path.join(__dirname, 'convert_xlsx_to_pdf.ps1');
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}" -InputXlsx "${xlsxOut}" -OutputPdf "${pdfOut}"`, { stdio: 'ignore' });
    if (fs.existsSync(pdfOut)) {
      return { fileName: path.basename(pdfOut), filePath: pdfOut };
    }
  } catch (_) { /* continuar */ }

  // Fallback HTTP a convertidor externo (por ejemplo, contenedor con LibreOffice)
  const converterUrl = process.env.XLSX_PDF_CONVERTER_URL;
  if (converterUrl) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(xlsxOut));
      const resp = await axios.post(converterUrl, form, { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 60000 });
      if (resp.status === 200 && resp.data) {
        fs.writeFileSync(pdfOut, Buffer.from(resp.data));
        return { fileName: path.basename(pdfOut), filePath: pdfOut };
      }
    } catch (e) {
      console.error('❌ Error en convertidor HTTP XLSX->PDF:', e.message);
    }
  }

  // Si no se pudo convertir, devolver XLSX como fallback
  return { fileName: path.basename(xlsxOut), filePath: xlsxOut };
}

module.exports = { generarPDFVacacionesDesdeExcel }; 