const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.query(
            `SELECT s.*, COUNT(p.id) AS product_count 
             FROM Suppliers s 
             LEFT JOIN Products p ON s.id = p.supplier_id 
             GROUP BY s.id 
             ORDER BY s.name ASC`
        );
        return res.json({ success: true, suppliers });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }
        const [result] = await db.query(
            'INSERT INTO Suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [name, phone, email || null, address || null]
        );
        return res.status(201).json({ success: true, supplierId: result.insertId, message: 'Supplier added' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create supplier' });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        await db.query(
            'UPDATE Suppliers SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email), address = COALESCE(?, address) WHERE id = ?',
            [name, phone, email, address, id]
        );
        return res.json({ success: true, message: 'Supplier updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update supplier' });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        await db.query('DELETE FROM Suppliers WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete supplier' });
    }
};
