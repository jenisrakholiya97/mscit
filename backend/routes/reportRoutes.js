const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);
router.get('/data', verifyToken, reportController.getReportsData);

module.exports = router;
