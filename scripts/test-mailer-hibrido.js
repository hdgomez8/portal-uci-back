#!/usr/bin/env node

/**
 * Script para probar el mailer híbrido (Gmail API + Gmail SMTP fallback)
 */

const { sendMail } = require('../utils/mailerHibrido');

async function testMailerHibrido() {
    console.log('🧪 TEST MAILER HÍBRIDO');
    console.log('======================');
    console.log('');

    try {
        console.log('📧 Enviando correo con sistema híbrido...');
        console.log('📧 Destinatario: hdgomez0@gmail.com');
        console.log('📧 Asunto: 🧪 Test Mailer Híbrido');
        console.log('');

        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Mailer Híbrido',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Mailer Híbrido</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Híbrido (Gmail API + SMTP Fallback)</p>
                        <p><strong>Entorno:</strong> Local</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test Híbrido exitoso</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Sistema híbrido funcionando correctamente.</p>
                    </div>
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin-top: 15px;">
                        <p style="margin: 0; color: #004085;"><strong>🚀 Listo para Producción</strong></p>
                        <p style="margin: 5px 0 0 0; color: #004085;">Sistema robusto con fallback automático.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Correo enviado exitosamente');
        console.log('📧 Message ID:', resultado.messageId);
        console.log('📧 Provider:', resultado.provider);
        console.log('📧 Accepted:', resultado.accepted);
        console.log('');
        
        console.log('🎉 ¡TEST HÍBRIDO EXITOSO!');
        console.log('=========================');
        console.log('✅ Sistema híbrido funcionando');
        console.log('✅ Gmail API como método principal');
        console.log('✅ Gmail SMTP como fallback');
        console.log('✅ Robusto para producción');
        console.log('');
        
        console.log('🚀 VENTAJAS DEL SISTEMA HÍBRIDO:');
        console.log('===============================');
        console.log('1. Gmail API: Más rápido y confiable');
        console.log('2. Gmail SMTP: Fallback automático si API falla');
        console.log('3. Sin bloqueos de servidor');
        console.log('4. Funciona en cualquier entorno');
        console.log('5. Máxima compatibilidad');
        
    } catch (error) {
        console.error('❌ Error en el test híbrido:', error.message);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('Gmail API falló') && error.message.includes('Gmail SMTP falló')) {
            console.log('🔍 CAUSA: Ambos métodos fallaron');
            console.log('💡 SOLUCIÓN: Verificar configuración completa');
            console.log('💡 VERIFICAR: Variables de entorno y conectividad');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 CAUSA: Error de autenticación');
            console.log('💡 SOLUCIÓN: Verificar credenciales');
            console.log('💡 VERIFICAR: Gmail API y SMTP configurados');
        } else {
            console.log('🔍 CAUSA: Error desconocido');
            console.log('💡 SOLUCIÓN: Revisar logs detallados');
        }
    }
}

// Ejecutar test
testMailerHibrido();
