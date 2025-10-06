#!/usr/bin/env node

/**
 * Script para comparar diferentes métodos de Gmail
 * 1. Gmail Simple (SMTP)
 * 2. Gmail API (si está disponible)
 */

const { sendMail: sendMailSimple } = require('../utils/mailerGmailSimple');
const { sendMail: sendMailAPI } = require('../utils/mailerGmailAPI');

async function compararMetodosGmail() {
    console.log('🧪 COMPARANDO MÉTODOS DE GMAIL');
    console.log('==============================');
    console.log('');

    const testEmail = 'hdgomez0@gmail.com';
    const testSubject = '🧪 Comparación de Métodos Gmail';
    const testHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🧪 Comparación de Métodos Gmail</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                <p><strong>Node.js:</strong> ${process.version}</p>
                <p><strong>Test:</strong> Comparación de métodos Gmail</p>
            </div>
        </div>
    `;

    const resultados = [];

    // Test 1: Gmail Simple (SMTP)
    console.log('📧 TEST 1: GMAIL SIMPLE (SMTP)');
    console.log('================================');
    try {
        const resultado1 = await sendMailSimple(testEmail, `${testSubject} - SMTP`, testHTML);
        console.log('✅ Gmail Simple (SMTP): EXITOSO');
        console.log('📧 Message ID:', resultado1.messageId);
        console.log('📧 Provider:', resultado1.provider);
        resultados.push({
            metodo: 'Gmail Simple (SMTP)',
            estado: 'EXITOSO',
            messageId: resultado1.messageId,
            provider: resultado1.provider
        });
    } catch (error) {
        console.log('❌ Gmail Simple (SMTP): FALLÓ');
        console.log('❌ Error:', error.message);
        resultados.push({
            metodo: 'Gmail Simple (SMTP)',
            estado: 'FALLÓ',
            error: error.message
        });
    }
    console.log('');

    // Test 2: Gmail API (si está disponible)
    console.log('📧 TEST 2: GMAIL API');
    console.log('===================');
    try {
        if (!process.env.GOOGLE_REFRESH_TOKEN) {
            console.log('⚠️ Gmail API: NO CONFIGURADO');
            console.log('⚠️ GOOGLE_REFRESH_TOKEN no está configurado');
            resultados.push({
                metodo: 'Gmail API',
                estado: 'NO CONFIGURADO',
                error: 'GOOGLE_REFRESH_TOKEN no configurado'
            });
        } else {
            const resultado2 = await sendMailAPI(testEmail, `${testSubject} - API`, testHTML);
            console.log('✅ Gmail API: EXITOSO');
            console.log('📧 Message ID:', resultado2.messageId);
            console.log('📧 Provider:', resultado2.provider);
            resultados.push({
                metodo: 'Gmail API',
                estado: 'EXITOSO',
                messageId: resultado2.messageId,
                provider: resultado2.provider
            });
        }
    } catch (error) {
        console.log('❌ Gmail API: FALLÓ');
        console.log('❌ Error:', error.message);
        resultados.push({
            metodo: 'Gmail API',
            estado: 'FALLÓ',
            error: error.message
        });
    }
    console.log('');

    // Resumen de resultados
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('========================');
    console.log('');
    
    resultados.forEach((resultado, index) => {
        console.log(`${index + 1}. ${resultado.metodo}:`);
        console.log(`   Estado: ${resultado.estado}`);
        if (resultado.estado === 'EXITOSO') {
            console.log(`   Message ID: ${resultado.messageId}`);
            console.log(`   Provider: ${resultado.provider}`);
        } else if (resultado.estado === 'FALLÓ') {
            console.log(`   Error: ${resultado.error}`);
        } else if (resultado.estado === 'NO CONFIGURADO') {
            console.log(`   Razón: ${resultado.error}`);
        }
        console.log('');
    });

    // Recomendación
    const exitosos = resultados.filter(r => r.estado === 'EXITOSO');
    const fallidos = resultados.filter(r => r.estado === 'FALLÓ');
    const noConfigurados = resultados.filter(r => r.estado === 'NO CONFIGURADO');

    console.log('🎯 RECOMENDACIÓN:');
    console.log('================');
    
    if (exitosos.length > 0) {
        console.log(`✅ ${exitosos.length} método(s) funcionando correctamente`);
        console.log(`📧 Método recomendado: ${exitosos[0].metodo}`);
        console.log(`🔧 Provider: ${exitosos[0].provider}`);
        console.log('');
        console.log('🚀 PRÓXIMO PASO:');
        console.log('Usar el método recomendado en tu aplicación');
    } else {
        console.log('❌ Ningún método funcionando correctamente');
        console.log('');
        console.log('🔧 SOLUCIONES:');
        if (noConfigurados.length > 0) {
            console.log('1. Configurar Gmail API con refresh token');
        }
        if (fallidos.length > 0) {
            console.log('2. Verificar configuración de Gmail Simple');
            console.log('3. Verificar que el servidor no esté bloqueando SMTP');
        }
    }
}

// Ejecutar comparación
compararMetodosGmail();
