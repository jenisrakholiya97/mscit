const db = require('../config/db');

exports.getInventoryLogs = async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT l.*, p.name AS product_name, p.barcode, u.name AS user_name 
             FROM InventoryLogs l
             JOIN Products p ON l.product_id = p.id
             LEFT JOIN Users u ON l.user_id = u.id
             ORDER BY l.id DESC
             LIMIT 200`
        );
        return res.json({ success: true, count: logs.length, logs });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch inventory logs' });
    }
};

exports.adjustStock = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, action_type, quantity_change, notes } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!product_id || !action_type || quantity_change === undefined) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Product ID, Action Type, and Quantity Change are required' });
        }

        const [prod] = await connection.query('SELECT quantity, name FROM Products WHERE id = ?', [product_id]);
        if (prod.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const qtyDelta = parseInt(quantity_change, 10);
        const currentQty = prod[0].quantity;
        const newQty = currentQty + qtyDelta;

        if (newQty < 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Cannot adjust stock below 0. Current stock for '${prod[0].name}' is ${currentQty}.` 
            });
        }

        await connection.query('UPDATE Products SET quantity = ? WHERE id = ?', [newQty, product_id]);

        await connection.query(
            `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [product_id, userId, action_type, qtyDelta, notes || `Manual ${action_type}`]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: `Stock successfully updated for '${prod[0].name}'`,
            previous_stock: currentQty,
            new_stock: newQty
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error adjusting stock:', error);
        return res.status(500).json({ success: false, message: 'Stock adjustment failed' });
    } finally {
        connection.release();
    }
};
