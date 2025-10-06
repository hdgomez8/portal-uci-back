const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Empleado = require('../models/Empleado');
const EmpleadosAreas = require('../models/EstructuraEmpresa/EmpleadosAreas');
const Rol = require('../models/Rol');
const UsuariosRoles = require('../models/UsuarioRol');
const Permiso = require('../models/Permiso');
const Departamento = require('../models/EstructuraEmpresa/Departamento');
const Area = require('../models/EstructuraEmpresa/Area');
const { sendMail } = require('../utils/mailer');
const { getNuevoUsuarioTemplate } = require('../utils/emailTemplates');
const db = require('../config/database'); // Importar para transacciones

// Middleware de validación
exports.validarUsuario = [
    body('email').isEmail().withMessage('El email no es válido'),
    body('password')
        .isLength({ min: 8 })
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('Debe contener al menos un símbolo especial'),
    body('documento').notEmpty().withMessage('El documento es obligatorio')
];

// Crear usuario optimizado con transacciones y envío asíncrono de correos
const crearUsuario = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    const t = await db.transaction(); // Iniciar transacción
    try {
        const { nombres, email, documento, fecha_ingreso, tipo_contrato, codigo, rol, departamento, area, jefe_id, oficio } = req.body;

        // Verificar si el departamento existe por ID
        let departamentoExistente = await Departamento.findByPk(departamento);
        if (!departamentoExistente) {
            await t.rollback();
            return res.status(400).json({ message: 'Departamento no encontrado' });
        }

        // Verificar si el área existe o crearla
        let areaExistente = await Area.findOne({ 
            where: { 
                nombre: area, 
                departamento_id: departamentoExistente.id 
            } 
        });
        
        if (!areaExistente) {
            // Crear nueva área solo si no existe
            areaExistente = await Area.create({ 
                nombre: area, 
                departamento_id: departamentoExistente.id, 
                jefe_id: departamentoExistente.gerente_id // Usar el gerente del departamento automáticamente
            }, { transaction: t });
            console.log(`✅ Nueva área creada: ${area} en departamento ${departamentoExistente.nombre}`);
        } else {
            console.log(`✅ Área existente encontrada: ${area} en departamento ${departamentoExistente.nombre}`);
        }

        // Verificar si el empleado ya existe
        let empleado = await Empleado.findOne({ where: { documento } });
        if (!empleado) {
            empleado = await Empleado.create({
                nombres,
                email,
                documento,
                fecha_ingreso,
                tipo_contrato,
                codigo,
                oficio,
                departamento: departamentoExistente.nombre
            }, { transaction: t });
        }

        // Asignar el empleado al área en la tabla intermedia empleados_areas
        await EmpleadosAreas.create({
            empleado_id: empleado.id,
            area_id: areaExistente.id
        }, { transaction: t });

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            await t.rollback();
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Contraseña igual al documento
        const hashedPassword = await bcrypt.hash(documento, 10);

        // Crear usuario
        const usuario = await Usuario.create({
            empleado_id: empleado.id,
            email,
            password: hashedPassword
        }, { transaction: t });

        // Verificar si el rol existe o crearlo
        let rolExistente = await Rol.findOne({ where: { nombre: rol } });
        if (!rolExistente) {
            rolExistente = await Rol.create({ nombre: rol }, { transaction: t });
        }

        // Asignar usuario a su rol en la tabla intermedia usuarios_roles
        await UsuariosRoles.create({
            usuario_id: usuario.id,
            rol_id: rolExistente.id
        }, { transaction: t });

        // Confirmar transacción PRIMERO - antes de cualquier operación que pueda fallar
        await t.commit();
        console.log('✅ Transacción de creación de usuario confirmada exitosamente');

        // Responder al cliente INMEDIATAMENTE después de confirmar la transacción
        res.status(201).json({ 
            message: 'Usuario creado con éxito', 
            usuario: {
                id: usuario.id,
                email: usuario.email,
                empleado_id: usuario.empleado_id
            },
            empleado: {
                id: empleado.id,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos || '',
                documento: empleado.documento,
                email: empleado.email
            }
        });

        // Enviar correo de forma ASÍNCRONA (no bloquea la respuesta)
        setImmediate(async () => {
            try {
                console.log('📧 Iniciando envío de correo de bienvenida asíncrono...');
                const emailHTML = getNuevoUsuarioTemplate(empleado, documento);
                await sendMail(
                    email,
                    '🏢 Bienvenido al Portal UCI - Tus Credenciales de Acceso',
                    emailHTML
                );
                console.log('✅ Email de bienvenida enviado exitosamente a:', email);
            } catch (mailError) {
                console.error('❌ Error enviando correo de bienvenida asíncrono:', mailError);
                console.error('❌ Stack trace:', mailError.stack);
                // No afecta la respuesta al cliente
            }
        });

    } catch (error) {
        await t.rollback(); // Revertir cambios si hay error
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ error: error.message });
    }
};

