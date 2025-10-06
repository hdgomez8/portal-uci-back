#!/usr/bin/env node

/**
 * Diagnóstico de Correos en PRODUCCIÓN - Portal UCI
 * Verifica conectividad, configuración y envío de correos
 */

const { probarSistemaProduccion } = require('../utils/mailerProduccion');
const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns').promises;

async function diagnosticoProduccion() {
    console.log('🔍 DIAGNÓSTICO DE CORREOS EN PRODUCCIÓN');
    console.log('========================================');
    console.log('');

    try {
        // 1. Información del sistema
        console.log('1️⃣ Información del Sistema');
        console.log('----------------------------');
        const infoSistema = {
            hostname: require('os').hostname(),
            plataforma: require('os').platform(),
            version: require('os').release(),
            nodejs: process.version,
            memoriaTotal: Math.round(require('os').totalmem() / 1024 / 1024 / 1024),
            memoriaLibre: Math.round(require('os').freemem() / 1024 / 1024 / 1024),
            uptime: Math.round(require('os').uptime() / 3600)
        };
        
        console.log(`   Hostname: ${infoSistema.hostname}`);
        console.log(`   Plataforma: ${infoSistema.plataforma} ${infoSistema.version}`);
        console.log(`   Node.js: ${infoSistema.nodejs}`);
        console.log(`   Memoria: ${infoSistema.memoriaLibre} GB libre de ${infoSistema.memoriaTotal} GB`);
        console.log(`   Uptime: ${infoSistema.uptime} horas`);
        console.log('');

        // 2. Verificar conectividad de red
        console.log('2️⃣ Verificando Conectividad de Red');
        console.log('-----------------------------------');
        
        // Verificar DNS de Gmail
        try {
            const dnsResult = await dns.lookup('smtp.gmail.com');
            console.log(`   ✅ DNS Gmail resuelto: ${dnsResult.address}`);
        } catch (dnsError) {
            console.log(`   ❌ Error DNS Gmail: ${dnsError.message}`);
        }
        
        // Verificar puerto 587 (TLS)
        try {
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    console.log('   ✅ Puerto 587 (TLS) accesible');
                    socket.destroy();
                    resolve();
                });
                
                socket.on('timeout', () => {
                    console.log('   ❌ Timeout puerto 587');
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                
                socket.on('error', (error) => {
                    console.log(`   ❌ Error puerto 587: ${error.message}`);
                    socket.destroy();
                    reject(error);
                });
                
                socket.connect(587, 'smtp.gmail.com');
            });
        } catch (error) {
            console.log(`   ❌ No se puede conectar al puerto 587: ${error.message}`);
        }
        
        // Verificar puerto 465 (SSL)
        try {
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    console.log('   ✅ Puerto 465 (SSL) accesible');
                    socket.destroy();
                    resolve();
                });
                
                socket.on('timeout', () => {
                    console.log('   ❌ Timeout puerto 465');
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                
                socket.on('error', (error) => {
                    console.log(`   ❌ Error puerto 465: ${error.message}`);
                    socket.destroy();
                    reject(error);
                });
                
                socket.connect(465, 'smtp.gmail.com');
            });
        } catch (error) {
            console.log(`   ❌ No se puede conectar al puerto 465: ${error.message}`);
        }
        console.log('');

        // 3. Verificar configuración de Gmail
        console.log('3️⃣ Verificando Configuración de Gmail');
        console.log('-------------------------------------');
        
        const configuraciones = [
            {
                nombre: 'Gmail SMTP (Puerto 587)',
                config: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'hdgomez0@gmail.com',
                        pass: 'wlstvjdckvhzxwvo'
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                }
            },
            {
                nombre: 'Gmail SMTP (Puerto 465)',
                config: {
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'hdgomez0@gmail.com',
                        pass: 'wlstvjdckvhzxwvo'
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                }
            }
        ];
        
        for (const config of configuraciones) {
            console.log(`   Probando: ${config.nombre}`);
            try {
                const transporter = nodemailer.createTransport(config.config);
                await transporter.verify();
                console.log(`   ✅ ${config.nombre}: Conexión exitosa`);
            } catch (error) {
                console.log(`   ❌ ${config.nombre}: ${error.message}`);
            }
        }
        console.log('');

        // 4. Probar envío de correos
        console.log('4️⃣ Probando Envío de Correos');
        console.log('-------------------------------');
        
        const resultados = await probarSistemaProduccion();
        
        console.log('   Resultados del envío:');
        resultados.forEach((resultado, index) => {
            if (resultado.exito) {
                console.log(`   ✅ ${index + 1}. ${resultado.destinatario}: ${resultado.messageId}`);
                console.log(`      Proveedor: ${resultado.proveedor}`);
            } else {
                console.log(`   ❌ ${index + 1}. ${resultado.destinatario}: ${resultado.error}`);
            }
        });
        console.log('');

        // 5. Resumen y recomendaciones
        console.log('5️⃣ Resumen y Recomendaciones');
        console.log('-------------------------------');
        
        const exitosos = resultados.filter(r => r.exito).length;
        const total = resultados.length;
        
        if (exitosos === total) {
            console.log('   ✅ TODOS LOS TESTS EXITOSOS');
            console.log('   🎉 El sistema de correos está funcionando correctamente en producción');
        } else if (exitosos > 0) {
            console.log(`   ⚠️ PARCIALMENTE FUNCIONAL (${exitosos}/${total})`);
            console.log('   🔧 Algunos proveedores funcionan, otros no');
        } else {
            console.log('   ❌ TODOS LOS TESTS FALLARON');
            console.log('   🚨 El sistema de correos no está funcionando en producción');
        }
        
        console.log('');
        console.log('💡 RECOMENDACIONES PARA PRODUCCIÓN:');
        console.log('   1. Verificar que el servidor tenga acceso a internet');
        console.log('   2. Verificar que los puertos 587 y 465 estén abiertos');
        console.log('   3. Verificar que Gmail permita el acceso desde el servidor');
        console.log('   4. Considerar usar un servicio de correo profesional (SendGrid, Mailgun)');
        console.log('   5. Configurar variables de entorno para las credenciales');
        console.log('   6. Implementar logging para monitorear el envío de correos');
        
    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL DIAGNÓSTICO');
        console.log('==========================');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('   1. Verificar conectividad de red del servidor');
        console.log('   2. Verificar configuración de firewall');
        console.log('   3. Verificar credenciales de Gmail');
        console.log('   4. Considerar usar un servicio de correo alternativo');
    }
}

// Ejecutar diagnóstico
diagnosticoProduccion();
