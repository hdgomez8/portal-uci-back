const { Empleado, Usuario } = require('../../models');
const Solicitud = require('../../models/Solicitudes/Solicitud');
const TipoSolicitud = require('../../models/Solicitudes/TipoSolicitud');
const AdjuntoSolicitud = require('../../models/Solicitudes/AdjuntoSolicitud');
const db = require('../../config/database'); // Importa la instancia de Sequelize
const { sendMail } = require('../../utils/mailer');
const Area = require('../../models/EstructuraEmpresa/Area');
const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
const { obtenerEmailNotificacion } = require('../empleadoController');

// Función para procesar fechas correctamente
const procesarFecha = (fechaString) => {
    if (!fechaString) return null;
    
    try {
        console.log("🔍 procesarFecha - Fecha recibida:", fechaString);
        
        // Si la fecha viene en formato YYYY-MM-DD, procesarla directamente
        if (typeof fechaString === 'string' && fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log("✅ Fecha en formato YYYY-MM-DD, usando directamente:", fechaString);
            return fechaString;
        }
        
        // Para otros formatos, crear fecha en zona horaria local
        const fecha = new Date(fechaString);
        
        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            console.log('⚠️ Fecha inválida:', fechaString);
            return null;
        }
        
        // IMPORTANTE: Para fechas que vienen del frontend en formato YYYY-MM-DD,
        // no aplicar ajuste de zona horaria ya que ya están en fecha local
        let localDate;
        if (typeof fechaString === 'string' && fechaString.includes('T')) {
            // Si tiene 'T', es una fecha con tiempo, aplicar ajuste
            localDate = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
            console.log("📅 Fecha con tiempo detectada, aplicando ajuste de zona horaria");
        } else {
            // Si no tiene 'T', es solo fecha, usar directamente
            localDate = fecha;
            console.log("📅 Fecha sin tiempo detectada, usando directamente");
        }
        
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        
        const resultado = `${year}-${month}-${day}`;
        console.log("📅 Fecha procesada:", resultado);
        return resultado;
    } catch (error) {
        console.log('⚠️ Error procesando fecha:', fechaString, error.message);
        return null;
    }
};

// Obtener todas las solicitudes con relaciones, incluyendo los adjuntos
const obtenerSolicitudes = async (req, res) => {
    try {
        const solicitudes = await Solicitud.findAll({
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres', 'oficio'] // Solo traer ciertos campos del empleado
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre'] // Solo traer el nombre del tipo de solicitud
                },
                {
                    model: AdjuntoSolicitud,
                    as: 'adjuntos',
                    attributes: ['ruta_archivo', 'nombre_archivo', 'tipo_mime', 'tamaño'] // Traer datos de los archivos adjuntos
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener solicitudes',
            error: error.message
        });
    }
};


