const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

// Función para encontrar la firma de un empleado
function encontrarFirma(documento) {
  if (!documento) return null;
  
  const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
  const firmasDir = path.join(__dirname, '..', 'firmas');
  
  for (const ext of extensions) {
    const firmaPath = path.join(firmasDir, `${documento}${ext}`);
    if (fs.existsSync(firmaPath)) {
      return firmaPath;
    }
  }
  return null;
}

async function generarPDFVacacionesDesdeExcel(datosSolicitud) {
  let xlsxOut = null;
  let pdfOut = null;
  
  try {
    console.log('📄 Iniciando generación de PDF desde Excel para solicitud:', datosSolicitud.id);
    console.log('📊 Estado de la solicitud:', datosSolicitud.estado);
    
    const templatePath = path.join(__dirname, 'UCIA-TH-FT-005  FORMATO DE SOLICITUD Y AUTORIZACIÓN DE VACACIONES.xlsx');
    console.log('📁 Ruta de plantilla:', templatePath);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`La plantilla Excel no existe: ${templatePath}`);
    }
    console.log('📁 Plantilla existe: ✅');
    
    const tmpDir = path.join(__dirname, '..', 'pdfs');
    if (!fs.existsSync(tmpDir)) {
      console.log('📁 Creando directorio pdfs:', tmpDir);
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    console.log('📁 Directorio de salida:', tmpDir);

    const timestamp = Date.now();
    xlsxOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.xlsx`);
    pdfOut = path.join(tmpDir, `vacaciones_${datosSolicitud.id}_${timestamp}.pdf`);
    
    console.log('📄 Archivo XLSX de salida:', xlsxOut);
    console.log('📄 Archivo PDF de salida:', pdfOut);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);
    const ws = wb.worksheets[0];
    
    if (!ws) {
      throw new Error('No se pudo leer la hoja de trabajo del archivo Excel');
    }

  // Mapeo de datos básicos
  if (ws && ws.getCell) {
    ws.getCell('C7').value = datosSolicitud.ciudad_departamento || '';
    ws.getCell('K7').value = datosSolicitud.fecha_solicitud || '';
    ws.getCell('D8').value = datosSolicitud.nombres_colaborador || '';
    if (ws.getCell('D9')) ws.getCell('D9').value = datosSolicitud.cedula_colaborador || '';
    if (ws.getCell('K9')) ws.getCell('K9').value = datosSolicitud.cargo_colaborador || '';
  }
  
  // Manejar firmas según el estado de aprobación
  // Nota: Las celdas de firmas pueden variar según el formato Excel
  // Ajustar estas referencias según la estructura real del archivo Excel
  const estado = datosSolicitud.estado || 'pendiente';
  
  // Determinar qué aprobaciones están completadas
  const aprobadoPorJefe = estado !== 'pendiente'; // Si pasó de pendiente, tiene visto bueno del jefe
  const aprobadoPorAdmin = estado === 'aprobado_por_admin' || estado === 'aprobado';
  const aprobadoPorRRHH = estado === 'aprobado';
  
  console.log('📋 Estado de aprobaciones:');
  console.log('  - Jefe:', aprobadoPorJefe ? 'Aprobado' : 'Sin aprobar');
  console.log('  - Administración:', aprobadoPorAdmin ? 'Aprobado' : 'Sin aprobar');
  console.log('  - RRHH:', aprobadoPorRRHH ? 'Aprobado' : 'Sin aprobar');
  
  // Agregar texto "Sin aprobar" o firmas según corresponda
  // Nota: Las referencias de celdas deben ajustarse según el formato Excel real
  // Estas son celdas típicas para firmas - buscar en el Excel las celdas correctas
  try {
    // Función auxiliar para establecer valor en celda de forma segura
    const setCellValue = (cellRef, value) => {
      try {
        const cell = ws.getCell(cellRef);
        if (cell) {
          cell.value = value;
          console.log(`✅ Celda ${cellRef} actualizada: ${value}`);
        }
      } catch (err) {
        console.warn(`⚠️ No se pudo actualizar celda ${cellRef}:`, err.message);
      }
    };
    
    // Firma del empleado (solicitante) - siempre presente
    if (datosSolicitud.empleado?.nombres) {
      // Buscar celdas donde van las firmas (ajustar según formato real)
      // Intentar múltiples posibles ubicaciones
      const posiblesCeldasEmpleado = ['D45', 'D44', 'D43', 'D42', 'D41'];
      for (const cellRef of posiblesCeldasEmpleado) {
        try {
          const cell = ws.getCell(cellRef);
          if (cell && cell.value !== undefined) {
            setCellValue(cellRef, datosSolicitud.empleado.nombres);
            break;
          }
        } catch (e) {}
      }
    }
    
    // Firma del jefe - mostrar nombre si aprobado, "Sin aprobar" si no
    const posiblesCeldasJefe = ['F45', 'F44', 'F43', 'F42', 'F41', 'G45', 'G44'];
    const valorJefe = aprobadoPorJefe && datosSolicitud.jefe?.nombres 
      ? datosSolicitud.jefe.nombres 
      : 'Sin aprobar';
    for (const cellRef of posiblesCeldasJefe) {
      try {
        const cell = ws.getCell(cellRef);
        if (cell && cell.value !== undefined) {
          setCellValue(cellRef, valorJefe);
          break;
        }
      } catch (e) {}
    }
    
    // Firma de administración
    const posiblesCeldasAdmin = ['H45', 'H44', 'H43', 'H42', 'H41', 'I45', 'I44'];
    const valorAdmin = aprobadoPorAdmin && datosSolicitud.administrador?.nombres 
      ? datosSolicitud.administrador.nombres 
      : 'Sin aprobar';
    for (const cellRef of posiblesCeldasAdmin) {
      try {
        const cell = ws.getCell(cellRef);
        if (cell && cell.value !== undefined) {
          setCellValue(cellRef, valorAdmin);
          break;
        }
      } catch (e) {}
    }
    
    // Firma de RRHH
    const posiblesCeldasRRHH = ['J45', 'J44', 'J43', 'J42', 'J41', 'K45', 'K44'];
    const valorRRHH = aprobadoPorRRHH && datosSolicitud.rrhh?.nombres 
      ? datosSolicitud.rrhh.nombres 
      : 'Sin aprobar';
    for (const cellRef of posiblesCeldasRRHH) {
      try {
        const cell = ws.getCell(cellRef);
        if (cell && cell.value !== undefined) {
          setCellValue(cellRef, valorRRHH);
          break;
        }
      } catch (e) {}
    }
    
    console.log('✅ Firmas procesadas según estado de aprobación');
  } catch (error) {
    console.warn('⚠️ Error al agregar firmas al Excel:', error.message);
    console.warn('⚠️ Continuando sin modificar firmas...');
  }

  // Guardar el archivo XLSX
  try {
    await wb.xlsx.writeFile(xlsxOut);
    
    // Verificar que el archivo se guardó correctamente
    if (!fs.existsSync(xlsxOut)) {
      throw new Error(`El archivo XLSX no se guardó correctamente: ${xlsxOut}`);
    }
    
    const xlsxStats = fs.statSync(xlsxOut);
    console.log('✅ Archivo XLSX generado:', xlsxOut);
    console.log('📊 Tamaño del XLSX:', xlsxStats.size, 'bytes');
    
    if (xlsxStats.size === 0) {
      throw new Error(`El archivo XLSX está vacío: ${xlsxOut}`);
    }
  } catch (writeError) {
    console.error('❌ Error al guardar archivo XLSX:', writeError);
    throw new Error(`Error al guardar archivo XLSX: ${writeError.message}`);
  }

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
      // Ejecutar el comando y esperar a que termine completamente
      execSync(cmd, { 
        stdio: 'pipe', 
        timeout: 60000, // Aumentar timeout a 60 segundos
        cwd: tmpDir // Ejecutar desde el directorio de salida
      });
      
      // Esperar un momento para asegurar que el archivo se haya escrito completamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (fs.existsSync(pdfOut)) {
        const pdfStats = fs.statSync(pdfOut);
        
        // Validar que el PDF sea válido leyendo los primeros bytes
        const pdfBuffer = fs.readFileSync(pdfOut);
        const esPDFValido = pdfBuffer.length >= 4 && 
                           pdfBuffer[0] === 0x25 && 
                           pdfBuffer[1] === 0x50 && 
                           pdfBuffer[2] === 0x44 && 
                           pdfBuffer[3] === 0x46; // %PDF
        
        if (pdfStats.size === 0) {
          console.log(`  ⚠️ PDF generado está vacío (${pdfStats.size} bytes), continuando con siguiente método...`);
          // Eliminar el archivo vacío
          try { fs.unlinkSync(pdfOut); } catch (e) {}
          continue;
        }
        
        if (!esPDFValido) {
          console.log(`  ⚠️ Archivo generado no parece ser un PDF válido`);
          console.log(`  ⚠️ Primeros bytes:`, Array.from(pdfBuffer.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          // Continuar para intentar otro método
          continue;
        }
        
        console.log('✅ PDF generado exitosamente:', pdfOut);
        console.log('📊 Tamaño del PDF:', pdfStats.size, 'bytes');
        console.log('✅ PDF válido (verificado por magic numbers)');
        return { fileName: path.basename(pdfOut), filePath: pdfOut };
      } else {
        console.log(`  ⚠️ Comando ejecutado pero PDF no encontrado en: ${pdfOut}`);
      }
    } catch (error) {
      console.log(`  ❌ Error con comando ${i + 1}:`, error.message);
      if (error.stdout) console.log(`  📤 stdout:`, error.stdout.toString());
      if (error.stderr) console.log(`  📤 stderr:`, error.stderr.toString());
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
        const pdfStats = fs.statSync(pdfOut);
        // Validar que el PDF sea válido
        const pdfBuffer = fs.readFileSync(pdfOut, { start: 0, end: 4 });
        const esPDFValido = pdfBuffer[0] === 0x25 && pdfBuffer[1] === 0x50 && pdfBuffer[2] === 0x44 && pdfBuffer[3] === 0x46;
        
        if (pdfStats.size > 0 && esPDFValido) {
          console.log('✅ PDF generado con PowerShell:', pdfOut);
          console.log('📊 Tamaño del PDF:', pdfStats.size, 'bytes');
          console.log('✅ PDF válido (verificado por magic numbers)');
          return { fileName: path.basename(pdfOut), filePath: pdfOut };
        } else {
          console.log('⚠️ PDF generado no es válido o está vacío');
        }
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
        const pdfBuffer = Buffer.from(resp.data);
        fs.writeFileSync(pdfOut, pdfBuffer);
        
        // Validar que el PDF sea válido
        const esPDFValido = pdfBuffer[0] === 0x25 && pdfBuffer[1] === 0x50 && pdfBuffer[2] === 0x44 && pdfBuffer[3] === 0x46;
        
        if (pdfBuffer.length > 0 && esPDFValido) {
          console.log('✅ PDF generado con convertidor HTTP:', pdfOut);
          console.log('📊 Tamaño del PDF:', pdfBuffer.length, 'bytes');
          console.log('✅ PDF válido (verificado por magic numbers)');
          return { fileName: path.basename(pdfOut), filePath: pdfOut };
        } else {
          console.log('⚠️ PDF generado no es válido');
        }
      }
    } catch (e) {
      console.error('❌ Error en convertidor HTTP XLSX->PDF:', e.message);
    }
  }

    // Si no se pudo convertir, devolver XLSX como fallback
    // Verificar que el XLSX existe antes de retornarlo
    if (!fs.existsSync(xlsxOut)) {
      throw new Error(`El archivo XLSX no existe después de intentar convertir: ${xlsxOut}`);
    }
    
    const xlsxStats = fs.statSync(xlsxOut);
    if (xlsxStats.size === 0) {
      throw new Error(`El archivo XLSX está vacío: ${xlsxOut}`);
    }
    
    console.log('⚠️ No se pudo convertir a PDF, devolviendo XLSX como fallback');
    console.log('📄 Archivo XLSX disponible:', xlsxOut);
    console.log('📊 Tamaño del XLSX:', xlsxStats.size, 'bytes');
    return { fileName: path.basename(xlsxOut), filePath: xlsxOut };
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en generarPDFVacacionesDesdeExcel:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Si hay un XLSX generado, intentar retornarlo como último recurso
    if (xlsxOut && fs.existsSync(xlsxOut)) {
      const xlsxStats = fs.statSync(xlsxOut);
      if (xlsxStats.size > 0) {
        console.log('⚠️ Retornando XLSX como último recurso debido a error');
        return { fileName: path.basename(xlsxOut), filePath: xlsxOut };
      }
    }
    
    // Si no hay nada que retornar, lanzar el error
    throw new Error(`Error al generar formato desde Excel: ${error.message}`);
  }
}

module.exports = { generarPDFVacacionesDesdeExcel }; 