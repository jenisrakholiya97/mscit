const db = require('../config/db');
const { getOwnerId } = require('../utils/authUtils');

exports.getAllCategories = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT c.*, COUNT(p.id) AS product_count 
             FROM Categories c 
             LEFT JOIN Products p ON c.id = p.category_id`;
        const params = [];

        if (ownerId) {
            sql += ` WHERE (c.owner_id = ? OR c.owner_id IS NULL)`;
            params.push(ownerId);
        }

        sql += ` GROUP BY c.id ORDER BY c.category_name ASC`;
        const [categories] = await db.query(sql, params);
        return res.json({ success: true, categories });
    } catch (error) {
        console.error('getAllCategories error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        const ownerId = getOwnerId(req.user);
        if (!category_name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const [result] = await db.query(
            'INSERT INTO Categories (category_name, description, owner_id) VALUES (?, ?, ?)',
            [category_name, description || null, ownerId]
        );
        return res.status(201).json({ success: true, categoryId: result.insertId, message: 'Category created' });
    } catch (error) {
        console.error('createCategory error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create category' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;
        const ownerId = getOwnerId(req.user);

        let sql = 'UPDATE Categories SET category_name = COALESCE(?, category_name), description = COALESCE(?, description), owner_id = COALESCE(owner_id, ?) WHERE id = ?';
        const params = [category_name, description, ownerId, id];
        if (ownerId) {
            sql += ' AND (owner_id = ? OR owner_id IS NULL)';
            params.push(ownerId);
        }

        await db.query(sql, params);
        return res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = 'DELETE FROM Categories WHERE id = ?';
        const params = [req.params.id];
        if (ownerId) {
            sql += ' AND (owner_id = ? OR owner_id IS NULL)';
            params.push(ownerId);
        }

        await db.query(sql, params);
        return res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};