// Crear nueva solicitud con adjuntos
const crearSolicitud = async (req, res) => {
    const t = await db.transaction(); // Iniciar transacción
    try {
        console.log("🔍 DEBUG - Datos recibidos en la solicitud:");
        console.log("  - req.body completo:", req.body);
        console.log("  - fecha_permiso:", req.body.fecha_permiso);
        console.log("  - fecha:", req.body.fecha);
        console.log("  - Tipo de fecha_permiso:", typeof req.body.fecha_permiso);
        console.log("  - Tipo de fecha:", typeof req.body.fecha);
        
        if (req.body.fecha_permiso) {
            console.log("  - fecha_permiso como Date:", new Date(req.body.fecha_permiso));
            console.log("  - fecha_permiso ISO:", new Date(req.body.fecha_permiso).toISOString());
            console.log("  - fecha_permiso local:", new Date(req.body.fecha_permiso).toLocaleDateString());
        }
        
        console.log("Archivos adjuntos recibidos:", req.files);

        const { empleado_id, tipo_solicitud_id, fecha, fecha_permiso, hora, duracion, observaciones } = req.body;

        // Verificar que el usuario no sea jefe de área (consulta optimizada)
        const empleadoVerificacion = await Empleado.findByPk(empleado_id, {
          attributes: ['id'],
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id'],
              include: [
                {
                  model: require('../../models/Rol'),
                  as: 'roles',
                  attributes: ['nombre'],
                  where: { nombre: 'JEFE AREA' }
                }
              ]
            }
          ]
        });

        if (empleadoVerificacion?.usuario?.roles?.length > 0) {
          console.log('❌ Jefe de área intentando crear solicitud de permiso - Acceso denegado');
          return res.status(403).json({
            message: 'Los jefes de área no pueden crear solicitudes de permisos desde la interfaz de gestión. Deben hacerlo desde su cuenta personal de empleado.'
          });
        }

        // Procesar fechas correctamente
        const fechaProcesada = procesarFecha(fecha_permiso || fecha);
        console.log("🔍 DEBUG - Procesamiento de fecha:");
        console.log("  - Fecha original:", fecha_permiso || fecha);
        console.log("  - Fecha procesada:", fechaProcesada);
        console.log("  - Tipo de fecha procesada:", typeof fechaProcesada);

        // Crear la solicitud en la base de datos
        const nuevaSolicitud = await Solicitud.create({
            empleado_id,
            tipo_solicitud_id,
            fecha: fechaProcesada, // Usar la fecha procesada
            hora,
            duracion,
            observaciones
        }, { transaction: t });

        console.log("✅ Solicitud creada con éxito:", nuevaSolicitud);
        console.log("  - Fecha guardada en BD:", nuevaSolicitud.fecha);

        // Guardar adjuntos si existen
        if (req.files && req.files.length > 0) {
            const adjuntos = req.files.map(file => ({
                solicitud_id: nuevaSolicitud.id,
                ruta_archivo: file.path,
                nombre_archivo: file.originalname,
                tipo_mime: file.mimetype,
                tamaño: file.size
            }));

            await AdjuntoSolicitud.bulkCreate(adjuntos, { transaction: t });
            console.log("Adjuntos guardados:", adjuntos);
        }

        // Confirmar transacción PRIMERO - antes de cualquier operación que pueda fallar
        await t.commit();
        console.log('✅ Transacción confirmada exitosamente');

        // Buscar el jefe del área del empleado DESPUÉS de confirmar la transacción
        const empleado = await Empleado.findByPk(empleado_id, {
          include: [{ association: 'areas', include: [{ association: 'jefe' }] }]
        });
        console.log('Empleado encontrado:', empleado ? empleado.nombres : null);
        console.log('Áreas del empleado:', empleado.areas);
        if (empleado.areas && empleado.areas.length > 0) {
          console.log('Jefe del área:', empleado.areas[0].jefe);
        }
        let jefe = null;
        if (empleado.areas && empleado.areas.length > 0) {
          jefe = empleado.areas[0].jefe;
        }

        // Responder al cliente INMEDIATAMENTE después de confirmar la transacción
        res.status(201).json({ mensaje: 'Solicitud creada con éxito', solicitud: nuevaSolicitud });

        // Enviar correo de forma ASÍNCRONA (no bloquea la respuesta)
        if (jefe) {
          setImmediate(async () => {
            try {
              console.log('📧 Iniciando envío de correo asíncrono...');
              // Obtener el email preferido para notificaciones del jefe
              const emailJefe = await obtenerEmailNotificacion(jefe.id);
              
              if (emailJefe) {
                // Importar las plantillas de correo
                const { getNuevaSolicitudTemplate } = require('../../utils/emailTemplates');
                
                // Generar el HTML del correo con la nueva plantilla
                const emailHTML = getNuevaSolicitudTemplate(empleado, jefe);
                
                await sendMail(
                  emailJefe,
                  'Nueva solicitud de su colaborador',
                  emailHTML
                );
                console.log('✅ Correo enviado exitosamente de forma asíncrona');
              } else {
                console.log('⚠️ No se encontró email para notificar al jefe:', jefe.nombres);
              }
            } catch (emailError) {
              console.error('❌ Error enviando correo asíncrono:', emailError);
              // No afecta la respuesta al cliente
            }
          });
        }

    } catch (error) {
        await t.rollback(); // Revertir cambios si hay error
        console.error("Error al crear la solicitud:", error);
        res.status(500).json({ error: 'Error al crear la solicitud', detalle: error.message });
    }
};


