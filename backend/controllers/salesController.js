const db = require('../config/db');

exports.createSale = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_name, customer_phone, discount = 0, tax_gst = 0, payment_method = 'Cash', items } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
        }

        let subtotal = 0;
        const verifiedItems = [];

        // Check product stock and compute total
        for (const item of items) {
            const [rows] = await connection.query('SELECT id, name, selling_price, quantity FROM Products WHERE id = ?', [item.product_id]);
            if (rows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: `Product ID ${item.product_id} not found.` });
            }

            const product = rows[0];
            if (product.quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for '${product.name}'. Available: ${product.quantity}, Requested: ${item.quantity}` 
                });
            }

            const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : parseFloat(product.selling_price);
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;

            verifiedItems.push({
                product_id: product.id,
                name: product.name,
                quantity: item.quantity,
                unit_price: unitPrice,
                total_price: lineTotal
            });
        }

        const totalDiscount = parseFloat(discount) || 0;
        const totalTax = parseFloat(tax_gst) || 0;
        const totalAmount = Math.max(0, subtotal - totalDiscount + totalTax);

        // Find or create customer if phone provided
        let customerId = null;
        if (customer_phone) {
            const [cust] = await connection.query('SELECT id FROM Customers WHERE phone = ?', [customer_phone]);
            if (cust.length > 0) {
                customerId = cust[0].id;
            } else if (customer_name) {
                const [newCust] = await connection.query('INSERT INTO Customers (name, phone) VALUES (?, ?)', [customer_name, customer_phone]);
                customerId = newCust.insertId;
            }
        }

        // Insert Sale record
        const [saleResult] = await connection.query(
            `INSERT INTO Sales (customer_id, customer_name, user_id, subtotal, discount, tax_gst, total_amount, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [customerId, customer_name || 'Walk-in Customer', userId, subtotal, totalDiscount, totalTax, totalAmount, payment_method]
        );

        const saleId = saleResult.insertId;

        // Insert Sale Details & Update Inventory
        for (const item of verifiedItems) {
            await connection.query(
                `INSERT INTO SalesDetails (sale_id, product_id, quantity, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.quantity, item.unit_price, item.total_price]
            );

            await connection.query(
                `UPDATE Products SET quantity = quantity - ? WHERE id = ?`,
                [item.quantity, item.product_id]
            );

            await connection.query(
                `INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes)
                 VALUES (?, ?, 'SALE', ?, ?)`,
                [item.product_id, userId, -item.quantity, `Sale #${saleId} to ${customer_name || 'Walk-in'}`]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Sale completed successfully!',
            saleId,
            receipt: {
                saleId,
                date: new Date().toISOString(),
                customer: customer_name || 'Walk-in Customer',
                payment_method,
                subtotal,
                discount: totalDiscount,
                tax_gst: totalTax,
                totalAmount,
                items: verifiedItems
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error processing sale:', error);
        return res.status(500).json({ success: false, message: 'Transaction failed while processing sale.' });
    } finally {
        connection.release();
    }
};

exports.getAllSales = async (req, res) => {
    try {
        const [sales] = await db.query(
            `SELECT s.*, u.name AS seller_name 
             FROM Sales s
             LEFT JOIN Users u ON s.user_id = u.id
             ORDER BY s.id DESC`
        );
        return res.json({ success: true, count: sales.length, sales });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch sales' });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [saleRows] = await db.query(
            `SELECT s.*, u.name AS seller_name 
             FROM Sales s 
             LEFT JOIN Users u ON s.user_id = u.id 
             WHERE s.id = ?`,
            [id]
        );
        if (saleRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        const [items] = await db.query(
            `SELECT sd.*, p.name AS product_name, p.barcode
             FROM SalesDetails sd
             JOIN Products p ON sd.product_id = p.id
             WHERE sd.sale_id = ?`,
            [id]
        );

        return res.json({
            success: true,
            sale: saleRows[0],
            items
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching sale details' });
    }
};
