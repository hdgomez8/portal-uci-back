const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Empleado = db.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    clase: DataTypes.STRING,
    documento: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    tipo_documento: DataTypes.STRING,
    ciudad_documento: DataTypes.STRING,
    nombres: DataTypes.STRING,
    foto_perfil: {
        type: DataTypes.STRING, // Guardamos solo la ruta de la imagen
        allowNull: true
    },
    hoja_vida: {
        type: DataTypes.STRING, // Guardamos solo la ruta de la imagen
        allowNull: true
    },
    fecha_ingreso: DataTypes.DATE,
    tipo_contrato: DataTypes.STRING,
    sucursal: DataTypes.STRING,
    grupo_pago: DataTypes.STRING,
    oficio: DataTypes.STRING,
    departamento: DataTypes.STRING,
    equipo_trabajo: DataTypes.STRING,
    clase_trabajador: DataTypes.STRING,
    estado_trabajador: DataTypes.STRING,
    jornada: DataTypes.STRING,
    salario_integral: DataTypes.BOOLEAN,
    fecha_nacimiento: DataTypes.DATE,
    ciudad_nacimiento: DataTypes.STRING,
    sexo: DataTypes.STRING,
    estado_civil: DataTypes.STRING,
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    },
    direccion: DataTypes.STRING,
    codigo_postal: DataTypes.STRING,
    ciudad_residencia: DataTypes.STRING,
    telefono: DataTypes.STRING,
    transporta_empresa: DataTypes.BOOLEAN,
    personas_a_cargo: DataTypes.INTEGER,
    concepto_pago_admon: DataTypes.STRING,
    concepto_pago_domingo: DataTypes.STRING,
    concepto_pago_festivo: DataTypes.STRING,
    concepto_pago_oficio: DataTypes.STRING,
    forma_pago: DataTypes.STRING,
    banco_empresa: DataTypes.STRING,
    gerencia_electronica: DataTypes.STRING,
    tipo_cuenta: DataTypes.STRING,
    numero_cuenta_banco: DataTypes.STRING,
    fondo_pension: DataTypes.STRING,
    fecha_ingreso_fondo_pension: DataTypes.DATE,
    fondo_salud: DataTypes.STRING,
    fecha_ingreso_fondo_salud: DataTypes.DATE,
    caja_compensacion: DataTypes.STRING,
    sucursal_pi: DataTypes.STRING,
    centro_trabajo: DataTypes.STRING,
    tipo_cotizante: DataTypes.STRING,
    depto_dane: DataTypes.INTEGER,
    dias_vacaciones: DataTypes.INTEGER,
    forma_pago_prima_vacaciones: DataTypes.STRING,
    forma_pago_aguinaldo: DataTypes.STRING,
    origen_dias_prima_servicio: DataTypes.STRING,
    forma_pago_prima_servicio: DataTypes.STRING,
    dias_prima_servicio: DataTypes.INTEGER,
    fondo_cesantias: DataTypes.STRING,
    dias_cesantias: DataTypes.INTEGER,
    ingreso_fondo: DataTypes.BOOLEAN,
    fecha_ingreso_fondo: DataTypes.DATE,
    sustitucion_patronal: DataTypes.BOOLEAN,
    fecha_sustitucion_patronal: DataTypes.DATE,
    dias_perdidos_ley_vieja: DataTypes.INTEGER,
    clase_indemnizacion: DataTypes.STRING,
    forma_indemnizacion: DataTypes.STRING,
    fecha_expedicion_documento: DataTypes.DATE,
    fecha_salida: {
        type: DataTypes.DATE,
        allowNull: true // Para permitir empleados deshabilitados
    }
}, {
    tableName: 'empleados',
    timestamps: false
});



module.exports = Empleado;
