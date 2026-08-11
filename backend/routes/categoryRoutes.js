const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, categoryController.getAllCategories);
router.post('/', verifyToken, verifyRole(['Admin', 'Store Manager']), categoryController.createCategory);
router.put('/:id', verifyToken, verifyRole(['Admin', 'Store Manager']), categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyRole(['Admin']), categoryController.deleteCategory);

module.exports = router;
