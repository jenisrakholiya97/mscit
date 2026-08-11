const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/forecast', verifyToken, aiController.getAIDemandForecast);
router.get('/anomalies', verifyToken, aiController.getAnomalies);

module.exports = router;
