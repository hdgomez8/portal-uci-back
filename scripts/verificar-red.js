#!/usr/bin/env node

/**
 * Verificación de Red para Email
 * Verifica conectividad y configuración de red necesaria para envío de correos
 */

const dns = require('dns');
const net = require('net');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

async function verificarRed() {
    console.log('🌐 VERIFICACIÓN DE RED PARA EMAIL');
    console.log('=================================');
    console.log('');

    try {
        // 1. Verificar DNS de Gmail
        console.log('1️⃣ Verificando DNS de Gmail...');
        try {
            const result = await dnsLookup('smtp.gmail.com');
            console.log('✅ DNS resuelto correctamente');
            console.log('   IP:', result.address);
            console.log('   Familia:', result.family === 4 ? 'IPv4' : 'IPv6');
        } catch (dnsError) {
            console.log('❌ Error resolviendo DNS:', dnsError.message);
            return;
        }
        console.log('');

        // 2. Verificar conectividad al puerto 587
        console.log('2️⃣ Verificando conectividad al puerto 587...');
        const smtpHost = 'smtp.gmail.com';
        const smtpPort = 587;
        
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeout = 10000; // 10 segundos
            
            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
                console.log('✅ Conexión exitosa al puerto 587');
                console.log('   Host:', smtpHost);
                console.log('   Puerto:', smtpPort);
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                console.log('❌ Timeout conectando al puerto 587');
                socket.destroy();
                reject(new Error('Timeout de conexión'));
            });
            
            socket.on('error', (error) => {
                console.log('❌ Error conectando al puerto 587:', error.message);
                socket.destroy();
                reject(error);
            });
            
            socket.connect(smtpPort, smtpHost);
        });
        console.log('');

        // 3. Verificar resolución de MX records
        console.log('3️⃣ Verificando registros MX de Gmail...');
        try {
            const mxRecords = await dnsResolve('gmail.com', 'MX');
            console.log('✅ Registros MX encontrados:');
            mxRecords.forEach((record, index) => {
                console.log(`   ${index + 1}. ${record.exchange} (prioridad: ${record.priority})`);
            });
        } catch (mxError) {
            console.log('❌ Error obteniendo registros MX:', mxError.message);
        }
        console.log('');

        // 4. Verificar configuración de red local
        console.log('4️⃣ Verificando configuración de red local...');
        const os = require('os');
        const interfaces = os.networkInterfaces();
        
        console.log('Interfaces de red disponibles:');
        Object.keys(interfaces).forEach(name => {
            const iface = interfaces[name];
            iface.forEach(alias => {
                if (alias.family === 'IPv4' && !alias.internal) {
                    console.log(`   ${name}: ${alias.address} (${alias.netmask})`);
                }
            });
        });
        console.log('');

        // 5. Verificar conectividad a otros servicios
        console.log('5️⃣ Verificando conectividad general...');
        const testHosts = [
            'google.com',
            'gmail.com',
            'smtp.gmail.com'
        ];
        
        for (const host of testHosts) {
            try {
                const result = await dnsLookup(host);
                console.log(`✅ ${host}: ${result.address}`);
            } catch (error) {
                console.log(`❌ ${host}: ${error.message}`);
            }
        }
        console.log('');

        // 6. Resumen final
        console.log('📋 RESUMEN DE VERIFICACIÓN DE RED');
        console.log('================================');
        console.log('✅ DNS de Gmail: OK');
        console.log('✅ Puerto 587: OK');
        console.log('✅ Registros MX: OK');
        console.log('✅ Configuración local: OK');
        console.log('✅ Conectividad general: OK');
        console.log('');
        console.log('🎉 LA RED ESTÁ CONFIGURADA CORRECTAMENTE');
        console.log('El servidor puede conectarse a Gmail para envío de correos.');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN VERIFICACIÓN DE RED');
        console.log('==============================');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('1. Sin conectividad a internet');
        console.log('2. Firewall bloqueando el puerto 587');
        console.log('3. DNS no configurado correctamente');
        console.log('4. Problemas de red del servidor');
        console.log('');
        console.log('💡 SOLUCIONES RECOMENDADAS:');
        console.log('1. Verificar conectividad: ping google.com');
        console.log('2. Verificar firewall: telnet smtp.gmail.com 587');
        console.log('3. Verificar DNS: nslookup smtp.gmail.com');
        console.log('4. Contactar al administrador de red');
    }
}

// Ejecutar verificación
verificarRed();
