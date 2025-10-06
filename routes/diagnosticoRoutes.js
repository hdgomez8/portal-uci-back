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

module.exports = router;
