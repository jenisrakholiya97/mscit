const db = require('../config/db');
const { getOwnerId } = require('../utils/authUtils');

exports.createPurchase = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { supplier_id, notes, items } = req.body;
        const userId = req.user ? req.user.id : null;
        const ownerId = getOwnerId(req.user);

        if (!items || !Array.isArray(items) || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Purchase items list cannot be empty' });
        }

        let totalAmount = 0;
        const itemsToInsert = [];

        for (const item of items) {
            const qty = parseInt(item.quantity, 10);
            const cost = parseFloat(item.unit_cost);
            if (isNaN(qty) || isNaN(cost) || qty <= 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Invalid quantity or unit cost in items' });
            }
            const lineTotal = qty * cost;
            totalAmount += lineTotal;
            itemsToInsert.push({ product_id: item.product_id, quantity: qty, unit_cost: cost });
        }

        const [purchaseRes] = await connection.query(
            `INSERT INTO Purchases (supplier_id, user_id, total_amount, status, notes, owner_id)
             VALUES (?, ?, ?, 'Completed', ?, ?)`,
            [supplier_id || null, userId, totalAmount, notes || 'Standard Stock Replenishment', ownerId]
        );

        const purchaseId = purchaseRes.insertId;

        for (const item of itemsToInsert) {
            await connection.query(
                `INSERT INTO PurchaseDetails (purchase_id, product_id, quantity, unit_cost)
                 VALUES (?, ?, ?, ?)`,
                [purchaseId, item.product_id, item.quantity, item.unit_cost]
            );

            // Increment Stock in Products
            await connection.query(
                `UPDATE Products SET quantity = quantity + ? WHERE id = ?`,
                [item.quantity, item.product_id]
            );

            // Add Audit Log
            await connection.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes, owner_id)
                 VALUES (?, ?, 'PURCHASE', ?, ?, ?)`,
                [item.product_id, userId, item.quantity, `Purchase Order #${purchaseId}`, ownerId]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Purchase Order created and inventory updated!',
            purchaseId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase:', error);
        return res.status(500).json({ success: false, message: 'Failed to create purchase order' });
    } finally {
        connection.release();
    }
};

exports.getAllPurchases = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT p.*, s.name AS supplier_name, u.name AS user_name 
             FROM Purchases p
             LEFT JOIN Suppliers s ON p.supplier_id = s.id
             LEFT JOIN Users u ON p.user_id = u.id`;
        const params = [];

        if (ownerId) {
            sql += ` WHERE (p.owner_id = ? OR p.owner_id IS NULL)`;
            params.push(ownerId);
        }

        sql += ` ORDER BY p.id DESC`;
        const [purchases] = await db.query(sql, params);
        return res.json({ success: true, purchases });
    } catch (error) {
        console.error('getAllPurchases error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching purchase orders' });
    }
};
