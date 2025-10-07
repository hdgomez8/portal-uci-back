const Empleado = require('../models/Empleado');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Permiso = require('../models/Permiso');

// Crear empleado
exports.crearEmpleado = async (req, res) => {
    try {
        const empleado = await Empleado.create(req.body);
        res.status(201).json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener todos los empleados
exports.obtenerEmpleados = async (req, res) => {
    try {
        const empleados = await Empleado.findAll({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    include: [
                        {
                            model: Rol,
                            as: 'roles',
                            include: [
                                {
                                    model: Permiso,
                                    as: 'permisos',
                                    through: { attributes: [] }
                                }
                            ]
                        }
                    ]
                },
                {
                    model: require('../models/EstructuraEmpresa/Area'),
                    as: 'areas',
                    through: { attributes: [] },
                    include: [
                        {
                            model: require('../models/Empleado'),
                            as: 'jefe',
                            attributes: ['nombres']
                        }
                    ]
                }
            ]
        });

        // 🔥 Modificar la respuesta para ajustar el formato de "areas"
        const empleadosModificados = empleados.map(empleado => {
            const empleadoJSON = empleado.toJSON(); // Convertir a JSON para modificar estructura
            empleadoJSON.areas = empleadoJSON.areas.length === 1 ? empleadoJSON.areas[0] : empleadoJSON.areas;
            return empleadoJSON;
        });

        res.json(empleadosModificados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener un empleado por ID
exports.obtenerEmpleadoPorId = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id);
        if (!empleado) return res.status(404).json({ message: "Empleado no encontrado" });
        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id);
        if (!empleado) return res.status(404).json({ message: "Empleado no encontrado" });

        // Si se está actualizando el email del empleado, sincronizar con el usuario
        if (req.body.email && req.body.email !== empleado.email) {
            const Usuario = require('../models/Usuario');
            const usuario = await Usuario.findOne({ where: { empleado_id: req.params.id } });
            
            if (usuario) {
                // Verificar que el email no esté en uso por otro usuario
                const emailEnUso = await Usuario.findOne({ 
                    where: { 
                        email: req.body.email,
                        id: { [require('sequelize').Op.ne]: usuario.id }
                    }
                });
                
                if (emailEnUso) {
                    return res.status(400).json({ 
                        error: "El email ya está en uso por otro usuario" 
                    });
                }
                
                // Actualizar el email del usuario también
                await usuario.update({ email: req.body.email });
            }
        }

        await empleado.update(req.body);
        res.json({ message: "Empleado actualizado", empleado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empleado y su usuario asociado
exports.eliminarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar el empleado con su usuario asociado
        const empleado = await Empleado.findByPk(id, {
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'email']
                }
            ]
        });

        if (!empleado) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        console.log(`🗑️ Eliminando empleado ID: ${id}, Nombres: ${empleado.nombres}`);
        console.log(`👤 Usuario asociado: ${empleado.usuario?.email} (ID: ${empleado.usuario?.id})`);

        // Eliminar registros relacionados en orden
        const usuarioId = empleado.usuario?.id;

        // 1. Eliminar solicitudes relacionadas
        const Solicitud = require('../models/Solicitudes/Solicitud');
        await Solicitud.destroy({ where: { empleado_id: id } });
        console.log('✅ Solicitudes del empleado eliminadas');

        // 2. Eliminar solicitudes de vacaciones
        try {
            const Vacaciones = require('../models/Vacaciones');
            await Vacaciones.destroy({ where: { empleado_id: id } });
            console.log('✅ Solicitudes de vacaciones eliminadas');
        } catch (error) {
            console.log('⚠️ No se pudieron eliminar vacaciones:', error.message);
        }

        // 3. Eliminar solicitudes de cambio de turno
        try {
            const CambioTurno = require('../models/Solicitudes/CambioTurno');
            await CambioTurno.destroy({ where: { empleado_id: id } });
            console.log('✅ Solicitudes de cambio de turno eliminadas');
        } catch (error) {
            console.log('⚠️ No se pudieron eliminar cambios de turno:', error.message);
        }

        // 4. Eliminar asignaciones de áreas
        try {
            const EmpleadosAreas = require('../models/EstructuraEmpresa/EmpleadosAreas');
            await EmpleadosAreas.destroy({ where: { empleado_id: id } });
            console.log('✅ Asignaciones de áreas eliminadas');
        } catch (error) {
            console.log('⚠️ No se pudieron eliminar asignaciones de áreas:', error.message);
        }

        // 5. Si existe usuario asociado, eliminar también
        if (usuarioId) {
            try {
                // Eliminar roles del usuario
                const UsuariosRoles = require('../models/UsuarioRol');
                await UsuariosRoles.destroy({ where: { usuario_id: usuarioId } });
                console.log('✅ Roles del usuario eliminados');

                // Eliminar el usuario
                await Usuario.destroy({ where: { id: usuarioId } });
                console.log('✅ Usuario eliminado');
            } catch (error) {
                console.log('⚠️ No se pudo eliminar usuario:', error.message);
            }
        } else {
            console.log('ℹ️ No hay usuario asociado para eliminar');
        }

        // 6. Eliminar el empleado
        await empleado.destroy();
        console.log('✅ Empleado eliminado');

        res.json({ 
            message: 'Empleado y usuario asociado eliminados exitosamente',
            empleadoEliminado: {
                id: id,
                nombres: empleado.nombres,
                documento: empleado.documento
            },
            usuarioEliminado: usuarioId ? {
                id: usuarioId,
                email: empleado.usuario?.email
            } : null
        });

    } catch (error) {
        console.error('❌ Error al eliminar empleado:', error);
        res.status(500).json({ 
            message: 'Error al eliminar empleado', 
            error: error.message 
        });
    }
};

