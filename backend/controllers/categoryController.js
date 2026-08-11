const db = require('../config/db');

exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            `SELECT c.*, COUNT(p.id) AS product_count 
             FROM Categories c 
             LEFT JOIN Products p ON c.id = p.category_id 
             GROUP BY c.id 
             ORDER BY c.category_name ASC`
        );
        return res.json({ success: true, categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const [result] = await db.query(
            'INSERT INTO Categories (category_name, description) VALUES (?, ?)',
            [category_name, description || null]
        );
        return res.status(201).json({ success: true, categoryId: result.insertId, message: 'Category created' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create category' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;
        await db.query(
            'UPDATE Categories SET category_name = COALESCE(?, category_name), description = COALESCE(?, description) WHERE id = ?',
            [category_name, description, id]
        );
        return res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await db.query('DELETE FROM Categories WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};
