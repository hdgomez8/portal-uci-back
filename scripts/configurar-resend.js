#!/usr/bin/env node

/**
 * Configuración de Resend - Portal UCI
 * Script para configurar y probar Resend como API principal
 */

const https = require('https');

/**
 * Enviar correo usando Resend
 */
async function enviarCorreoResend(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    // La API Key se puede configurar aquí temporalmente para pruebas
    const apiKey = process.env.RESEND_API_KEY || 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
    
    console.log('📧 Configurando Resend...');
    console.log('📧 API Key:', apiKey.substring(0, 10) + '...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    const data = JSON.stringify({
        from: `Portal UCI <${fromEmail}>`,
        to: [destinatario],
        subject: asunto,
        html: contenido
    });
    
    console.log('📧 Datos JSON:', data);
    
    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const response = JSON.parse(responseData);
                    console.log('✅ Correo enviado exitosamente con Resend');
                    console.log('📧 Message ID:', response.id);
                    resolve({
                        exito: true,
                        messageId: response.id,
                        proveedor: 'Resend',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    console.log('❌ Error de Resend:', res.statusCode);
                    console.log('📧 Respuesta:', responseData);
                    reject(new Error(`Resend Error: ${res.statusCode} - ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Error de conexión:', error.message);
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

/**
 * Probar Resend con diferentes configuraciones
 */
async function probarResend() {
    console.log('🧪 CONFIGURACIÓN Y PRUEBA DE RESEND');
    console.log('===================================');
    console.log('');
    
    const testEmail = 'hdgomez0@gmail.com';
    const testAsunto = '🚀 Test Resend - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🚀 Test de Resend</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> Resend</p>
                <p><strong>Estado:</strong> Configuración y prueba</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>✅ Resend funcionando</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema de notificaciones con Resend está operativo.</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3; margin-top: 20px;">
                <p style="margin: 0; color: #1565c0;"><strong>📋 Próximos pasos:</strong></p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">1. Configurar API Key en variables de entorno</p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">2. Integrar en controladores</p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">3. Probar en producción</p>
            </div>
        </div>
    `;
    
    try {
        console.log('1️⃣ Verificando configuración...');
        console.log('   API Key configurada:', process.env.RESEND_API_KEY ? 'Sí' : 'No');
        console.log('   Usando API Key de prueba:', process.env.RESEND_API_KEY ? 'No' : 'Sí');
        console.log('');
        
        console.log('2️⃣ Enviando correo de prueba...');
        const resultado = await enviarCorreoResend(testEmail, testAsunto, testContenido);
        
        console.log('');
        console.log('📋 RESULTADO DEL TEST');
        console.log('====================');
        console.log('✅ Estado: EXITOSO');
        console.log('📧 API: Resend');
        console.log('📧 Message ID:', resultado.messageId);
        console.log('📧 Destinatario:', resultado.destinatario);
        console.log('📧 Status Code:', resultado.statusCode);
        console.log('');
        
        console.log('🎉 RESEND CONFIGURADO EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar la entrega');
        console.log('');
        
        console.log('💡 PRÓXIMOS PASOS:');
        console.log('   1. Crear cuenta en resend.com');
        console.log('   2. Obtener API Key real');
        console.log('   3. Configurar variable de entorno:');
        console.log('      export RESEND_API_KEY="re_tu-api-key-real"');
        console.log('   4. Integrar en controladores del Portal UCI');
        
    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN LA CONFIGURACIÓN');
        console.log('============================');
        console.log('Error:', error.message);
        console.log('');
        
        console.log('🔧 SOLUCIONES:');
        console.log('   1. Verificar que la API Key sea correcta');
        console.log('   2. Crear cuenta en resend.com si no la tienes');
        console.log('   3. Verificar conectividad de red');
        console.log('   4. Revisar la documentación de Resend');
        console.log('');
        
        console.log('📚 DOCUMENTACIÓN:');
        console.log('   - https://resend.com/docs');
        console.log('   - https://resend.com/docs/api-reference');
    }
}

// Ejecutar configuración
probarResend();
