const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, salesController.getAllSales);
router.get('/:id', verifyToken, salesController.getSaleById);
router.post('/', verifyToken, salesController.createSale);

module.exports = router;
