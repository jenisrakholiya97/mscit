const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/logs', verifyToken, inventoryController.getInventoryLogs);
router.post('/adjust', verifyToken, verifyRole(['Admin', 'Store Manager', 'Employee']), inventoryController.adjustStock);

module.exports = router;