exports.subirFoto = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
        }

        // Guardar la ruta de la imagen en la base de datos
        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        empleado.foto_perfil = req.file.filename;
        await empleado.save();

        res.json({ message: 'Imagen subida correctamente', foto_perfil: req.file.path });
    } catch (error) {
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
};

exports.subirCV = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleado.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No se ha subido ningún archivo" });
        }

        // Guardamos solo el nombre del archivo en la base de datos
        empleado.hoja_vida = req.file.filename;
        await empleado.save();

        res.json({ message: "Hoja de vida actualizada", cv: req.file.filename });
    } catch (error) {
        console.error("Error al subir la hoja de vida:", error);
        res.status(500).json({ error: "Error al subir la hoja de vida" });
    }
};

exports.subirFirma = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleado.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No se ha subido ningún archivo" });
        }

        // Guardamos solo el nombre del archivo en la base de datos
        empleado.firma = req.file.filename;
        await empleado.save();

        res.json({ 
            message: "Firma actualizada correctamente", 
            firma: req.file.filename 
        });
    } catch (error) {
        console.error("Error al subir la firma:", error);
        res.status(500).json({ error: "Error al subir la firma" });
    }
};

exports.verificarFirma = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleado.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }

        const fs = require('fs');
        const path = require('path');
        const uploadPath = path.join(__dirname, '../firmas/');

        let firmaInfo = {
            existe: false,
            nombre_archivo: null,
            url: null,
            fecha_creacion: null,
            tamaño: null
        };

        // Buscar firma por documento del empleado
        const extensiones = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.pdf'];
        let firmaEncontrada = null;

        for (const ext of extensiones) {
            const firmaPath = path.join(uploadPath, `${empleado.documento}${ext}`);
            if (fs.existsSync(firmaPath)) {
                firmaEncontrada = `${empleado.documento}${ext}`;
                break;
            }
        }

        if (firmaEncontrada) {
            const firmaPath = path.join(uploadPath, firmaEncontrada);
            const stats = fs.statSync(firmaPath);
            firmaInfo = {
                existe: true,
                nombre_archivo: firmaEncontrada,
                url: `http://localhost:5000/firmas/${firmaEncontrada}`,
                fecha_creacion: stats.birthtime,
                fecha_modificacion: stats.mtime,
                tamaño: stats.size,
                tipo: path.extname(firmaEncontrada).toLowerCase(),
                documento_empleado: empleado.documento
            };

            // Actualizar la BD si no coincide con lo almacenado
            if (empleado.firma !== firmaEncontrada) {
                empleado.firma = firmaEncontrada;
                await empleado.save();
                console.log(`Firma actualizada en BD: ${empleado.firma} -> ${firmaEncontrada}`);
            }
        } else if (empleado.firma) {
            // La firma está en la BD pero el archivo no existe
            console.warn(`Firma en BD pero archivo no encontrado: ${empleado.firma}`);
        }

        res.json(firmaInfo);
    } catch (error) {
        console.error("Error al verificar la firma:", error);
        res.status(500).json({ error: "Error al verificar la firma" });
    }
};

exports.eliminarFirma = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Empleado.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }

        const fs = require('fs');
        const path = require('path');
        const uploadPath = path.join(__dirname, '../firmas/');

        // Buscar firma por documento del empleado
        const extensiones = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.pdf'];
        let firmaEncontrada = null;
        let firmaPath = null;

        for (const ext of extensiones) {
            const tempPath = path.join(uploadPath, `${empleado.documento}${ext}`);
            if (fs.existsSync(tempPath)) {
                firmaEncontrada = `${empleado.documento}${ext}`;
                firmaPath = tempPath;
                break;
            }
        }

        if (!firmaEncontrada) {
            return res.status(404).json({ error: "No se encontró firma para este empleado" });
        }

        // Eliminar archivo físico
        fs.unlinkSync(firmaPath);
        console.log(`Archivo de firma eliminado: ${firmaPath}`);

        // Limpiar referencia en la base de datos
        empleado.firma = null;
        await empleado.save();

        res.json({ 
            message: "Firma eliminada correctamente",
            empleado: {
                id: empleado.id,
                nombres: empleado.nombres,
                documento: empleado.documento,
                firma: empleado.firma
            },
            firma_eliminada: firmaEncontrada
        });
    } catch (error) {
        console.error("Error al eliminar la firma:", error);
        res.status(500).json({ error: "Error al eliminar la firma" });
    }
};

