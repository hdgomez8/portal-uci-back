const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

async function generarPDFVacacionesDesdeExcel(datosSolicitud) {
  console.log('📄 Iniciando generación de PDF desde Excel para solicitud:', datosSolicitud.id);
  
  const templatePath = path.join(__dirname, 'UCIA-TH-FT-005  FORMATO DE SOLICITUD Y AUTORIZACIÓN DE VACACIONES.xlsx');
  console.log('📁 Ruta de plantilla:', templatePath);
  console.log('📁 Plantilla existe:', fs.existsSync(templatePath));
  
  const tmpDir = path.join(__dirname, '..', 'pdfs');
  if (!fs.existsSync(tmpDir)) {
    console.log('📁 Creando directorio pdfs:', tmpDir);
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  console.log('📁 Directorio de salida:', tmpDir);

  const timestamp = Date.now();
  const xlsxOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.xlsx`);
  const pdfOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.pdf`);
  
  console.log('📄 Archivo XLSX de salida:', xlsxOut);
  console.log('📄 Archivo PDF de salida:', pdfOut);

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
  console.log('✅ Archivo XLSX generado:', xlsxOut);
  console.log('📊 Tamaño del XLSX:', fs.statSync(xlsxOut).size, 'bytes');

  // Intentar convertir a PDF con LibreOffice en diferentes comandos
  const commands = [
    `soffice --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`,
    `"C:/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`,
    `libreoffice --headless --convert-to pdf "${xlsxOut}" --outdir "${tmpDir}"`
  ];

  console.log('🔄 Intentando convertir XLSX a PDF...');
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`  Intento ${i + 1}/${commands.length}: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'pipe', timeout: 30000 });
      if (fs.existsSync(pdfOut)) {
        console.log('✅ PDF generado exitosamente:', pdfOut);
        console.log('📊 Tamaño del PDF:', fs.statSync(pdfOut).size, 'bytes');
        return { fileName: path.basename(pdfOut), filePath: pdfOut };
      } else {
        console.log(`  ⚠️ Comando ejecutado pero PDF no encontrado en: ${pdfOut}`);
      }
    } catch (error) {
      console.log(`  ❌ Error con comando ${i + 1}:`, error.message);
    }
  }

  // Fallback 2: PowerShell + COM de Excel (requiere Microsoft Office instalado)
  console.log('🔄 Intentando conversión con PowerShell...');
  try {
    const psScript = path.join(__dirname, 'convert_xlsx_to_pdf.ps1');
    console.log('📜 Script PowerShell:', psScript);
    console.log('📜 Script existe:', fs.existsSync(psScript));
    
    if (fs.existsSync(psScript)) {
      execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}" -InputXlsx "${xlsxOut}" -OutputPdf "${pdfOut}"`, { 
        stdio: 'pipe', 
        timeout: 60000 
      });
      if (fs.existsSync(pdfOut)) {
        console.log('✅ PDF generado con PowerShell:', pdfOut);
        console.log('📊 Tamaño del PDF:', fs.statSync(pdfOut).size, 'bytes');
        return { fileName: path.basename(pdfOut), filePath: pdfOut };
      }
    } else {
      console.log('⚠️ Script PowerShell no encontrado');
    }
  } catch (error) {
    console.log('❌ Error con PowerShell:', error.message);
  }

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
  console.log('⚠️ No se pudo convertir a PDF, devolviendo XLSX como fallback');
  console.log('📄 Archivo XLSX disponible:', xlsxOut);
  console.log('📊 Tamaño del XLSX:', fs.statSync(xlsxOut).size, 'bytes');
  return { fileName: path.basename(xlsxOut), filePath: xlsxOut };
}

module.exports = { generarPDFVacacionesDesdeExcel }; 