// Actualizar estado de solicitud (aprobado/rechazado)
const actualizarEstadoSolicitud = async (req, res) => {
    try {
        console.log('🔍 Iniciando actualización de estado de solicitud');
        const { id } = req.params;
        const { estado, visto_bueno_por, motivo } = req.body;
        
        console.log('📋 Datos recibidos:', { id, estado, visto_bueno_por, motivo });
        console.log('📋 Tipo de datos:', { 
            id: typeof id, 
            estado: typeof estado, 
            visto_bueno_por: typeof visto_bueno_por, 
            motivo: typeof motivo 
        });

        // Validar que los jefes de área no puedan dar visto bueno
        if (estado.toLowerCase() === 'visto_bueno') {
            // Obtener información del usuario que está intentando dar visto bueno
            const usuarioId = req.user?.id || visto_bueno_por;
            
            if (usuarioId) {
                const Usuario = require('../../models/Usuario');
                const Rol = require('../../models/Rol');
                
                const usuario = await Usuario.findByPk(usuarioId, {
                    include: [
                        {
                            model: Rol,
                            as: 'roles',
                            attributes: ['nombre']
                        }
                    ]
                });
                
                if (usuario) {
                    const esJefeArea = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA');
                    if (esJefeArea) {
                        console.log('❌ Jefe de área intentando dar visto bueno - Acceso denegado');
                        return res.status(403).json({ 
                            message: 'Los jefes de área no pueden dar visto bueno a las solicitudes' 
                        });
                    }
                }
            }
        }

        // Buscar la solicitud con información básica
        console.log('🔍 Buscando solicitud con ID:', id);
        const solicitud = await Solicitud.findByPk(id, {
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['id', 'nombres', 'documento', 'oficio']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud'
                }
            ]
        });

        if (!solicitud) {
            console.log('❌ Solicitud no encontrada');
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        
        console.log('✅ Solicitud encontrada:', solicitud.id);

        // Validar que el estado sea válido
        const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'visto_bueno'];
        if (!estadosValidos.includes(estado.toLowerCase())) {
            return res.status(400).json({ message: 'Estado no válido' });
        }

        const actualizacion = {
            estado: estado.toLowerCase(),
            motivo,
            fecha_visto_bueno: ['aprobado', 'rechazado', 'visto_bueno'].includes(estado.toLowerCase()) ? new Date() : null
        };

        console.log('📝 Actualizando solicitud con:', actualizacion);
        const solicitudActualizada = await solicitud.update(actualizacion);
        console.log('✅ Solicitud actualizada exitosamente');

        // Si el estado es aprobado, generar PDF
        if (estado.toLowerCase() === 'aprobado') {
            console.log('🔄 Estado aprobado detectado, iniciando proceso de PDF y correo...');
            try {
                const { generarPDFPermiso } = require('../../utils/pdfGenerator');
                
                // Buscar el jefe del área del empleado de forma más directa
                const empleadoArea = await EmpleadoArea.findOne({
                    where: { empleado_id: solicitud.empleado_id }
                });
                
                let jefe = null;
                if (empleadoArea) {
                    const area = await Area.findByPk(empleadoArea.area_id);
                    if (area && area.jefe_id) {
                        jefe = await Empleado.findByPk(area.jefe_id, {
                            attributes: ['id', 'nombres', 'documento', 'oficio']
                        });
                    }
                }
                
                if (jefe) {
                    console.log('✅ Jefe encontrado, procediendo con generación de PDF...');
                    
                    // Obtener el departamento del área del empleado
                    let departamentoEmpleado = 'Departamento no asignado';
                    if (empleadoArea) {
                        const area = await Area.findByPk(empleadoArea.area_id, {
                            include: [{
                                model: require('../../models/EstructuraEmpresa/Departamento'),
                                as: 'departamento',
                                attributes: ['nombre']
                            }]
                        });
                        if (area && area.departamento) {
                            departamentoEmpleado = area.departamento.nombre;
                        }
                    }
                    
                    // Construir el objeto empleado con las propiedades correctas
                    const empleadoData = {
                        nombres: solicitud.empleado.nombres || '',
                        apellidos: '', // No existe en el modelo, usar string vacío
                        cargo: solicitud.empleado.oficio || '',
                        area: departamentoEmpleado, // Usar el departamento del área del empleado
                        documento: solicitud.empleado.documento || '',
                        jefeNombres: jefe?.nombres || '',
                        jefeApellidos: '' // No existe en el modelo, usar string vacío
                    };
                    console.log('📋 Datos del empleado para PDF:', empleadoData);
                    console.log('📋 Datos del jefe:', {
                        id: jefe.id,
                        nombres: jefe.nombres,
                        documento: jefe.documento
                    });
                    const pdfInfo = await generarPDFPermiso(
                        solicitudActualizada, 
                        empleadoData, 
                        jefe
                    );
                    console.log('✅ PDF generado exitosamente:', pdfInfo);

                    // Guardar la ruta del PDF en la base de datos
                    await solicitudActualizada.update({
                        ruta_pdf: pdfInfo.relativePath
                    });
                    console.log('✅ PDF generado exitosamente, ruta guardada en BD:', pdfInfo.relativePath);

                    // Buscar el email del empleado
                    console.log('🔍 Buscando email del empleado...');
                    const usuarioEmpleado = await Usuario.findOne({
                        where: { empleado_id: solicitud.empleado_id }
                    });

                    console.log('📧 Usuario empleado encontrado:', {
                        id: usuarioEmpleado?.id,
                        email: usuarioEmpleado?.email,
                        empleado_id: usuarioEmpleado?.empleado_id
                    });

                                    if (usuarioEmpleado?.email) {
                    try {
                        console.log('Enviando correo a:', usuarioEmpleado.email);
                        console.log('Ruta del PDF:', pdfInfo.filePath);
                        
                        // Importar las plantillas de correo
                        const { getPermisoAprobadoTemplate } = require('../../utils/emailTemplates');
                        
                        // Generar el HTML del correo con la nueva plantilla
                        const emailHTML = getPermisoAprobadoTemplate(
                            solicitud.empleado,
                            solicitudActualizada,
                            jefe
                        );
                        
                        await sendMail(
                            usuarioEmpleado.email,
                            'Tu permiso ha sido APROBADO',
                            emailHTML,
                            pdfInfo.filePath
                        );
                        console.log('✅ Correo enviado exitosamente');
                    } catch (emailError) {
                        console.error('❌ Error enviando correo:', emailError);
                        console.error('❌ Detalles del error de correo:', {
                            email: usuarioEmpleado.email,
                            pdfPath: pdfInfo.filePath,
                            error: emailError.message
                        });
                    }
                } else {
                        console.log('⚠️ No se encontró email para el empleado:', solicitud.empleado_id);
                    }

                    res.json({
                        message: 'Solicitud aprobada y PDF generado',
                        data: solicitudActualizada,
                        pdf: pdfInfo
                    });
                } else {
                    res.json({
                        message: 'Solicitud aprobada pero no se pudo generar PDF (jefe no encontrado)',
                        data: solicitudActualizada
                    });
                }
            } catch (pdfError) {
                console.error('Error generando PDF:', pdfError);
                res.json({
                    message: 'Solicitud aprobada pero error generando PDF',
                    data: solicitudActualizada,
                    error: 'Error generando PDF'
                });
            }
        } else if (estado.toLowerCase() === 'rechazado') {
            // Buscar el email del empleado
            const usuarioEmpleado = await Usuario.findOne({
                where: { empleado_id: solicitud.empleado_id }
            });

            if (usuarioEmpleado?.email) {
                try {
                    console.log('Enviando correo de rechazo a:', usuarioEmpleado.email);
                    
                    // Importar las plantillas de correo
                    const { getPermisoRechazadoTemplate } = require('../../utils/emailTemplates');
                    
                    // Generar el HTML del correo con la nueva plantilla
                    const emailHTML = getPermisoRechazadoTemplate(
                        solicitud.empleado,
                        solicitud,
                        motivo
                    );
                    
                    await sendMail(
                        usuarioEmpleado.email,
                        'Tu permiso ha sido RECHAZADO',
                        emailHTML
                    );
                    console.log('✅ Correo de rechazo enviado exitosamente');
                } catch (emailError) {
                    console.error('❌ Error enviando correo de rechazo:', emailError);
                    console.error('❌ Detalles del error de correo:', {
                        email: usuarioEmpleado.email,
                        error: emailError.message
                    });
                }
            } else {
                console.log('⚠️ No se encontró email para el empleado:', solicitud.empleado_id);
            }

            res.json({
                message: 'Solicitud rechazada y notificación enviada',
                data: solicitudActualizada
            });
        } else {
            console.log('✅ Estado actualizado a:', estado);
            res.json({
                message: 'Estado de solicitud actualizado',
                data: solicitudActualizada
            });
        }
    } catch (error) {
        console.error('❌ Error actualizando estado de solicitud:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({
            message: 'Error al actualizar solicitud',
            error: error.message
        });
    }
};

