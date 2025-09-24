const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/PerfilController');

router.use('/', perfilController);

module.exports = router; 