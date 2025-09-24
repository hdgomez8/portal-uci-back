const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const AdjuntoSolicitud = require('../models/Solicitudes/AdjuntoSolicitud');

const generarPDFPermiso = async (solicitud, empleado, jefe) => {
    try {
        // Función para encontrar la firma de un empleado y convertirla a base64
        function encontrarFirma(documento) {
            if (!documento) {
                console.log('⚠️ Documento vacío para buscar firma');
                return null;
            }
            
            const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
            const firmasDir = path.join(__dirname, '..', 'firmas');
            
            console.log(`🔍 Buscando firma para documento: ${documento}`);
            console.log(`📁 Directorio de firmas: ${firmasDir}`);
            
            for (const ext of extensions) {
                const firmaPath = path.join(firmasDir, `${documento}${ext}`);
                console.log(`  Probando: ${firmaPath}`);
                
                if (fs.existsSync(firmaPath)) {
                    try {
                        // Leer la imagen y convertirla a base64
                        const imageBuffer = fs.readFileSync(firmaPath);
                        const base64Image = imageBuffer.toString('base64');
                        const mimeType = ext === '.png' ? 'image/png' : 
                                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                                        ext === '.gif' ? 'image/gif' : 'image/png';
                        
                        const result = `data:${mimeType};base64,${base64Image}`;
                        console.log(`✅ Firma encontrada y convertida a base64: ${documento}${ext}`);
                        return result;
                    } catch (error) {
                        console.error(`❌ Error leyendo imagen ${firmaPath}:`, error.message);
                        return null;
                    }
                }
            }
            
            console.log(`❌ No se encontró firma para documento: ${documento}`);
            return null;
        }

        function fechaEnCasillas(fechaStr) {
            if (!fechaStr) return ['', '', ''];
            try {
                console.log('🔍 Procesando fecha:', fechaStr);
                
                // Si la fecha viene en formato YYYY-MM-DD, procesarla directamente
                if (typeof fechaStr === 'string' && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = fechaStr.split('-');
                    console.log('📅 Fecha procesada directamente:', { day, month, year });
                    return [day, month, year];
                }
                
                // Para otros formatos, usar Date pero ajustar zona horaria
                const d = new Date(fechaStr);
                
                // Verificar si la fecha es válida
                if (isNaN(d.getTime())) {
                    console.log('⚠️ Fecha inválida:', fechaStr);
                    return ['', '', ''];
                }
                
                // Ajustar para zona horaria local
                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                const dd = String(localDate.getDate()).padStart(2, '0');
                const mm = String(localDate.getMonth() + 1).padStart(2, '0');
                const yyyy = localDate.getFullYear().toString();
                
                console.log('📅 Fecha procesada con ajuste de zona horaria:', { dd, mm, yyyy });
                return [dd, mm, yyyy];
            } catch (error) {
                console.log('⚠️ Error procesando fecha:', fechaStr, error.message);
                return ['', '', ''];
            }
        }
        console.log('📋 Datos de solicitud recibidos:', {
            id: solicitud.id,
            fecha_creacion: solicitud.fecha_creacion,
            fecha: solicitud.fecha,
            tipo: typeof solicitud.fecha_creacion
        });
        
        const [sol_dd, sol_mm, sol_yyyy] = fechaEnCasillas(solicitud.fecha_creacion);
        const [perm_dd, perm_mm, perm_yyyy] = fechaEnCasillas(solicitud.fecha);
        
        // Validar que las fechas no sean undefined
        console.log('📅 Fechas extraídas:', {
            solicitud: { dd: sol_dd, mm: sol_mm, yyyy: sol_yyyy },
            permiso: { dd: perm_dd, mm: perm_mm, yyyy: perm_yyyy }
        });
        const tipoId = solicitud.tipo_solicitud?.id;
        
        // Función para cargar el logo y convertirlo a base64
        function cargarLogo() {
            const logoPath = path.join(__dirname, '..', 'logo_empresa.png');
            console.log(`🔍 Buscando logo en: ${logoPath}`);
            
            if (fs.existsSync(logoPath)) {
                try {
                    const imageBuffer = fs.readFileSync(logoPath);
                    const base64Image = imageBuffer.toString('base64');
                    const result = `data:image/png;base64,${base64Image}`;
                    console.log(`✅ Logo encontrado y convertido a base64 (${imageBuffer.length} bytes)`);
                    return result;
                } catch (error) {
                    console.error(`❌ Error leyendo logo ${logoPath}:`, error.message);
                    return null;
                }
            } else {
                console.log(`❌ Logo no encontrado en: ${logoPath}`);
                return null;
            }
        }

        // Buscar firmas y logo antes de generar el HTML
        console.log('\n📋 Buscando firmas y logo para el PDF...');
        const firmaEmpleado = encontrarFirma(empleado.documento);
        const firmaJefe = encontrarFirma(jefe.documento);
        const logoBase64 = cargarLogo();
        
        console.log('📋 Resultados de búsqueda:');
        console.log(`  Empleado (${empleado.documento}): ${firmaEmpleado ? '✅ Encontrada' : '❌ No encontrada'}`);
        console.log(`  Jefe (${jefe.documento}): ${firmaJefe ? '✅ Encontrada' : '❌ No encontrada'}`);
        console.log(`  Logo: ${logoBase64 ? '✅ Encontrado' : '❌ No encontrado'}`);
        let htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de permiso</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 10px; }
        h1 { color: #333; }
        p { color: #555; }
        table { width: 100%; border-collapse: collapse; }
        table { border: 1px solid #000; }
        td { text-align: left; }
        td img { max-height: 100px; width: auto; }
        td:nth-child(2) { width: 80%; }
        td:nth-child(1), td:nth-child(3) { width: 10%; }
        div { text-align: center; }
    </style>
</head>
<body>
<table>
    <tbody style="height: 10px;">
    <tr>
        <td rowspan="4" style="width: 20%; border: 1px solid #000;">${logoBase64 ? `<img src="${logoBase64}" style="max-width: 100%; max-height: 100%;">` : '<div style="text-align: center; padding: 20px; color: #999;">Logo no disponible</div>'}</td>
        <td rowspan="4" style="width: 60%; text-align: center;"><strong>FORMATO UNICO DE SOLICITUD DE PERMISO</strong></td>
        <td style="width: 20%; border: 1px solid #000; text-align: center;"><strong>CODIGO</strong><br>UCIA-TH-FT-003</td>
    </tr>
    <tr>
        <td style="width: 10%; border: 1px solid #000; text-align: center;"><strong>FECHA EMISION</strong><br>14.02.20</td>
    </tr>
    <tr>
        <td style="width: 10%; border: 1px solid #000; text-align: center;"><strong>FECHA ACTUALIZACION</strong><br>29.04.22</td>
    </tr>
    <tr>
        <td style="width: 10%; border: 1px solid #000; text-align: center;"><strong>VERSION: </strong>003</td>
    </tr>
    </tbody>
</table>
<table style="height: 5px; width: 100%;" border="1">
    <tbody>
    <tr>
        <td style="text-align: center;"><strong>DATOS DEL EMPLEADO</strong></td>
    </tr>
    </tbody>
</table>
<table style="height: 47px; width: 100%;">
    <tbody>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 20%;"></td>
        <td style="width: 30%;"></td>
        <td style="width: 20%;"></td>
        <td style="width: 29%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="width: 100%;">
        <td style="width: 20%;">NOMBRE COMPLETO</td>
        <td colspan="3" style="width: 79%; border: 1px solid #000;">${empleado.nombres} ${empleado.apellidos}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 20%;"></td>
        <td style="width: 30%;"></td>
        <td style="width: 20%;"></td>
        <td style="width: 29%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="width: 100%;">
        <td style="width: 20%;">CARGO&nbsp;</td>
        <td style="width: 30%; border: 1px solid #000;">${empleado.cargo}</td>
        <td style="width: 20%; text-align: center;">AREA</td>
        <td style="width: 29%; border: 1px solid #000;">${empleado.area.toUpperCase()}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 20%;"></td>
        <td style="width: 30%;"></td>
        <td style="width: 20%;"></td>
        <td style="width: 29%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="width: 100%;">
        <td style="width: 20%;">JEFE INMEDIATO&nbsp;</td>
        <td colspan="3" style="width: 79%; border: 1px solid #000;">${empleado.jefeNombres} ${empleado.jefeApellidos}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 20%;"></td>
        <td style="width: 30%;"></td>
        <td style="width: 20%;"></td>
        <td style="width: 29%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    </tbody>
</table>
<table style="height: 5px; width: 100%;" border="1">
    <tbody>
    <tr>
        <td style="text-align: center;"><strong>DATOS DE LA SOLICITUD</strong></td>
    </tr>
    </tbody>
</table>
<table style="width: 100%;">
    <tbody>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">FECHA SOLICITUD</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%;  border: 1px solid #000;text-align: center;">DD</td>
        <td style="width: 8%;  border: 1px solid #000;text-align: center;">MM</td>
        <td style="width: 8%;  border: 1px solid #000;text-align: center;">AAAA</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">FECHA PERMISO</td>
        <td style="width: 8%;  border: 1px solid #000;text-align: center;">DD</td>
        <td style="width: 8%;  border: 1px solid #000;text-align: center;">MM</td>
        <td style="width: 7%;  border: 1px solid #000;text-align: center;">AAAA</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${sol_dd || ''}</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${sol_mm || ''}</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${sol_yyyy || ''}</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">&nbsp;</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${perm_dd || ''}</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${perm_mm || ''}</td>
        <td style="width: 7%; border: 1px solid #000;  text-align: center;">${perm_yyyy || ''}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">HORA PERMISO</td>
        <td style="width: 5%;">&nbsp;</td>
        <td colspan="3" style="width: 24%; border: 1px solid #000;  text-align: center;">${solicitud.hora}</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">DURACION PERMISO</td>
        <td colspan="3" style="width: 23%; border: 1px solid #000;  text-align: center;">${solicitud.duracion} ${solicitud.duracion == 1 ? 'hora' : 'horas'}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;"><strong><u>TIPO DE PERMISO</u></strong></td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 7%;">&nbsp;</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">CALAMIDAD DOMESTICA</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${tipoId == 1 ? 'X' : ''}</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">CONSULTA MEDICA</td>
        <td style="width: 8%; border: 1px solid #000;">&nbsp;</td>
        <td style="width: 8%;  text-align: center;">${tipoId == 2 ? 'X' : ''}</td>
        <td style="width: 7%;">&nbsp;</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">LICENCIA NO REMUNERADA</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%; border: 1px solid #000;  text-align: center;">${tipoId == 3 ? 'X' : ''}</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">ASUNTO PERSONAL</td>
        <td style="width: 8%; border: 1px solid #000;">&nbsp;</td>
        <td style="width: 8%;  text-align: center;">${tipoId == 4 ? 'X' : ''}</td>
        <td style="width: 7%;">&nbsp;</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">LICENCIA REMUNERADA</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 8%; border: 1px solid #000; text-align: center;">${tipoId == 5 ? 'X' : ''}</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 8%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 21%;">ASUNTOS LABORALES</td>
        <td style="width: 8%; border: 1px solid #000;">&nbsp;</td>
        <td style="width: 8%;  text-align: center;">${tipoId == 6 ? 'X' : ''}</td>
        <td style="width: 7%;">&nbsp;</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">SOPORTES PRESENTADOS</td>
        <td style="width: 5%;"></td>
        <td colspan="8" rowspan="2" style="width: 73%; border: 1px solid #000; text-align: center;">${(solicitud.adjuntos && solicitud.adjuntos.length > 0) ? 'Sí' : 'No'}</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr>
        <td style="width: 21%;">&nbsp;</td>
        <td style="width: 5%;">&nbsp;</td>
        <td style="width: 1%;"></td>
    </tr>
    <tr style="height: 1px; width: 100%;">
        <td style="width: 21%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 21%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 8%;"></td>
        <td style="width: 7%;"></td>
        <td style="width: 1%;"></td>
    </tr>
    </tbody>
</table>
<table style="height: 5px; width: 100%;" border="1">
    <tbody>
    <tr>
        <td style="text-align: center;"><strong>OBSERVACIONES TRABAJADOR</strong></td>
    </tr>
    </tbody>
</table>
<table style="width: 100%;">
    <tbody>
    <tr>
        <td style="height: 97px; width: 100%; border: 1px solid #000;">${solicitud.observaciones}</td>
    </tr>
    </tbody>
</table>
<table style="height: 5px; width: 100%;" border="1">
    <tbody>
    <tr>
        <td style="text-align: center;"><strong>OBSERVACIONES JEFE INMEDIATO</strong></td>
    </tr>
    </tbody>
</table>
<table style="width: 100%;">
    <tbody>
    <tr>
        <td style="height: 97px; width: 100%; border: 1px solid #000;">${solicitud.motivo}</td>
    </tr>
    </tbody>
</table>
<table style="height: 97px; border: 1px solid #000;" width="100%">
    <tbody>
    <tr style="height: 66px;">
        <td style="width: 50%; height: 66px;text-align: center;">
            ${firmaEmpleado ? `<img src="${firmaEmpleado}" style="max-width: 100%; max-height: 100%;">` : ''}
        </td>
        <td style="width: 50%; height: 66px;text-align: center;">
            ${firmaJefe ? `<img src="${firmaJefe}" style="max-width: 100%; max-height: 100%;">` : ''}
        </td>
    </tr>
    <tr style="height: 25.7344px;">
        <td style="width: 50%; height: 25.7344px;text-align: center;">Firma del Trabajador solicitante</td>
        <td style="width: 50%; height: 25.7344px;text-align: center;">Firma del jefe inmediato que autoriza</td>
    </tr>
    </tbody>
</table>
<table style="height: 40px; border: 1px solid #000;" width="100%">
    <tbody>
    <tr style="height: 40px;">
        <td style="width: 100%; height: 40px;"><strong>Nota:</strong> con el presente formato debe ir adjunto los soportes que garantizan el cubrimiento de actividades asistenciales y administrativas como cronogramas de actividades pendientes por el trabajador.</td>
    </tr>
    </tbody>
</table>
</body>
</html>
`;

        // Crear directorio de PDFs si no existe
        const pdfDir = path.join(__dirname, '..', 'pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generar nombre único para el archivo
        const timestamp = new Date().getTime();
        const fileName = `permiso_${solicitud.id}_${timestamp}.pdf`;
        const filePath = path.join(pdfDir, fileName);

        // Generar PDF usando Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Obtener archivos adjuntos si existen
        let adjuntos = [];
        if (solicitud.adjuntos && solicitud.adjuntos.length > 0) {
            adjuntos = solicitud.adjuntos;
        } else {
            // Si no vienen en la solicitud, buscarlos en la base de datos
            adjuntos = await AdjuntoSolicitud.findAll({
                where: { solicitud_id: solicitud.id }
            });
        }
        
        console.log(`📎 Archivos adjuntos encontrados: ${adjuntos.length}`);
        
        // Si hay adjuntos, agregar páginas adicionales al HTML
        if (adjuntos.length > 0) {
            console.log('📄 Agregando páginas adicionales con archivos adjuntos...');
            
            // Agregar separador de páginas
            htmlContent += `
            <div style="page-break-before: always;"></div>
            <div style="text-align: center; margin: 40px 0;">
                <h2 style="color: #2E7D32; font-size: 24px; margin-bottom: 20px;">📎 ARCHIVOS ADJUNTOS</h2>
                <p style="color: #666; font-size: 16px;">Documentos de soporte presentados con la solicitud</p>
            </div>
            `;
            
            // Generar HTML para cada adjunto
            for (let i = 0; i < adjuntos.length; i++) {
                const adjunto = adjuntos[i];
                const adjuntoPath = path.join(__dirname, '..', adjunto.ruta_archivo);
                
                console.log(`📎 Procesando adjunto ${i + 1}/${adjuntos.length}: ${adjunto.nombre_archivo}`);
                
                if (fs.existsSync(adjuntoPath)) {
                    try {
                        // Leer el archivo y convertir a base64
                        const fileBuffer = fs.readFileSync(adjuntoPath);
                        const base64File = fileBuffer.toString('base64');
                        
                        // Determinar el tipo MIME
                        const mimeType = adjunto.tipo_mime || 'application/octet-stream';
                        
                        // Agregar separador de página para cada adjunto
                        htmlContent += `
                        <div style="page-break-before: always;"></div>
                        <div style="padding: 40px 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="color: #2E7D32; font-size: 24px; margin-bottom: 10px;">📎 Archivo Adjunto ${i + 1}</h2>
                                <p style="color: #666; font-size: 16px;">${adjunto.nombre_archivo}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <h3 style="color: #2E7D32; margin-bottom: 15px;">📋 Información del Archivo</h3>
                                <p><strong>Nombre:</strong> ${adjunto.nombre_archivo}</p>
                                <p><strong>Tipo:</strong> ${mimeType}</p>
                                <p><strong>Tamaño:</strong> ${(adjunto.tamaño / 1024).toFixed(2)} KB</p>
                            </div>
                            
                            <div style="text-align: center;">
                                <h3 style="color: #2E7D32; margin-bottom: 20px;">📄 Contenido del Archivo</h3>
                        `;
                        
                        // Agregar el contenido según el tipo de archivo
                        if (mimeType.startsWith('image/')) {
                            htmlContent += `
                                <img src="data:${mimeType};base64,${base64File}" alt="${adjunto.nombre_archivo}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
                            `;
                        } else if (mimeType === 'application/pdf') {
                            htmlContent += `
                                <embed src="data:${mimeType};base64,${base64File}" type="${mimeType}" style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px;">
                            `;
                        } else {
                            htmlContent += `
                                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h4 style="color: #856404; margin-bottom: 10px;">📄 Archivo: ${adjunto.nombre_archivo}</h4>
                                    <p style="color: #856404; margin-bottom: 10px;">⚠️ Este tipo de archivo no se puede mostrar directamente en el PDF.</p>
                                    <p style="color: #856404;">El archivo original está disponible en el sistema.</p>
                                </div>
                            `;
                        }
                        
                        htmlContent += `
                            </div>
                        </div>
                        `;
                        
                        console.log(`✅ Adjunto ${i + 1} procesado: ${adjunto.nombre_archivo}`);
                        
                    } catch (error) {
                        console.error(`❌ Error procesando adjunto ${adjunto.nombre_archivo}:`, error.message);
                        
                        // Agregar página de error para este adjunto
                        htmlContent += `
                        <div style="page-break-before: always;"></div>
                        <div style="padding: 40px 30px; text-align: center;">
                            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                                <h3 style="color: #721c24; margin-bottom: 15px;">❌ Error al procesar archivo</h3>
                                <p style="color: #721c24;"><strong>Archivo:</strong> ${adjunto.nombre_archivo}</p>
                                <p style="color: #721c24;"><strong>Error:</strong> ${error.message}</p>
                            </div>
                        </div>
                        `;
                    }
                } else {
                    console.log(`⚠️ Archivo no encontrado: ${adjuntoPath}`);
                    
                    // Agregar página de archivo no encontrado
                    htmlContent += `
                    <div style="page-break-before: always;"></div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px;">
                            <h3 style="color: #856404; margin-bottom: 15px;">⚠️ Archivo no encontrado</h3>
                            <p style="color: #856404;"><strong>Archivo:</strong> ${adjunto.nombre_archivo}</p>
                            <p style="color: #856404;">El archivo no se encuentra en el sistema.</p>
                        </div>
                    </div>
                    `;
                }
            }
        }
        
        await page.pdf({
            path: filePath,
            format: 'A4',
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            printBackground: true
        });

        await browser.close();

        console.log('✅ PDF generado exitosamente');
        console.log(`📁 Archivo: ${fileName}`);
        console.log(`📍 Ruta: ${filePath}`);
        console.log(`📊 Firmas incluidas: Empleado=${firmaEmpleado ? 'Sí' : 'No'}, Jefe=${firmaJefe ? 'Sí' : 'No'}`);

        return {
            fileName,
            filePath,
            relativePath: `pdfs/${fileName}`
        };

    } catch (error) {
        console.error('Error generando PDF:', error);
        throw error;
    }
};

const generarPDFVacaciones = async (solicitud, empleado, jefe, gerenteAdministracion = null, gerenteRRHH = null) => {
    try {
        // Función para encontrar la firma de un empleado y convertirla a base64
        function encontrarFirma(documento) {
            if (!documento) {
                console.log('⚠️ Documento vacío para buscar firma');
                return null;
            }
            
            const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
            const firmasDir = path.join(__dirname, '..', 'firmas');
            
            console.log(`🔍 Buscando firma para documento: ${documento}`);
            console.log(`📁 Directorio de firmas: ${firmasDir}`);
            
            for (const ext of extensions) {
                const firmaPath = path.join(firmasDir, `${documento}${ext}`);
                console.log(`  Probando: ${firmaPath}`);
                
                if (fs.existsSync(firmaPath)) {
                    try {
                        // Leer la imagen y convertirla a base64
                        const imageBuffer = fs.readFileSync(firmaPath);
                        const base64Image = imageBuffer.toString('base64');
                        const mimeType = ext === '.png' ? 'image/png' : 
                                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                                        ext === '.gif' ? 'image/gif' : 'image/png';
                        
                        const result = `data:${mimeType};base64,${base64Image}`;
                        console.log(`✅ Firma encontrada y convertida a base64: ${documento}${ext}`);
                        return result;
                    } catch (error) {
                        console.error(`❌ Error leyendo imagen ${firmaPath}:`, error.message);
                        return null;
                    }
                }
            }
            
            console.log(`❌ No se encontró firma para documento: ${documento}`);
            return null;
        }

        function fechaEnCasillas(fechaStr) {
            if (!fechaStr) return ['', '', ''];
            try {
                console.log('🔍 Procesando fecha:', fechaStr);
                
                // Si la fecha viene en formato YYYY-MM-DD, procesarla directamente
                if (typeof fechaStr === 'string' && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = fechaStr.split('-');
                    console.log('📅 Fecha procesada directamente:', { day, month, year });
                    return [day, month, year];
                }
                
                // Para otros formatos, usar Date pero ajustar zona horaria
                const d = new Date(fechaStr);
                
                // Verificar si la fecha es válida
                if (isNaN(d.getTime())) {
                    console.log('⚠️ Fecha inválida:', fechaStr);
                    return ['', '', ''];
                }
                
                // Ajustar para zona horaria local
                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                const dd = String(localDate.getDate()).padStart(2, '0');
                const mm = String(localDate.getMonth() + 1).padStart(2, '0');
                const yyyy = localDate.getFullYear().toString();
                
                console.log('📅 Fecha procesada con ajuste de zona horaria:', { dd, mm, yyyy });
                return [dd, mm, yyyy];
            } catch (error) {
                console.log('⚠️ Error procesando fecha:', fechaStr, error.message);
                return ['', '', ''];
            }
        }

        // Función para cargar el logo y convertirlo a base64
        function cargarLogo() {
            const logoPath = path.join(__dirname, '..', 'logo_empresa.png');
            console.log(`🔍 Buscando logo en: ${logoPath}`);
            
            if (fs.existsSync(logoPath)) {
                try {
                    const imageBuffer = fs.readFileSync(logoPath);
                    const base64Image = imageBuffer.toString('base64');
                    const result = `data:image/png;base64,${base64Image}`;
                    console.log(`✅ Logo encontrado y convertido a base64 (${imageBuffer.length} bytes)`);
                    return result;
                } catch (error) {
                    console.error(`❌ Error leyendo logo ${logoPath}:`, error.message);
                    return null;
                }
            } else {
                console.log(`❌ Logo no encontrado en: ${logoPath}`);
                return null;
            }
        }

        // Buscar firmas y logo antes de generar el HTML
        console.log('\n📋 Buscando firmas y logo para el PDF de vacaciones...');
        const firmaEmpleado = encontrarFirma(empleado.documento);
        const firmaJefe = jefe ? encontrarFirma(jefe.documento) : null;
        const firmaAdmin = gerenteAdministracion ? encontrarFirma(gerenteAdministracion.documento) : null;
        const firmaRRHH = gerenteRRHH ? encontrarFirma(gerenteRRHH.documento) : null;
        const logoBase64 = cargarLogo();
        
        console.log('📋 Resultados de búsqueda:');
        console.log(`  Empleado (${empleado.documento}): ${firmaEmpleado ? '✅ Encontrada' : '❌ No encontrada'}`);
        console.log(`  Jefe/Depto Empleado: ${jefe ? (firmaJefe ? '✅' : '❌') : 'N/A'}`);
        console.log(`  Administración: ${gerenteAdministracion ? (firmaAdmin ? '✅' : '❌') : 'N/A'}`);
        console.log(`  RRHH: ${gerenteRRHH ? (firmaRRHH ? '✅' : '❌') : 'N/A'}`);

        // Procesar fechas
        const [sol_dd, sol_mm, sol_yyyy] = fechaEnCasillas(solicitud.fecha_solicitud);
        const [cumplido_desde_dd, cumplido_desde_mm, cumplido_desde_yyyy] = fechaEnCasillas(solicitud.periodo_cumplido_desde);
        const [cumplido_hasta_dd, cumplido_hasta_mm, cumplido_hasta_yyyy] = fechaEnCasillas(solicitud.periodo_cumplido_hasta);
        const [disfrute_desde_dd, disfrute_desde_mm, disfrute_desde_yyyy] = fechaEnCasillas(solicitud.periodo_disfrute_desde);
        const [disfrute_hasta_dd, disfrute_hasta_mm, disfrute_hasta_yyyy] = fechaEnCasillas(solicitud.periodo_disfrute_hasta);

        // Leer la plantilla HTML
        const templatePath = path.join(__dirname, 'UCIA-TH-FT-005-FORMATO-DE-SOLICITUD-Y-AUTORIZACIÓN-DE-VACACIONES.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Inyectar CSS para forzar ancho y ocultar columnas derechas vacías (11-13)
        htmlContent = htmlContent.replace('</head>', `
          <style>
            table.sheet0 { width: 100% !important; table-layout: fixed !important; }
            .column11, .column12, .column13 { display: none !important; }
          </style>
        </head>`);

        // Eliminar completamente celdas de columnas 11, 12 y 13 que vienen vacías
        htmlContent = htmlContent
          .replace(/<td[^>]*class="[^"]*column1[1-3][^\"]*"[\s\S]*?<\/td>/gi, '')
          .replace(/<th[^>]*class="[^"]*column1[1-3][^\"]*"[\s\S]*?<\/th>/gi, '');

        // Normalización de la plantilla: eliminar anchos fijos y centrados que impiden ocupar 100%
        htmlContent = htmlContent
            // Quitar atributos width en tablas/contenedores
            .replace(/(<table[^>]*?)\swidth=\"\d+(?:px)?\"/gi, '$1')
            .replace(/(<div[^>]*?)\swidth=\"\d+(?:px)?\"/gi, '$1')
            // Convertir estilos width en px a 100%
            .replace(/width:\s*\d+px/gi, 'width:100%')
            // Quitar max-width fijos
            .replace(/max-width:\s*\d+px/gi, 'max-width:none')
            // Evitar centrado por align=\"center\"
            .replace(/align=\"center\"/gi, '')
            // Reemplazar margin: 0 auto por 0
            .replace(/margin:\s*0\s*auto/gi, 'margin:0')
            // Eliminar etiquetas <col> que fijan anchos de columnas
            .replace(/<col[^>]*>/gi, '');

        // NOTA: Usamos el HTML tal cual está, pero reemplazamos campos específicos
        console.log('📄 HTML original cargado');
        console.log(`📏 Tamaño del HTML: ${htmlContent.length} caracteres`);
        console.log('🎨 Estilos CSS preservados al 100%');
        
        // Reemplazar campos específicos con información real
        htmlContent = htmlContent
            // Información básica
            .replace(/<td class="column2 style44 null style58" colspan="5"><\/td>/g, 
                `<td class="column2 style44 null style58" colspan="5">${solicitud.ciudad_departamento || ''}</td>`)
            .replace(/<td class="column10 style6 null"><\/td>/g, 
                `<td class="column10 style6 null">${sol_dd}/${sol_mm}/${sol_yyyy}</td>`)
            
            // Información del empleado
            .replace(/<td class="column3 style37 null style37" colspan="8"><\/td>/g, 
                `<td class="column3 style37 null style37" colspan="8">${solicitud.nombres_colaborador || ''}</td>`)
            .replace(/<td class="column3 style55 null style57" colspan="4"><\/td>/g, 
                `<td class="column3 style55 null style57" colspan="4">${solicitud.cedula_colaborador || ''}</td>`)
            .replace(/<td class="column10 style7 null"><\/td>/g, 
                `<td class="column10 style7 null">${solicitud.cargo_colaborador || ''}</td>`)
            
            // Período cumplido
            .replace(/<td class="column3 style38 null style14" colspan="3" rowspan="2"><\/td>/g, 
                `<td class="column3 style38 null style14" colspan="3" rowspan="2">${cumplido_desde_dd} / ${cumplido_desde_mm} / ${cumplido_desde_yyyy}</td>`)
            .replace(/<td class="column6 style38 null style14" colspan="3" rowspan="2"><\/td>/g, 
                `<td class="column6 style38 null style14" colspan="3" rowspan="2">${cumplido_hasta_dd} / ${cumplido_hasta_mm} / ${cumplido_hasta_yyyy}</td>`)
            .replace(/<td class="column10 style40 s style40" rowspan="4">Total días: ________<\/td>/g, 
                `<td class="column10 style40 s style40" rowspan="4">Total días: ${solicitud.dias_cumplidos || ''}</td>`)
            
            // Período de disfrute
            .replace(/<td class="column3 style38 null style14" colspan="3" rowspan="2"><\/td>/g, 
                `<td class="column3 style38 null style14" colspan="3" rowspan="2">${disfrute_desde_dd} / ${disfrute_desde_mm} / ${disfrute_desde_yyyy}</td>`)
            .replace(/<td class="column6 style38 null style34" colspan="3" rowspan="2"><\/td>/g, 
                `<td class="column6 style38 null style34" colspan="3" rowspan="2">${disfrute_hasta_dd} / ${disfrute_hasta_mm} / ${disfrute_hasta_yyyy}</td>`)
            .replace(/<td class="column10 style40 s style40" rowspan="2">Total días: _________<\/td>/g, 
                `<td class="column10 style40 s style40" rowspan="2">Total días: ${solicitud.dias_disfrute || ''}</td>`)
            
            // Días con pago en efectivo
            .replace(/<td class="column10 style18 s style18" rowspan="3">Aplica:____ N\/A:____                                  Total días:______<\/td>/g, 
                `<td class="column10 style18 s style18" rowspan="3">Aplica: ${solicitud.dias_pago_efectivo_aplica ? 'X' : '_'} N/A: ${solicitud.dias_pago_efectivo_na ? 'X' : '_'} Total días: ${solicitud.dias_pago_efectivo_total || 0}</td>`)
            
            // Fecha de reintegro
            .replace(/<td class="column3 style17 null style17" colspan="6"><\/td>/g, 
                `<td class="column3 style17 null style17" colspan="6">${solicitud.periodo_disfrute_hasta || ''}</td>`)
            
            // Actividades pendientes
            .replace(/<td class="column0 style33 s style33" colspan="11" rowspan="10">ACTIVIDADES PENDIENTES DE SU CARGO A TENER ENCUENTA EN SU AUSENCIA:  NINGUNA<\/td>/g, 
                `<td class="column0 style33 s style33" colspan="11" rowspan="10">ACTIVIDADES PENDIENTES DE SU CARGO A TENER ENCUENTA EN SU AUSENCIA: ${solicitud.actividades_pendientes || 'NINGUNA'}</td>`)
            
            // Reemplazo
            .replace(/<td class="column0 style33 s style33" colspan="5">NOMBRES Y APELLIDOS DEL REEMPLAZO<\/td>/g, 
                `<td class="column0 style33 s style33" colspan="5">${solicitud.reemplazo_nombre || 'NOMBRES Y APELLIDOS DEL REEMPLAZO'}</td>`)
            .replace(/<td class="column5 style34 s style35" colspan="6">NO HAY REEMPLAZO<\/td>/g, 
                `<td class="column5 style34 s style35" colspan="6">${solicitud.reemplazo_no_hay ? 'NO HAY REEMPLAZO' : ''}</td>`)
            
            // Nuevo personal
            .replace(/<td class="column5 style15 s style15" colspan="6">SI:_____________  NO:_____________ N\/A:_____________<\/td>/g, 
                `<td class="column5 style15 s style15" colspan="6">SI: ${solicitud.reemplazo_nuevo_personal === 'si' ? 'X' : '_'} NO: ${solicitud.reemplazo_nuevo_personal === 'no' ? 'X' : '_'} N/A: ${solicitud.reemplazo_nuevo_personal === 'na' ? 'X' : '_'}</td>`)
            
            // Firmas y nombres
            .replace(/<td class="column0 style28 s style30" colspan="7">NOMBRE DEL SOLICITANTE:<\/td>/g, 
                `<td class="column0 style28 s style30" colspan="7">NOMBRE DEL SOLICITANTE: ${solicitud.solicitante_nombre || ''}</td>`)
            .replace(/<td class="column7 style28 s style30" colspan="4">NOMBRE DEL JEFE INMEDIATO:<\/td>/g, 
                `<td class="column7 style28 s style30" colspan="4">NOMBRE DEL JEFE INMEDIATO: ${solicitud.jefe_nombre || ''}</td>`)
            .replace(/<td class="column0 style19 s style21" colspan="7">CARGO: <\/td>/g, 
                `<td class="column0 style19 s style21" colspan="7">CARGO: ${solicitud.solicitante_cargo || ''}</td>`)
            .replace(/<td class="column7 style19 s style21" colspan="4">CARGO: <\/td>/g, 
                `<td class="column7 style19 s style21" colspan="4">CARGO: ${solicitud.jefe_cargo || ''}</td>`);

        console.log('📝 Campos del formulario llenados con información real');

        // Agregar firmas si están disponibles
        if (firmaEmpleado || firmaJefe) {
            // Buscar las celdas de firma y agregar las imágenes
            const firmaEmpleadoHTML = firmaEmpleado ? `<img src="${firmaEmpleado}" style="max-width: 100%; max-height: 80px;">` : '';
            const firmaJefeHTML = firmaJefe ? `<img src="${firmaJefe}" style="max-width: 100%; max-height: 80px;">` : '';
            
            // Reemplazar las celdas de firma
            htmlContent = htmlContent
                .replace(/<td class="column0 style22 s style27" colspan="7" rowspan="2">FIRMA<\/td>/g, 
                    `<td class="column0 style22 s style27" colspan="7" rowspan="2">FIRMA<br>${firmaEmpleadoHTML}</td>`)
                .replace(/<td class="column7 style22 s style27" colspan="4" rowspan="2">FIRMA<\/td>/g, 
                    `<td class="column7 style22 s style27" colspan="4" rowspan="2">FIRMA<br>${firmaJefeHTML}</td>`);
        }

        // Construcción del HTML (inyectamos un bloque de firmas abajo si no existía)
        // Para mantener cambios mínimos, añadimos un bloque estándar de firmas al final
        const firmasHTML = `
          <div style="margin-top: 24px;">
            <table style="width:100%; border-collapse: collapse; table-layout: fixed;" border="1">
              <colgroup>
                <col style="width:20%">
                <col style="width:20%">
                <col style="width:20%">
                <col style="width:40%">
              </colgroup>
              <tr>
                <td style="text-align:center; padding:8px;">
                  <div><strong>Empleado</strong></div>
                  <div style="height:80px; display:flex; align-items:center; justify-content:center;">
                    ${firmaEmpleado ? `<img src="${firmaEmpleado}" style="max-height:80px;">` : '<div style="color:#999;">Sin firma</div>'}
                  </div>
                  <div style="font-size:10px;">${empleado.nombres || ''}</div>
                </td>
                <td style="text-align:center; padding:8px;">
                  <div><strong>Jefe/Depto Empleado</strong></div>
                  <div style="height:80px; display:flex; align-items:center; justify-content:center;">
                    ${firmaJefe ? `<img src="${firmaJefe}" style="max-height:80px;">` : '<div style="color:#999;">Sin firma</div>'}
                  </div>
                  <div style="font-size:10px;">${jefe?.nombres || ''}</div>
                </td>
                <td style="text-align:center; padding:8px;">
                  <div><strong>Administración</strong></div>
                  <div style="height:80px; display:flex; align-items:center; justify-content:center;">
                    ${firmaAdmin ? `<img src="${firmaAdmin}" style="max-height:80px;">` : '<div style="color:#999;">Sin firma</div>'}
                  </div>
                  <div style="font-size:10px;">${gerenteAdministracion?.nombres || ''}</div>
                </td>
                <td style="text-align:center; padding:8px;">
                  <div><strong>RRHH</strong></div>
                  <div style="height:80px; display:flex; align-items:center; justify-content:center;">
                    ${firmaRRHH ? `<img src="${firmaRRHH}" style="max-height:80px;">` : '<div style="color:#999;">Sin firma</div>'}
                  </div>
                  <div style="font-size:10px;">${gerenteRRHH?.nombres || ''}</div>
                </td>
              </tr>
            </table>
          </div>
        `;

        // Generación del HTML completo combinando el existente con firmasHTML
        // Buscamos un lugar razonable para inyectar firmas; si no, las agregamos al final del body
        let html = htmlContent || '';
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${firmasHTML}\n</body>`);
        } else {
            html = `${html}${firmasHTML}`;
        }

        // Crear directorio de PDFs si no existe
        const pdfDir = path.join(__dirname, '..', 'pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generar nombre único para el archivo
        const timestamp = new Date().getTime();
        const fileName = `vacaciones_${solicitud.id}_${timestamp}.pdf`;
        const filePath = path.join(pdfDir, fileName);

        // Generar PDF usando Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Configurar viewport para mejor renderizado y ancho completo en vertical
        await page.setViewport({
            width: 794, // ~A4 width at 96 DPI
            height: 1123, // ~A4 height at 96 DPI
            deviceScaleFactor: 2
        });
        
        // Establecer el contenido HTML
        await page.setContent(html, { 
            waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
            timeout: 30000
        });
        
        // Esperar a que los estilos se procesen completamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Modificar estilos CSS para ocupar todo el ancho
        await page.evaluate(() => {
            // Agregar estilos CSS para ancho completo
            const style = document.createElement('style');
            style.textContent = `
                @page {
                    margin: 0 !important;
                    size: A4 portrait !important;
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    overflow: hidden !important;
                }
                * {
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    box-sizing: border-box !important;
                }
                body {
                    width: 100% !important;
                    max-width: none !important;
                }
                table {
                    width: 100% !important;
                    max-width: none !important;
                    table-layout: fixed !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border-spacing: 0 !important;
                }
                .sheet0 {
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .col0, .col1, .col2, .col3, .col4, .col5, .col6, .col7, .col8, .col9, .col10, .col11, .col12, .col13 {
                    width: auto !important;
                    max-width: none !important;
                    min-width: 0 !important;
                }
                /* Forzar ancho completo en todas las celdas */
                td, th {
                    width: auto !important;
                    max-width: none !important;
                    min-width: 0 !important;
                }
                /* Anular reglas de la plantilla que fijan anchos por columna */
                td:nth-child(2) { width: auto !important; }
                td:nth-child(1), td:nth-child(3) { width: auto !important; }
                /* Evitar centrado global en div que estrecha el contenido */
                div { text-align: left !important; }
                /* Asegurar imágenes responsivas dentro de celdas */
                td img { max-width: 100% !important; height: auto !important; }
            `;
            document.head.appendChild(style);
        });
        
        console.log('🎨 Estilos CSS modificados para ancho completo forzado en VERTICAL');
        
        // Verificar que los estilos se hayan aplicado
        const stylesApplied = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (table) {
                const computedStyle = window.getComputedStyle(table);
                return {
                    hasBorders: computedStyle.border !== 'none',
                    hasFont: computedStyle.fontFamily !== '',
                    hasBackground: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
                    width: computedStyle.width,
                    maxWidth: computedStyle.maxWidth
                };
            }
            return false;
        });
        
        console.log('🎨 Verificación de estilos:', stylesApplied);
        
        // Ajuste final: escalar la tabla principal para ocupar el 100% exacto del viewport
        await page.evaluate(() => {
            const vw = window.innerWidth;
            let widest = null;
            let maxW = 0;
            document.querySelectorAll('table').forEach(tb => {
                const w = tb.getBoundingClientRect().width;
                if (w > maxW) { maxW = w; widest = tb; }
            });
            if (widest) {
                widest.style.borderCollapse = 'collapse';
                const current = widest.getBoundingClientRect().width;
                if (current > 0 && Math.abs(current - vw) > 0.5) {
                    const factor = vw / current;
                    widest.style.transformOrigin = 'top left';
                    widest.style.transform = `scale(${factor})`;
                    widest.style.width = `${current * factor}px`;
                } else {
                    widest.style.width = '100%';
                    widest.style.transform = 'none';
                }
            }
        });
        
        // Normalizar el DOM para eliminar anchos fijos que provocan espacio en blanco
        await page.evaluate(() => {
            // Remover width fijo en elementos <col>
            document.querySelectorAll('col').forEach(col => {
                col.removeAttribute('width');
                if (col.style) {
                    col.style.width = 'auto';
                    col.style.maxWidth = 'none';
                }
            });
            // Forzar todas las tablas a ocupar 100%
            document.querySelectorAll('table').forEach(tb => {
                tb.style.width = '100%';
                tb.style.maxWidth = 'none';
                tb.style.margin = '0';
                tb.style.borderSpacing = '0';
            });
            // Ajustar body/html
            document.documentElement.style.width = '100%';
            document.documentElement.style.maxWidth = 'none';
            document.body.style.width = '100%';
            document.body.style.maxWidth = 'none';
            document.body.style.margin = '0';
            // Quitar width en px en celdas
            document.querySelectorAll('td, th').forEach(cell => {
                if (cell.style && /px$/.test(cell.style.width || '')) {
                    cell.style.width = 'auto';
                    cell.style.maxWidth = 'none';
                }
            });
        });

        // Normalización adicional: eliminar atributos width y estilos en px de tablas y contenedores
        await page.evaluate(() => {
            const vw = window.innerWidth;
            // Ensanchar elementos contenedores grandes que casi ocupan toda la página
            document.querySelectorAll('div, table, section, main').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > vw * 0.8 && rect.width < vw - 1) {
                    el.style.width = '100%';
                    el.style.maxWidth = 'none';
                    el.style.marginLeft = '0';
                    el.style.marginRight = '0';
                }
                const cs = window.getComputedStyle(el);
                if (cs.marginLeft === 'auto' || cs.marginRight === 'auto') {
                    el.style.marginLeft = '0';
                    el.style.marginRight = '0';
                }
            });
            // Quitar atributo width de todos los elementos
            document.querySelectorAll('[width]').forEach(el => {
                el.removeAttribute('width');
            });

            // Forzar contenedores principales
            const containers = [document.documentElement, document.body, document.querySelector('.sheet0'), document.querySelector('#page_1')].filter(Boolean);
            containers.forEach(el => {
                el.style.width = '100%';
                el.style.maxWidth = 'none';
                el.style.margin = '0';
                el.style.padding = '0';
            });

            // Asegurar tablas 100%
            document.querySelectorAll('table').forEach(tb => {
                tb.style.width = '100%';
                tb.style.maxWidth = 'none';
                tb.style.margin = '0';
                tb.style.borderSpacing = '0';
                if (tb.style && /px$/.test(tb.style.width || '')) {
                    tb.style.width = '100%';
                }
            });

            // Celdas sin width fijo
            document.querySelectorAll('td, th').forEach(cell => {
                if (cell.style && /px$/.test(cell.style.width || '')) {
                    cell.style.width = 'auto';
                    cell.style.maxWidth = 'none';
                }
            });
        });
        
        await page.pdf({
            path: filePath,
            width: '210mm',
            height: '297mm',
            landscape: false,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            },
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false
        });

        await browser.close();

        console.log('✅ PDF de vacaciones generado exitosamente');
        console.log(`📁 Archivo: ${fileName}`);
        console.log(`📍 Ruta: ${filePath}`);
        console.log(`📊 Firmas incluidas: Empleado=${firmaEmpleado ? 'Sí' : 'No'}, Jefe=${firmaJefe ? 'Sí' : 'No'}`);

        return {
            fileName,
            filePath,
            relativePath: `pdfs/${fileName}`
        };

    } catch (error) {
        console.error('Error generando PDF de vacaciones:', error);
        throw error;
    }
};

module.exports = {
    generarPDFPermiso,
    generarPDFVacaciones
}; 