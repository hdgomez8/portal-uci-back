'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('solicitudes_vacaciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleados', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ciudad_departamento: { type: Sequelize.STRING(100), allowNull: false },
      fecha_solicitud: { type: Sequelize.DATEONLY, allowNull: false },
      nombres_colaborador: { type: Sequelize.STRING(100), allowNull: false },
      cedula_colaborador: { type: Sequelize.STRING(30), allowNull: false },
      cargo_colaborador: { type: Sequelize.STRING(100), allowNull: false },
      periodo_cumplido_desde: { type: Sequelize.DATEONLY, allowNull: false },
      periodo_cumplido_hasta: { type: Sequelize.DATEONLY, allowNull: false },
      dias_cumplidos: { type: Sequelize.INTEGER, allowNull: false },
      periodo_disfrute_desde: { type: Sequelize.DATEONLY, allowNull: false },
      periodo_disfrute_hasta: { type: Sequelize.DATEONLY, allowNull: false },
      dias_disfrute: { type: Sequelize.INTEGER, allowNull: false },
      dias_pago_efectivo_aplica: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      dias_pago_efectivo_na: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      dias_pago_efectivo_total: { type: Sequelize.INTEGER, allowNull: true },
      actividades_pendientes: { type: Sequelize.TEXT, allowNull: true },
      reemplazo_nombre: { type: Sequelize.STRING(100), allowNull: true },
      reemplazo_firma: { type: Sequelize.STRING(100), allowNull: true },
      reemplazo_identificacion: { type: Sequelize.STRING(30), allowNull: true },
      reemplazo_no_hay: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      reemplazo_nuevo_personal: { type: Sequelize.STRING(10), allowNull: true },
      solicitante_nombre: { type: Sequelize.STRING(100), allowNull: false },
      solicitante_cargo: { type: Sequelize.STRING(100), allowNull: false },
      solicitante_firma: { type: Sequelize.STRING(100), allowNull: true },
      jefe_nombre: { type: Sequelize.STRING(100), allowNull: false },
      jefe_cargo: { type: Sequelize.STRING(100), allowNull: false },
      jefe_firma: { type: Sequelize.STRING(100), allowNull: true },
      administrador_nombre: { type: Sequelize.STRING(100), allowNull: true },
      administrador_cargo: { type: Sequelize.STRING(100), allowNull: true },
      administrador_firma: { type: Sequelize.STRING(100), allowNull: true },
      representante_legal_nombre: { type: Sequelize.STRING(100), allowNull: true },
      representante_legal_cargo: { type: Sequelize.STRING(100), allowNull: true },
      representante_legal_firma: { type: Sequelize.STRING(100), allowNull: true },
      estado: { type: Sequelize.ENUM('pendiente', 'en_revision', 'aprobado', 'rechazado'), defaultValue: 'pendiente', allowNull: false },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      fecha_revision: { type: Sequelize.DATE, allowNull: true },
      revisado_por: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empleados', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      motivo_rechazo: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('solicitudes_vacaciones', ['empleado_id']);
    await queryInterface.addIndex('solicitudes_vacaciones', ['estado']);
    await queryInterface.addIndex('solicitudes_vacaciones', ['fecha_solicitud']);
    await queryInterface.addIndex('solicitudes_vacaciones', ['deleted_at']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('solicitudes_vacaciones');
  }
}; 