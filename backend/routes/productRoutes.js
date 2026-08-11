const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, productController.getAllProducts);
router.get('/low-stock', verifyToken, productController.getLowStock);
router.get('/near-expiry', verifyToken, productController.getNearExpiry);
router.get('/:id', verifyToken, productController.getProductById);

router.post('/', verifyToken, verifyRole(['Admin', 'Store Manager']), productController.createProduct);
router.put('/:id', verifyToken, verifyRole(['Admin', 'Store Manager']), productController.updateProduct);
router.delete('/:id', verifyToken, verifyRole(['Admin']), productController.deleteProduct);

module.exports = router;
