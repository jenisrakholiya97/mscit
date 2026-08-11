const db = require('../config/db');
const { getOwnerId } = require('../utils/authUtils');

exports.getAllProducts = async (req, res) => {
    try {
        const { category_id, search, low_stock, near_expiry } = req.query;
        const ownerId = getOwnerId(req.user);

        let sql = `
            SELECT p.*, c.category_name, s.name AS supplier_name 
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.id
            LEFT JOIN Suppliers s ON p.supplier_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (ownerId) {
            sql += ` AND (p.owner_id = ? OR p.owner_id IS NULL)`;
            params.push(ownerId);
        }

        if (category_id) {
            sql += ` AND p.category_id = ?`;
            params.push(category_id);
        }

        if (search) {
            sql += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.qr_code LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (low_stock === 'true') {
            sql += ` AND p.quantity <= p.reorder_level`;
        }

        if (near_expiry === 'true') {
            sql += ` AND p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)`;
        }

        sql += ` ORDER BY p.id DESC`;
        const [products] = await db.query(sql, params);
        return res.json({ success: true, count: products.length, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT p.*, c.category_name, s.name AS supplier_name 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id 
             LEFT JOIN Suppliers s ON p.supplier_id = s.id 
             WHERE p.id = ?`;
        const params = [req.params.id];

        if (ownerId) {
            sql += ` AND (p.owner_id = ? OR p.owner_id IS NULL)`;
            params.push(ownerId);
        }

        const [rows] = await db.query(sql, params);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.json({ success: true, product: rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching product' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date, image_url } = req.body;
        const ownerId = getOwnerId(req.user);
        
        if (!name || cost_price === undefined || selling_price === undefined) {
            return res.status(400).json({ success: false, message: 'Name, cost price, and selling price are required.' });
        }

        const generatedBarcode = barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`;
        const generatedQR = qr_code || `QR-${name.toUpperCase().replace(/\s+/g, '-')}-${generatedBarcode.slice(-4)}`;

        const [result] = await db.query(
            `INSERT INTO Products (name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date, image_url, owner_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, 
                category_id || null, 
                cost_price, 
                selling_price, 
                quantity || 0, 
                reorder_level || 10, 
                generatedBarcode, 
                generatedQR, 
                supplier_id || null, 
                expiry_date || null,
                image_url || null,
                ownerId
            ]
        );

        // Audit Log
        if (quantity > 0) {
            await db.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes, owner_id) VALUES (?, ?, 'STOCK_IN', ?, 'Initial product creation stock', ?)`,
                [result.insertId, req.user ? req.user.id : null, quantity, ownerId]
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            productId: result.insertId
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ success: false, message: 'Failed to create product' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date, image_url } = req.body;
        const ownerId = getOwnerId(req.user);

        const [existing] = await db.query('SELECT quantity FROM Products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const oldQty = existing[0].quantity;
        const newQty = quantity !== undefined ? parseInt(quantity, 10) : oldQty;
        const qtyDiff = newQty - oldQty;
        const cleanExpiry = (expiry_date && String(expiry_date).trim() !== '') ? expiry_date : null;
        const cleanImg = (image_url && String(image_url).trim() !== '') ? image_url : null;

        await db.query(
            `UPDATE Products SET 
                name = COALESCE(?, name),
                category_id = COALESCE(?, category_id),
                cost_price = COALESCE(?, cost_price),
                selling_price = COALESCE(?, selling_price),
                quantity = COALESCE(?, quantity),
                reorder_level = COALESCE(?, reorder_level),
                barcode = COALESCE(?, barcode),
                qr_code = COALESCE(?, qr_code),
                supplier_id = COALESCE(?, supplier_id),
                expiry_date = ?,
                image_url = COALESCE(?, image_url),
                owner_id = COALESCE(owner_id, ?)
             WHERE id = ?`,
            [name, category_id, cost_price, selling_price, newQty, reorder_level, barcode, qr_code, supplier_id, cleanExpiry, cleanImg, ownerId, id]
        );

        if (qtyDiff !== 0) {
            await db.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes, owner_id) 
                 VALUES (?, ?, ?, ?, 'Manual stock update', ?)`,
                [id, req.user ? req.user.id : null, qtyDiff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', Math.abs(qtyDiff), ownerId]
            );
        }

        return res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, message: 'Failed to update product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = getOwnerId(req.user);

        let sql = 'DELETE FROM Products WHERE id = ?';
        const params = [id];
        if (ownerId) {
            sql += ' AND (owner_id = ? OR owner_id IS NULL)';
            params.push(ownerId);
        }

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT p.*, c.category_name, s.name AS supplier_name 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id 
             LEFT JOIN Suppliers s ON p.supplier_id = s.id 
             WHERE p.quantity <= p.reorder_level`;
        const params = [];

        if (ownerId) {
            sql += ` AND (p.owner_id = ? OR p.owner_id IS NULL)`;
            params.push(ownerId);
        }

        const [products] = await db.query(sql, params);
        return res.json({ success: true, count: products.length, products });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch low stock products' });
    }
};

exports.getNearExpiry = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT p.*, c.category_name, s.name AS supplier_name 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id 
             LEFT JOIN Suppliers s ON p.supplier_id = s.id 
             WHERE p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)`;
        const params = [];

        if (ownerId) {
            sql += ` AND (p.owner_id = ? OR p.owner_id IS NULL)`;
            params.push(ownerId);
        }

        const [products] = await db.query(sql, params);
        return res.json({ success: true, count: products.length, products });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch near expiry products' });
    }
};
