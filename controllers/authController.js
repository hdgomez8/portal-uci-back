const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Empleado = require('../models/Empleado');
const Area = require('../models/EstructuraEmpresa/Area');
const Departamento = require('../models/EstructuraEmpresa/Departamento');
const Rol = require('../models/Rol');
const Permiso = require('../models/Permiso');
require('dotenv').config();

// Función de inicio de sesión
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario por email e incluir relaciones con empleado, área, departamento, roles y permisos
        const usuario = await Usuario.findOne({
            where: { email },
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    include: [
                        {
                            model: Area,
                            as: 'areas',
                            include: [
                                {
                                    model: Departamento,
                                    as: 'departamento'
                                },
                                {
                                    model: Empleado,
                                    as: 'jefe'
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Rol,
                    as: 'roles',
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

        // Validar si el usuario existe
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Validar si el usuario está activo
        if (usuario.empleado) {
            // Validar fecha de salida
            if (usuario.empleado.fecha_salida) {
                const fechaSalida = new Date(usuario.empleado.fecha_salida);
                const ahora = new Date();
                if (fechaSalida <= ahora) {
                    console.log(`❌ Usuario inactivo por fecha de salida: ${usuario.empleado.nombres} (${usuario.empleado.documento})`);
                    return res.status(403).json({ message: 'Usuario inactivo. No puede iniciar sesión.' });
                }
            }
            
            // Validar estado del trabajador
            const estadosInactivos = ['Inactivo', 'Retirado', 'Suspendido'];
            if (usuario.empleado.estado_trabajador && estadosInactivos.includes(usuario.empleado.estado_trabajador)) {
                console.log(`❌ Usuario inactivo por estado: ${usuario.empleado.nombres} (${usuario.empleado.documento}) - Estado: ${usuario.empleado.estado_trabajador}`);
                return res.status(403).json({ 
                    message: `Usuario inactivo (${usuario.empleado.estado_trabajador}). No puede iniciar sesión.` 
                });
            }
        }

        // Comparar contraseñas
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            console.log("❌ Contraseña incorrecta");
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        console.log("✅ Contraseña válida, generando token...");

        // Generar token JWT
        const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, {
            expiresIn: '8h',
        });

        // Determinar el departamento gestionado basado en roles y áreas
        let departamentoGestionado = null;
        const rolesSupervision = ['JEFE AREA', 'GERENTE', 'SUPERVISOR', 'ADMIN'];
        const tieneRolSupervision = usuario.roles?.some(rol => rolesSupervision.includes(rol.nombre));
        
        if (tieneRolSupervision && usuario.empleado?.areas) {
            // Si es JEFE AREA y pertenece a GERENCIA, gestiona ASISTENCIAL
            const areaPersonal = usuario.empleado.areas[0];
            if (areaPersonal?.departamento?.nombre === 'GERENCIA') {
                departamentoGestionado = 'ASISTENCIAL';
            } else {
                departamentoGestionado = areaPersonal?.departamento?.nombre;
            }
        }

        // Construir la respuesta con la información jerárquica correcta y roles/permisos
        res.json({
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                empleado: usuario.empleado ? {
                    id: usuario.empleado.id,
                    nombres: usuario.empleado.nombres,
                    documento: usuario.empleado.documento,
                    oficio: usuario.empleado.oficio,
                    areas: usuario.empleado.areas?.map(area => ({
                        id: area.id,
                        nombre: area.nombre,
                        departamento: area.departamento ? {
                            id: area.departamento.id,
                            nombre: area.departamento.nombre
                        } : null,
                        jefe: area.jefe ? {
                            id: area.jefe.id,
                            nombres: area.jefe.nombres,
                            oficio: area.jefe.oficio
                        } : null
                    })) || [],
                    departamentoGestionado: departamentoGestionado
                } : null,
                roles: usuario.roles?.map(rol => ({
                    id: rol.id,
                    nombre: rol.nombre,
                    permisos: rol.permisos?.map(p => ({ id: p.id, nombre: p.nombre })) || []
                })) || []
            }
        });

    } catch (error) {
        console.error("⚠️ Error en el login:", error);
        res.status(500).json({ message: 'Error en el servidor', error });
    }
};

module.exports = { login };