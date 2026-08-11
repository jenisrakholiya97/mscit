const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// Map legacy role names to hierarchy
const normalizeRole = (role) => {
    if (!role) return 'Staff';
    if (role === 'Admin' || role === 'Owner') return 'Owner';
    if (role === 'Store Manager' || role === 'Manager') return 'Manager';
    return 'Staff';
};

const verifyRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const userRole = normalizeRole(req.user.role);
        const normalizedAllowed = allowedRoles.map(normalizeRole);

        // Owners have access to all routes
        if (userRole === 'Owner' || normalizedAllowed.includes(userRole) || allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            message: `Forbidden. Role '${req.user.role}' lacks necessary permissions.` 
        });
    };
};

const verifyPermission = (permissionKey) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userRole = normalizeRole(req.user.role);
        if (userRole === 'Owner') {
            return next();
        }

        try {
            // 1. Check user-specific permissions first
            const [userRows] = await db.query('SELECT permissions FROM Users WHERE id = ?', [req.user.id]);
            if (userRows.length > 0 && userRows[0].permissions !== null) {
                const userPerms = typeof userRows[0].permissions === 'string' ? JSON.parse(userRows[0].permissions) : userRows[0].permissions;
                if (userPerms && userPerms[permissionKey] !== undefined) {
                    if (userPerms[permissionKey]) {
                        return next();
                    } else {
                        return res.status(403).json({
                            success: false,
                            message: `Forbidden. Individual permission '${permissionKey}' is disabled for your account.`
                        });
                    }
                }
            }

            // 2. Fallback to RolePermissions matrix
            const [rows] = await db.query('SELECT permissions FROM RolePermissions WHERE role = ?', [userRole]);
            if (rows.length > 0) {
                const permissions = typeof rows[0].permissions === 'string' ? JSON.parse(rows[0].permissions) : rows[0].permissions;
                if (permissions && permissions[permissionKey]) {
                    return next();
                }
            }
            return res.status(403).json({
                success: false,
                message: `Forbidden. Permission '${permissionKey}' is disabled for role '${req.user.role}'.`
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Error checking permissions' });
        }
    };
};

module.exports = { verifyToken, verifyRole, verifyPermission, normalizeRole, JWT_SECRET };
