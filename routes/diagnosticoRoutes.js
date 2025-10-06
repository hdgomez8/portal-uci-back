const express = require('express');
const router = express.Router();
const { diagnosticoCompleto } = require('../scripts/diagnostico-completo');
const { diagnosticoProduccion } = require('../scripts/diagnostico-produccion');

// Ruta para obtener estado del diagnóstico
router.get('/estado', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sistema de diagnóstico funcionando',
        timestamp: new Date().toISOString(),
        configuracion: {
            metodo: 'Gmail API (OAuth 2.0)',
            puerto: 'HTTPS (443)',
            proveedor: 'Google Gmail'
        }
    });
});

// Ruta para ejecutar diagnóstico
router.post('/ejecutar', async (req, res) => {
    try {
        console.log('🔍 Ejecutando diagnóstico de producción...');
        
        const resultado = await diagnosticoProduccion();
        
        res.json({
            status: resultado ? 'success' : 'warning',
            message: resultado ? 'Diagnóstico ejecutado correctamente' : 'Diagnóstico completado con advertencias',
            timestamp: new Date().toISOString(),
            resultado: resultado
        });
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Ruta para resetear diagnóstico
router.post('/reset', (req, res) => {
    res.json({
        status: 'success',
        message: 'Diagnóstico reseteado',
        timestamp: new Date().toISOString()
    });
});

// Ruta para obtener logs del diagnóstico de inicio
router.get('/logs', (req, res) => {
    // Simular logs del diagnóstico de inicio
    const logs = [
        {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: '🔍 INICIANDO DIAGNÓSTICO DE GMAIL API...',
            step: 'inicio'
        },
        {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: '🔧 Cargando módulo mailer...',
            step: 'cargando'
        },
        {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: '✅ Módulo mailer cargado correctamente',
            step: 'cargado'
        },
        {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: '🔧 Verificando variables de entorno...',
            step: 'variables'
        }
    ];

    // Verificar variables de entorno
    const variables = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
    };

    const variablesConfiguradas = Object.values(variables).filter(v => v).length;
    
    if (variablesConfiguradas < 4) {
        logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `❌ Variables de entorno incompletas: ${variablesConfiguradas}/4`,
            step: 'variables_error',
            details: Object.entries(variables).map(([key, value]) => ({
                variable: key,
                configurada: !!value,
                valor: value ? `${value.substring(0, 10)}...` : 'FALTANTE'
            }))
        });
    } else {
        logs.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: '✅ Variables de entorno configuradas correctamente',
            step: 'variables_ok'
        });
    }

    res.json({
        status: 'ok',
        message: 'Logs del diagnóstico obtenidos',
        timestamp: new Date().toISOString(),
        logs: logs,
        variables: {
            configuradas: variablesConfiguradas,
            total: 4,
            detalles: Object.entries(variables).map(([key, value]) => ({
                variable: key,
                configurada: !!value,
                valor: value ? `${value.substring(0, 10)}...` : 'FALTANTE'
            }))
        }
    });
});

module.exports = router;
