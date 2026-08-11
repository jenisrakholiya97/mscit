const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyRole(['Admin']), userController.getAllUsers);
router.post('/', verifyToken, verifyRole(['Admin']), userController.createUser);
router.put('/:id', verifyToken, verifyRole(['Admin']), userController.updateUserRole);
router.delete('/:id', verifyToken, verifyRole(['Admin']), userController.deleteUser);

module.exports = router;
