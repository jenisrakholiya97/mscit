const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, supplierController.getAllSuppliers);
router.post('/', verifyToken, verifyRole(['Admin', 'Store Manager']), supplierController.createSupplier);
router.put('/:id', verifyToken, verifyRole(['Admin', 'Store Manager']), supplierController.updateSupplier);
router.delete('/:id', verifyToken, verifyRole(['Admin']), supplierController.deleteSupplier);

module.exports = router;