// Eliminar solicitud
const eliminarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await Solicitud.destroy({ where: { id } });

        if (resultado === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        res.json({ message: 'Solicitud eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar solicitud',
            error: error.message
        });
    }
};

// Obtener solicitudes por empleado_id
const obtenerSolicitudesPorEmpleado = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        const solicitudes = await Solicitud.findAll({
            where: { empleado_id },
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres', 'oficio']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                },
                {
                    model: AdjuntoSolicitud,
                    as: 'adjuntos',
                    attributes: ['ruta_archivo', 'nombre_archivo', 'tipo_mime', 'tamaño']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        res.json(solicitudes);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener solicitudes por empleado',
            error: error.message
        });
    }
};

// Obtener solicitudes de empleados de un jefe específico
const obtenerSolicitudesPorJefe = async (req, res) => {
    try {
        const { jefe_id } = req.params;
        console.log('🔍 Buscando solicitudes para jefe_id:', jefe_id);
        
        // Buscar áreas donde el jefe_id es el jefe
        const areas = await Area.findAll({ where: { jefe_id } });
        const areaIds = areas.map(area => area.id);
        console.log('📋 Áreas encontradas para el jefe:', areas.map(a => ({ id: a.id, nombre: a.nombre })));
        console.log('📋 IDs de áreas:', areaIds);
        
        if (areaIds.length === 0) {
            console.log('❌ No hay áreas asignadas a este jefe');
            return res.json([]); // No hay áreas asignadas a este jefe
        }
        
        // Buscar empleados que pertenezcan a esas áreas
        const empleadosAreas = await EmpleadoArea.findAll({
            where: { area_id: areaIds }
        });
        
        // Obtener los IDs de empleados
        const empleadoIds = empleadosAreas.map(ea => ea.empleado_id);
        
        // Buscar los empleados por sus IDs para el log
        const empleados = await Empleado.findAll({
            where: { id: empleadoIds },
            attributes: ['id', 'nombres']
        });
        
        console.log('👥 Empleados encontrados en las áreas del jefe:', empleados.map(e => ({ id: e.id, nombres: e.nombres })));
        console.log('👥 IDs de empleados:', empleadoIds);
        
        if (empleadoIds.length === 0) {
            console.log('❌ No hay empleados en las áreas del jefe');
            return res.json([]); // No hay empleados en las áreas del jefe
        }
        
        // Obtener solicitudes de esos empleados (excluyendo las del propio jefe)
        const solicitudes = await Solicitud.findAll({
            where: { 
                empleado_id: { 
                    [require('sequelize').Op.in]: empleadoIds,
                    [require('sequelize').Op.ne]: jefe_id // Excluir solicitudes del propio jefe
                }
            },
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres', 'oficio'],
                    include: [
                      {
                        model: Area,
                        as: 'areas',
                        attributes: ['nombre'],
                        through: { attributes: [] },
                        include: [
                          {
                            model: Empleado,
                            as: 'jefe',
                            attributes: ['nombres']
                          }
                        ]
                      }
                    ]
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                },
                {
                    model: AdjuntoSolicitud,
                    as: 'adjuntos',
                    attributes: ['ruta_archivo', 'nombre_archivo', 'tipo_mime', 'tamaño']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        
        console.log('📋 Solicitudes encontradas:', solicitudes.length);
        console.log('📋 Solicitudes:', solicitudes.map(s => ({ id: s.id, empleado: s.empleado?.nombres, estado: s.estado })));
        
        res.json(solicitudes);
    } catch (error) {
        console.error('Error en obtenerSolicitudesPorJefe:', error);
        res.status(500).json({
            message: 'Error al obtener solicitudes por jefe',
            error: error.message
        });
    }
};

// Descargar PDF de una solicitud aprobada
const descargarPDF = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🔍 Buscando PDF para solicitud ID: ${id}`);
        
        // Buscar la solicitud
        const solicitud = await Solicitud.findByPk(id, {
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres', 'oficio', 'documento']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                }
            ]
        });
        
        if (!solicitud) {
            console.log(`❌ Solicitud no encontrada: ${id}`);
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        
        console.log(`📋 Solicitud encontrada:`, {
            id: solicitud.id,
            estado: solicitud.estado,
            empleado: solicitud.empleado?.nombres,
            tipo: solicitud.tipo_solicitud?.nombre
        });
        
        if (solicitud.estado !== 'aprobado') {
            console.log(`❌ Solicitud no está aprobada. Estado actual: ${solicitud.estado}`);
            return res.status(400).json({ message: 'Solo se pueden descargar PDFs de solicitudes aprobadas' });
        }
        
        // Verificar si tiene ruta_pdf guardada
        if (!solicitud.ruta_pdf) {
            console.log(`❌ No hay ruta_pdf guardada para la solicitud ${solicitud.id}`);
            return res.status(404).json({ 
                message: 'PDF no encontrado para esta solicitud. Es posible que no se haya generado correctamente.' 
            });
        }
        
        const path = require('path');
        const fs = require('fs');
        
        // Construir la ruta completa del PDF desde la raíz del proyecto
        const pathProyecto = path.resolve(__dirname, '../../');
        let rutaRelativa = solicitud.ruta_pdf;
        // Si la ruta ya empieza con 'pdfs/', úsala tal cual desde la raíz de back rrhh
        if (!rutaRelativa.startsWith('pdfs/')) {
          rutaRelativa = path.join('pdfs', rutaRelativa);
        }
        const rutaCompleta = path.join(pathProyecto, rutaRelativa);
        console.log(`📁 Ruta del PDF corregida (desde raíz proyecto): ${rutaCompleta}`);
        
        // Verificar que el archivo existe
        if (!fs.existsSync(rutaCompleta)) {
            console.log(`❌ Archivo PDF no existe en ruta: ${rutaCompleta}`);
            return res.status(404).json({ 
                message: 'Archivo PDF no encontrado en el servidor. Es posible que haya sido eliminado.' 
            });
        }
        
        // Verificar que el archivo existe
        if (!fs.existsSync(rutaCompleta)) {
            console.log(`❌ Archivo PDF no existe en ruta: ${rutaCompleta}`);
            return res.status(404).json({ message: 'Archivo PDF no encontrado en el servidor' });
        }
        
        console.log(`📤 Enviando archivo: ${rutaCompleta}`);
        
        // Enviar el archivo
        res.download(rutaCompleta, `permiso_${solicitud.id}.pdf`);
        
    } catch (error) {
        console.error('❌ Error descargando PDF:', error);
        res.status(500).json({ 
            message: 'Error al descargar el PDF', 
            error: error.message,
            details: 'Verifique que el archivo PDF existe y es accesible'
        });
    }
};

module.exports = {
    obtenerSolicitudes,
    crearSolicitud,
    actualizarEstadoSolicitud,
    eliminarSolicitud,
    obtenerSolicitudesPorEmpleado,
    obtenerSolicitudesPorJefe,
    descargarPDF
};