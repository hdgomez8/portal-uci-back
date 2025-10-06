#!/usr/bin/env node

/**
 * Script de diagnóstico de inicio para el servidor
 */

const { sendMail } = require('../utils/mailer');

async function diagnosticoInicio() {
    console.log('🔍 DIAGNÓSTICO DE INICIO DEL SERVIDOR');
    console.log('=====================================');
    console.log('');

    try {
        console.log('📧 Enviando correo de diagnóstico de inicio...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🚀 Diagnóstico de Inicio - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🚀 Diagnóstico de Inicio - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.env.HOSTNAME || 'Portal UCI'}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API (OAuth 2.0)</p>
                        <p><strong>Puerto:</strong> HTTPS (443)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Servidor iniciado correctamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos está operativo.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Correo de diagnóstico enviado exitosamente');
        console.log(`📧 Message ID: ${resultado.messageId}`);
        console.log(`📧 Provider: ${resultado.provider}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en diagnóstico de inicio:', error.message);
        return false;
    }
}

module.exports = { diagnosticoInicio };
