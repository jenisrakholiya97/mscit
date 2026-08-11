const db = require('../config/db');
const { getOwnerId } = require('../utils/authUtils');

exports.getInventoryLogs = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT l.*, p.name AS product_name, p.barcode, u.name AS user_name 
             FROM InventoryLogs l
             JOIN Products p ON l.product_id = p.id
             LEFT JOIN Users u ON l.user_id = u.id`;
        const params = [];

        if (ownerId) {
            sql += ` WHERE (l.owner_id = ? OR l.owner_id IS NULL)`;
            params.push(ownerId);
        }

        sql += ` ORDER BY l.id DESC LIMIT 200`;
        const [logs] = await db.query(sql, params);
        return res.json({ success: true, count: logs.length, logs });
    } catch (error) {
        console.error('getInventoryLogs error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch inventory logs' });
    }
};

exports.adjustStock = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, action_type, quantity_change, notes } = req.body;
        const userId = req.user ? req.user.id : null;
        const ownerId = getOwnerId(req.user);

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
            `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes, owner_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [product_id, userId, action_type, qtyDelta, notes || `Manual ${action_type}`, ownerId]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: `Stock updated for '${prod[0].name}'. New level: ${newQty}`,
            newQuantity: newQty
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error adjusting stock:', error);
        return res.status(500).json({ success: false, message: 'Failed to adjust stock' });
    } finally {
        connection.release();
    }
};
