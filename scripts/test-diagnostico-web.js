#!/usr/bin/env node

/**
 * Test del Sistema de Diagnóstico Web
 * Prueba las APIs de diagnóstico en tiempo real
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5555';

async function testDiagnosticoWeb() {
    console.log('🧪 TEST DEL SISTEMA DE DIAGNÓSTICO WEB');
    console.log('=====================================');
    console.log('');

    try {
        // 1. Verificar que el servidor está corriendo
        console.log('1️⃣ Verificando servidor...');
        try {
            const response = await axios.get(`${BASE_URL}/api/diagnostico/estado`);
            console.log('✅ Servidor respondiendo');
            console.log('   Estado actual:', response.data.ejecutando ? 'Ejecutando' : 'Inactivo');
        } catch (error) {
            console.log('❌ Servidor no disponible:', error.message);
            console.log('💡 Asegúrate de que el servidor esté corriendo en el puerto 5555');
            return;
        }
        console.log('');

        // 2. Resetear estado
        console.log('2️⃣ Reseteando estado...');
        try {
            const response = await axios.post(`${BASE_URL}/api/diagnostico/reset`);
            console.log('✅ Estado reseteado:', response.data.mensaje);
        } catch (error) {
            console.log('❌ Error reseteando estado:', error.message);
        }
        console.log('');

        // 3. Ejecutar diagnóstico
        console.log('3️⃣ Ejecutando diagnóstico...');
        try {
            const response = await axios.post(`${BASE_URL}/api/diagnostico/ejecutar`);
            console.log('✅ Diagnóstico iniciado:', response.data.mensaje);
        } catch (error) {
            console.log('❌ Error ejecutando diagnóstico:', error.message);
            return;
        }
        console.log('');

        // 4. Monitorear progreso
        console.log('4️⃣ Monitoreando progreso...');
        let pasosCompletados = 0;
        let totalPasos = 6;
        let ejecutando = true;
        let intentos = 0;
        const maxIntentos = 30; // 30 segundos máximo

        while (ejecutando && intentos < maxIntentos) {
            try {
                const response = await axios.get(`${BASE_URL}/api/diagnostico/estado`);
                const data = response.data;
                
                const nuevosPasosCompletados = data.pasos.filter(p => p.estado === 'completado').length;
                
                if (nuevosPasosCompletados > pasosCompletados) {
                    console.log(`   📈 Progreso: ${nuevosPasosCompletados}/${totalPasos} pasos completados`);
                    
                    // Mostrar los nuevos pasos
                    const nuevosPasos = data.pasos.slice(pasosCompletados);
                    nuevosPasos.forEach(paso => {
                        const icono = paso.estado === 'completado' ? '✅' : 
                                     paso.estado === 'error' ? '❌' : 
                                     paso.estado === 'ejecutando' ? '⏳' : '⏸️';
                        console.log(`      ${icono} [${paso.categoria.toUpperCase()}] ${paso.mensaje}`);
                    });
                    
                    pasosCompletados = nuevosPasosCompletados;
                }
                
                ejecutando = data.ejecutando;
                
                if (data.error) {
                    console.log('❌ Error en diagnóstico:', data.error);
                    break;
                }
                
                if (data.resultado === 'exitoso') {
                    console.log('🎉 Diagnóstico completado exitosamente');
                    break;
                }
                
                if (data.resultado === 'error') {
                    console.log('❌ Diagnóstico falló');
                    break;
                }
                
                // Esperar 1 segundo antes del siguiente check
                await new Promise(resolve => setTimeout(resolve, 1000));
                intentos++;
                
            } catch (error) {
                console.log('❌ Error monitoreando progreso:', error.message);
                break;
            }
        }
        
        if (intentos >= maxIntentos) {
            console.log('⏰ Timeout: El diagnóstico tardó demasiado');
        }
        console.log('');

        // 5. Mostrar estado final
        console.log('5️⃣ Estado final:');
        try {
            const response = await axios.get(`${BASE_URL}/api/diagnostico/estado`);
            const data = response.data;
            
            console.log('   Estado:', data.ejecutando ? 'Ejecutando' : (data.resultado === 'exitoso' ? 'Completado' : (data.resultado === 'error' ? 'Error' : 'Inactivo')));
            console.log('   Pasos completados:', data.pasos.filter(p => p.estado === 'completado').length);
            console.log('   Total de pasos:', data.pasos.length);
            console.log('   Timestamp:', data.timestamp);
            
            if (data.error) {
                console.log('   Error:', data.error);
            }
            
        } catch (error) {
            console.log('❌ Error obteniendo estado final:', error.message);
        }
        console.log('');

        // 6. Información de acceso web
        console.log('6️⃣ Acceso Web:');
        console.log('   🌐 Página de monitoreo: http://localhost:5555/public/diagnostico.html');
        console.log('   📊 API de estado: http://localhost:5555/api/diagnostico/estado');
        console.log('   🚀 API de ejecución: http://localhost:5555/api/diagnostico/ejecutar');
        console.log('   🔄 API de reset: http://localhost:5555/api/diagnostico/reset');
        console.log('');

        console.log('✅ TEST COMPLETADO');
        console.log('💡 Abre http://localhost:5555/public/diagnostico.html en tu navegador para monitorear en tiempo real');

    } catch (error) {
        console.log('❌ ERROR EN TEST:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Ejecutar test
testDiagnosticoWeb();
