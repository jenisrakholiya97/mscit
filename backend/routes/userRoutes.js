const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Permissions routes
router.get('/permissions', verifyToken, userController.getRolePermissions);
router.put('/permissions', verifyToken, verifyRole(['Owner', 'Admin']), userController.updateRolePermissions);

// Individual User Permissions route
router.put('/:id/user-permissions', verifyToken, verifyRole(['Owner', 'Admin']), userController.updateUserPermissions);

// User CRUD routes (Accessible by Owner & Manager)
router.get('/', verifyToken, verifyRole(['Owner', 'Admin', 'Manager', 'Store Manager']), userController.getAllUsers);
router.post('/', verifyToken, verifyRole(['Owner', 'Admin', 'Manager', 'Store Manager']), userController.createUser);
router.put('/:id', verifyToken, verifyRole(['Owner', 'Admin', 'Manager', 'Store Manager']), userController.updateUserRole);
router.delete('/:id', verifyToken, verifyRole(['Owner', 'Admin', 'Manager', 'Store Manager']), userController.deleteUser);

module.exports = router;