// Obtener empleados por jefe_id
exports.obtenerEmpleadosPorJefe = async (req, res) => {
    try {
        const jefe_id = req.params.jefe_id;
        const Area = require('../models/EstructuraEmpresa/Area');
        const EmpleadoArea = require('../models/EstructuraEmpresa/EmpleadosAreas');

        console.log('🔍 Buscando empleados para jefe_id:', jefe_id);

        // Buscar áreas donde jefe_id = jefe_id
        const areas = await Area.findAll({ where: { jefe_id } });
        const areaIds = areas.map(area => area.id);

        console.log('📋 Áreas encontradas:', areas.map(a => ({ id: a.id, nombre: a.nombre })));
        console.log('📋 IDs de áreas:', areaIds);

        if (areaIds.length === 0) {
            console.log('❌ No hay áreas asignadas a este jefe');
            return res.json([]); // No hay áreas asignadas a este jefe
        }

        // Buscar empleados que pertenezcan a esas áreas usando la tabla intermedia
        const empleadosAreas = await EmpleadoArea.findAll({
            where: { area_id: areaIds }
        });

        console.log('📋 EmpleadosAreas encontrados:', empleadosAreas.length);

        // Obtener los IDs de empleados
        const empleadoIds = empleadosAreas.map(ea => ea.empleado_id);
        
        // Buscar los empleados por sus IDs
        const empleados = await Empleado.findAll({
            where: { id: empleadoIds },
            attributes: ['id', 'nombres', 'documento', 'codigo', 'oficio', 'estado_trabajador']
        });
        
        console.log('👥 Empleados del jefe:', empleados.map(e => ({ id: e.id, nombres: e.nombres })));
        
        res.json(empleados);
    } catch (error) {
        console.error('Error en obtenerEmpleadosPorJefe:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar área del empleado
exports.actualizarAreaEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const { areaId } = req.body;
        
        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        const EmpleadoArea = require('../models/EstructuraEmpresa/EmpleadosAreas');
        
        // Eliminar todas las áreas actuales del empleado
        await EmpleadoArea.destroy({
            where: { empleado_id: id }
        });

        // Si se proporciona un areaId, crear la nueva relación
        if (areaId) {
            await EmpleadoArea.create({
                empleado_id: parseInt(id),
                area_id: parseInt(areaId)
            });
        }

        res.json({ message: "Área del empleado actualizada correctamente" });
    } catch (error) {
        console.error('Error en actualizarAreaEmpleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// Función auxiliar para obtener el email preferido para notificaciones
exports.obtenerEmailNotificacion = async (empleadoId) => {
    try {
        const Usuario = require('../models/Usuario');
        const usuario = await Usuario.findOne({ where: { empleado_id: empleadoId } });
        
        // Priorizar el email del usuario (para notificaciones del sistema)
        if (usuario && usuario.email) {
            return usuario.email;
        }
        
        // Si no hay usuario o email de usuario, usar el email del empleado
        const empleado = await Empleado.findByPk(empleadoId);
        return empleado ? empleado.email : null;
    } catch (error) {
        console.error('Error al obtener email de notificación:', error);
        return null;
    }
};

// Obtener un empleado por documento
exports.obtenerEmpleadoPorDocumento = async (req, res) => {
    try {
        const empleado = await Empleado.findOne({ where: { documento: req.params.documento } });
        if (!empleado) return res.status(404).json({ message: "Empleado no encontrado" });
        res.json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Buscar empleados por nombre o documento (autocompletado)
exports.buscarEmpleados = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });
    try {
        const empleados = await Empleado.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { documento: { [require('sequelize').Op.like]: `%${q}%` } },
                    { nombres: { [require('sequelize').Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'nombres', 'documento', 'email'],
            limit: 10
        });
        res.json(empleados);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar empleados' });
    }
};

// Obtener empleados por área (excluyendo jefes de área)
exports.obtenerEmpleadosPorArea = async (req, res) => {
  try {
    const areaId = req.params.areaId;
    const EmpleadoArea = require('../models/EstructuraEmpresa/EmpleadosAreas');
    const Usuario = require('../models/Usuario');
    const Rol = require('../models/Rol');
    
    // Obtener empleados del área
    const empleadosAreas = await EmpleadoArea.findAll({ where: { area_id: areaId } });
    const empleadoIds = empleadosAreas.map(ea => ea.empleado_id);
    
    // Obtener empleados con sus usuarios y roles
    const empleados = await Empleado.findAll({ 
      where: { id: empleadoIds },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });
    
    // Filtrar para excluir a los jefes de área
    const empleadosFiltrados = empleados.filter(empleado => {
      const esJefeArea = empleado.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA');
      return !esJefeArea;
    });
    
    // Devolver solo los datos necesarios del empleado (sin información de usuario/roles)
    const empleadosLimpios = empleadosFiltrados.map(empleado => ({
      id: empleado.id,
      nombres: empleado.nombres,
      documento: empleado.documento,
      email: empleado.email,
      oficio: empleado.oficio,
      estado_trabajador: empleado.estado_trabajador
    }));
    
    res.json(empleadosLimpios);
  } catch (error) {
    console.error('Error en obtenerEmpleadosPorArea:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar estado del empleado (activar/desactivar)
exports.actualizarEstadoEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_trabajador } = req.body;
    
    const empleado = await Empleado.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    // Validar que el estado sea válido
    const estadosValidos = ['Activo', 'Inactivo', 'Retirado', 'Suspendido'];
    if (!estadosValidos.includes(estado_trabajador)) {
      return res.status(400).json({ 
        error: "Estado inválido. Estados válidos: Activo, Inactivo, Retirado, Suspendido" 
      });
    }

    await empleado.update({ estado_trabajador });
    
    res.json({ 
      message: `Empleado ${estado_trabajador.toLowerCase()} correctamente`, 
      empleado: {
        id: empleado.id,
        nombres: empleado.nombres,
        estado_trabajador: empleado.estado_trabajador
      }
    });
  } catch (error) {
    console.error('Error en actualizarEstadoEmpleado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar documento del empleado
exports.actualizarDocumentoEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { documento, tipo_documento, ciudad_documento } = req.body;
    
    const empleado = await Empleado.findByPk(id);
    if (!empleado) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    // Verificar que el nuevo documento no esté en uso por otro empleado
    if (documento && documento !== empleado.documento) {
      const documentoEnUso = await Empleado.findOne({ 
        where: { 
          documento: documento,
          id: { [require('sequelize').Op.ne]: id }
        }
      });
      
      if (documentoEnUso) {
        return res.status(400).json({ 
          error: "El documento ya está en uso por otro empleado" 
        });
      }
    }

    // Actualizar SOLO los campos del documento (NO el código)
    const camposActualizar = {};
    if (documento) camposActualizar.documento = documento;
    if (tipo_documento) camposActualizar.tipo_documento = tipo_documento;
    if (ciudad_documento) camposActualizar.ciudad_documento = ciudad_documento;

    // IMPORTANTE: No actualizar el código para mantener la unicidad
    await empleado.update(camposActualizar);
    
    res.json({ 
      message: "Documento del empleado actualizado correctamente", 
      empleado: {
        id: empleado.id,
        nombres: empleado.nombres,
        codigo: empleado.codigo, // El código NO cambia
        documento: empleado.documento,
        tipo_documento: empleado.tipo_documento,
        ciudad_documento: empleado.ciudad_documento
      }
    });
  } catch (error) {
    console.error('Error en actualizarDocumentoEmpleado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener información del jefe de un empleado
exports.obtenerJefeEmpleado = async (req, res) => {
  try {
    const empleadoId = req.params.empleadoId;
    
    // Obtener el empleado con su área
    const EmpleadoArea = require('../models/EstructuraEmpresa/EmpleadosAreas');
    const Area = require('../models/EstructuraEmpresa/Area');
    
    const empleadoArea = await EmpleadoArea.findOne({
      where: { empleado_id: empleadoId },
      include: [
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'jefe_id']
        }
      ]
    });

    if (!empleadoArea || !empleadoArea.area) {
      return res.status(404).json({ 
        message: 'Empleado no encontrado o no tiene área asignada',
        jefe: null
      });
    }

    // Si el área tiene jefe_id, obtener la información del jefe
    if (empleadoArea.area.jefe_id) {
      const jefe = await Empleado.findByPk(empleadoArea.area.jefe_id, {
        attributes: ['id', 'nombres', 'documento', 'oficio']
      });

      if (jefe) {
        return res.json({
          jefe: {
            id: jefe.id,
            nombres: jefe.nombres,
            documento: jefe.documento,
            cargo: jefe.oficio || 'Jefe de Área'
          }
        });
      }
    }

    // Si no hay jefe asignado, retornar null
    res.json({ 
      message: 'No hay jefe asignado para esta área',
      jefe: null
    });
  } catch (error) {
    console.error('Error al obtener jefe del empleado:', error);
    res.status(500).json({ error: error.message });
  }
};
