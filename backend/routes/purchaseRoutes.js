const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, purchaseController.getAllPurchases);
router.post('/', verifyToken, verifyRole(['Admin', 'Store Manager']), purchaseController.createPurchase);

module.exports = router;
