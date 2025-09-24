const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vacaciones = sequelize.define('Vacaciones', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    empleado_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'empleados', key: 'id' } },
    ciudad_departamento: { type: DataTypes.STRING(100), allowNull: false },
    fecha_solicitud: { type: DataTypes.DATEONLY, allowNull: false },
    nombres_colaborador: { type: DataTypes.STRING(100), allowNull: false },
    cedula_colaborador: { type: DataTypes.STRING(30), allowNull: false },
    cargo_colaborador: { type: DataTypes.STRING(100), allowNull: true },
    // Periodo de vacaciones cumplidas
    periodo_cumplido_desde: { type: DataTypes.DATEONLY, allowNull: false },
    periodo_cumplido_hasta: { type: DataTypes.DATEONLY, allowNull: false },
    dias_cumplidos: { type: DataTypes.INTEGER, allowNull: false },
    // Periodo de disfrute
    periodo_disfrute_desde: { type: DataTypes.DATEONLY, allowNull: false },
    periodo_disfrute_hasta: { type: DataTypes.DATEONLY, allowNull: false },
    dias_disfrute: { type: DataTypes.INTEGER, allowNull: false },
    // Días con pago en efectivo
    dias_pago_efectivo_aplica: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dias_pago_efectivo_na: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dias_pago_efectivo_total: { type: DataTypes.INTEGER, allowNull: true },
    // Actividades pendientes
    actividades_pendientes: { type: DataTypes.TEXT, allowNull: true },
    // Reemplazo
    reemplazo_nombre: { type: DataTypes.STRING(100), allowNull: true },
    reemplazo_firma: { type: DataTypes.STRING(100), allowNull: true },
    reemplazo_identificacion: { type: DataTypes.STRING(30), allowNull: true },
    reemplazo_no_hay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reemplazo_nuevo_personal: { type: DataTypes.STRING(10), allowNull: true }, // 'si', 'no', 'na'
    // Firmas y nombres
    solicitante_nombre: { type: DataTypes.STRING(100), allowNull: false },
    solicitante_cargo: { type: DataTypes.STRING(100), allowNull: false },
    solicitante_firma: { type: DataTypes.STRING(100), allowNull: true },
    jefe_nombre: { type: DataTypes.STRING(100), allowNull: false },
    jefe_cargo: { type: DataTypes.STRING(100), allowNull: false },
    jefe_firma: { type: DataTypes.STRING(100), allowNull: true },
    administrador_nombre: { type: DataTypes.STRING(100), allowNull: true },
    administrador_cargo: { type: DataTypes.STRING(100), allowNull: true },
    administrador_firma: { type: DataTypes.STRING(100), allowNull: true },
    representante_legal_nombre: { type: DataTypes.STRING(100), allowNull: true },
    representante_legal_cargo: { type: DataTypes.STRING(100), allowNull: true },
    representante_legal_firma: { type: DataTypes.STRING(100), allowNull: true },
    // Estado y seguimiento
    estado: { 
      type: DataTypes.ENUM('pendiente', 'en_revision', 'aprobado_por_admin', 'aprobado', 'rechazado'), 
      allowNull: false, 
      defaultValue: 'pendiente' 
    },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    archivo_pdf: { type: DataTypes.STRING(255), allowNull: true }, // Ruta del archivo PDF
    fecha_revision: { type: DataTypes.DATE, allowNull: true },
    revisado_por: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'empleados', key: 'id' } },
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'solicitudes_vacaciones',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  Vacaciones.associate = (models) => {
    Vacaciones.belongsTo(models.Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
    Vacaciones.belongsTo(models.Empleado, { foreignKey: 'revisado_por', as: 'revisor' });
  };

  return Vacaciones;
}; 