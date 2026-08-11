const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const { category_id, search, low_stock, near_expiry } = req.query;
        let sql = `
            SELECT p.*, c.category_name, s.name AS supplier_name 
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.id
            LEFT JOIN Suppliers s ON p.supplier_id = s.id
            WHERE 1=1
        `;
        const params = [];

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
        const [rows] = await db.query(
            `SELECT p.*, c.category_name, s.name AS supplier_name 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id 
             LEFT JOIN Suppliers s ON p.supplier_id = s.id 
             WHERE p.id = ?`,
            [req.params.id]
        );
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
        
        if (!name || cost_price === undefined || selling_price === undefined) {
            return res.status(400).json({ success: false, message: 'Name, cost price, and selling price are required.' });
        }

        const generatedBarcode = barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`;
        const generatedQR = qr_code || `QR-${name.toUpperCase().replace(/\s+/g, '-')}-${generatedBarcode.slice(-4)}`;

        const [result] = await db.query(
            `INSERT INTO Products (name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                image_url || null
            ]
        );

        // Audit Log
        if (quantity > 0) {
            await db.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes) VALUES (?, ?, 'STOCK_IN', ?, 'Initial product creation stock')`,
                [result.insertId, req.user ? req.user.id : null, quantity]
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

        const [existing] = await db.query('SELECT quantity FROM Products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const oldQty = existing[0].quantity;

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
                image_url = COALESCE(?, image_url)
             WHERE id = ?`,
            [name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date || null, image_url, id]
        );

        if (quantity !== undefined && quantity !== oldQty) {
            const diff = quantity - oldQty;
            await db.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes) VALUES (?, ?, 'ADJUSTMENT', ?, 'Manual product update')`,
                [id, req.user ? req.user.id : null, diff]
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
        const [result] = await db.query('DELETE FROM Products WHERE id = ?', [id]);
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
        const [products] = await db.query(
            `SELECT p.*, c.category_name, s.name AS supplier_name
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.id
             LEFT JOIN Suppliers s ON p.supplier_id = s.id
             WHERE p.quantity <= p.reorder_level
             ORDER BY p.quantity ASC`
        );
        return res.json({ success: true, count: products.length, products });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching low stock items' });
    }
};

exports.getNearExpiry = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.category_name, DATEDIFF(p.expiry_date, CURDATE()) as days_until_expiry
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.id
             WHERE p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
             ORDER BY p.expiry_date ASC`
        );
        return res.json({ success: true, count: products.length, products });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching near expiry items' });
    }
};
