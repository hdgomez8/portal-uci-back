#!/usr/bin/env node

/**
 * Test Simple de Resend - Portal UCI
 * Prueba básica con la API de Resend
 */

const https = require('https');

async function testResendSimple() {
    console.log('🧪 TEST SIMPLE DE RESEND');
    console.log('========================');
    console.log('');
    
    const apiKey = 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
    const destinatario = 'hdgomez0@gmail.com';
    
    // Datos más simples para la prueba
    const data = JSON.stringify({
        from: 'Portal UCI <noreply@resend.dev>', // Usar dominio de Resend
        to: [destinatario],
        subject: 'Test Simple Resend',
        html: '<h1>Test Simple</h1><p>Este es un test simple de Resend.</p>'
    });
    
    console.log('📧 API Key:', apiKey.substring(0, 10) + '...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 From:', 'Portal UCI <noreply@resend.dev>');
    console.log('📧 Datos:', data);
    console.log('');
    
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
        console.log('📧 Enviando solicitud a Resend...');
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            console.log('📧 Status Code:', res.statusCode);
            console.log('📧 Headers:', res.headers);
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log('📧 Respuesta completa:', responseData);
                
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const response = JSON.parse(responseData);
                    console.log('✅ ÉXITO');
                    console.log('📧 Message ID:', response.id);
                    resolve(response);
                } else {
                    console.log('❌ ERROR');
                    console.log('📧 Status:', res.statusCode);
                    console.log('📧 Respuesta:', responseData);
                    reject(new Error(`Error ${res.statusCode}: ${responseData}`));
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

// Ejecutar test
testResendSimple()
    .then(result => {
        console.log('');
        console.log('🎉 TEST COMPLETADO EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar la entrega');
    })
    .catch(error => {
        console.log('');
        console.log('❌ TEST FALLÓ');
        console.log('Error:', error.message);
        console.log('');
        console.log('💡 POSIBLES SOLUCIONES:');
        console.log('   1. Verificar que la API Key sea correcta');
        console.log('   2. Verificar que el email esté verificado en Resend');
        console.log('   3. Usar un dominio verificado');
        console.log('   4. Revisar la documentación de Resend');
    });
