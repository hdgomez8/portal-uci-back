const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentEmployees, getVacationRequests, getContractEndings, getRotationData } = require('../controllers/dashboardController');

// Rutas del dashboard
router.get('/stats', getDashboardStats);
router.get('/recent-employees', getRecentEmployees);
router.get('/vacation-requests', getVacationRequests);
router.get('/contract-endings', getContractEndings);
router.get('/rotation-data', getRotationData);

module.exports = router; 