// Editar usuario
const editarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Encriptar la nueva contraseña si se proporciona
        if (password) {
            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(password, salt);
        }
        if (email) usuario.email = email;

        await usuario.save();
        res.json({ message: 'Usuario actualizado exitosamente', usuario });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario', error });
    }
};

// Deshabilitar usuario (agregar fecha de salida)
const deshabilitarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_salida } = req.body;

        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        empleado.fecha_salida = fecha_salida;
        await empleado.save();
        res.json({ message: 'Empleado deshabilitado exitosamente', empleado });
    } catch (error) {
        res.status(500).json({ message: 'Error al deshabilitar empleado', error });
    }
};

// Obtener todos los usuarios con información del empleado
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['password'] }, // Excluir el campo de contraseña
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['id', 'nombres', 'documento', 'email', 'oficio'], // Incluir campos necesarios para edición
                    include: [
                        {
                            model: Area,
                            as: 'areas',
                            attributes: ['id', 'nombre'],
                            through: { attributes: [] } // Excluir tabla intermedia
                        }
                    ]
                },
                {
                    model: Rol,
                    as: 'roles',
                    attributes: ['id', 'nombre'],
                    include: [
                        {
                            model: Permiso,
                            as: 'permisos',
                            attributes: ['id', 'nombre']
                        }
                    ]
                }
            ]
        });
        res.json(usuarios);
    } catch (error) {
        console.error("🔥 Error en obtenerUsuarios:", error.message);
        res.status(500).json({
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Actualizar el rol de un usuario
const actualizarRolUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { rolId } = req.body;
        // Buscar el usuario
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Eliminar roles actuales
        await UsuariosRoles.destroy({ where: { usuario_id: id } });
        // Asignar el nuevo rol
        await UsuariosRoles.create({ usuario_id: id, rol_id: rolId });
        res.json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el rol del usuario', error });
    }
};

// Eliminar usuario y su empleado asociado
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar el usuario con su empleado asociado
        const usuario = await Usuario.findByPk(id, {
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['id', 'nombres', 'documento']
                }
            ]
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log(`🗑️ Eliminando usuario ID: ${id}, Email: ${usuario.email}`);
        console.log(`👤 Empleado asociado: ${usuario.empleado?.nombres} (ID: ${usuario.empleado?.id})`);

        // Eliminar registros relacionados en orden
        const empleadoId = usuario.empleado?.id;

        // 1. Eliminar roles del usuario
        await UsuariosRoles.destroy({ where: { usuario_id: id } });
        console.log('✅ Roles del usuario eliminados');

        // 2. Eliminar el usuario
        await usuario.destroy();
        console.log('✅ Usuario eliminado');

        // 3. Si existe empleado asociado, eliminar también
        if (empleadoId) {
            try {
                // Eliminar solicitudes relacionadas
                const Solicitud = require('../models/Solicitudes/Solicitud');
                await Solicitud.destroy({ where: { empleado_id: empleadoId } });
                console.log('✅ Solicitudes del empleado eliminadas');
            } catch (error) {
                console.log('⚠️ No se pudieron eliminar solicitudes:', error.message);
            }

            try {
                // Eliminar solicitudes de vacaciones
                const Vacaciones = require('../models/Vacaciones');
                await Vacaciones.destroy({ where: { empleado_id: empleadoId } });
                console.log('✅ Solicitudes de vacaciones eliminadas');
            } catch (error) {
                console.log('⚠️ No se pudieron eliminar vacaciones:', error.message);
            }

            try {
                // Eliminar solicitudes de cambio de turno
                const CambioTurno = require('../models/Solicitudes/CambioTurno');
                await CambioTurno.destroy({ where: { empleado_id: empleadoId } });
                console.log('✅ Solicitudes de cambio de turno eliminadas');
            } catch (error) {
                console.log('⚠️ No se pudieron eliminar cambios de turno:', error.message);
            }

            try {
                // Eliminar asignaciones de áreas
                await EmpleadosAreas.destroy({ where: { empleado_id: empleadoId } });
                console.log('✅ Asignaciones de áreas eliminadas');
            } catch (error) {
                console.log('⚠️ No se pudieron eliminar asignaciones de áreas:', error.message);
            }

            try {
                // Eliminar el empleado
                await Empleado.destroy({ where: { id: empleadoId } });
                console.log('✅ Empleado eliminado');
            } catch (error) {
                console.log('⚠️ No se pudo eliminar empleado:', error.message);
            }
        } else {
            console.log('ℹ️ No hay empleado asociado para eliminar');
        }

        res.json({ 
            message: 'Usuario y empleado asociado eliminados exitosamente',
            usuarioEliminado: {
                id: id,
                email: usuario.email
            },
            empleadoEliminado: empleadoId ? {
                id: empleadoId,
                nombres: usuario.empleado?.nombres
            } : null
        });

    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({ 
            message: 'Error al eliminar usuario', 
            error: error.message 
        });
    }
};

module.exports = { crearUsuario, editarUsuario, deshabilitarUsuario, obtenerUsuarios, actualizarRolUsuario, eliminarUsuario };
