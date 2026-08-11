const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, phone, created_at FROM Users ORDER BY id ASC');
        return res.json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
        }
        const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO Users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, role, phone || null]
        );
        return res.status(201).json({ success: true, userId: result.insertId, message: 'User created' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, name, phone } = req.body;
        await db.query(
            'UPDATE Users SET role = COALESCE(?, role), name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?',
            [role, name, phone, id]
        );
        return res.json({ success: true, message: 'User details updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id, 10) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in account' });
        }
        await db.query('DELETE FROM Users WHERE id = ?', [id]);
        return res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};
