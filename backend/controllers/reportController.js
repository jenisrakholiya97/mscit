const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM Products');
        const [[{ total_sales_count, total_revenue }]] = await db.query(
            'SELECT COUNT(*) as total_sales_count, COALESCE(SUM(total_amount), 0) as total_revenue FROM Sales'
        );
        const [[{ total_purchases_count, total_purchase_cost }]] = await db.query(
            'SELECT COUNT(*) as total_purchases_count, COALESCE(SUM(total_amount), 0) as total_purchase_cost FROM Purchases'
        );
        const [[{ low_stock_count }]] = await db.query(
            'SELECT COUNT(*) as low_stock_count FROM Products WHERE quantity <= reorder_level'
        );
        const [[{ out_of_stock_count }]] = await db.query(
            'SELECT COUNT(*) as out_of_stock_count FROM Products WHERE quantity = 0'
        );
        const [[{ near_expiry_count }]] = await db.query(
            'SELECT COUNT(*) as near_expiry_count FROM Products WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)'
        );

        // Approximate net profit = total_revenue - total_purchase_cost
        const estimated_profit = Math.max(0, total_revenue - (total_purchase_cost * 0.7));

        // Monthly sales trend (last 6 months)
        const [monthlySales] = await db.query(
            `SELECT DATE_FORMAT(created_at, '%b %Y') as month_name, 
                    SUM(total_amount) as revenue,
                    COUNT(id) as orders
             FROM Sales
             GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
             ORDER BY MIN(created_at) ASC
             LIMIT 6`
        );

        // Top selling products
        const [topProducts] = await db.query(
            `SELECT p.name, SUM(sd.quantity) as total_units_sold, SUM(sd.total_price) as total_revenue
             FROM SalesDetails sd
             JOIN Products p ON sd.product_id = p.id
             GROUP BY p.id, p.name
             ORDER BY total_units_sold DESC
             LIMIT 5`
        );

        return res.json({
            success: true,
            kpis: {
                total_products,
                total_sales_count,
                total_revenue: parseFloat(total_revenue),
                total_purchases_count,
                total_purchase_cost: parseFloat(total_purchase_cost),
                estimated_profit: parseFloat(estimated_profit.toFixed(2)),
                low_stock_count,
                out_of_stock_count,
                near_expiry_count
            },
            monthly_sales: monthlySales,
            top_products: topProducts
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard metrics' });
    }
};

exports.getReportsData = async (req, res) => {
    try {
        const { type = 'sales' } = req.query;

        if (type === 'sales') {
            const [rows] = await db.query(
                `SELECT s.id, s.customer_name, s.payment_method, s.subtotal, s.discount, s.tax_gst, s.total_amount, s.created_at, u.name as cashier
                 FROM Sales s
                 LEFT JOIN Users u ON s.user_id = u.id
                 ORDER BY s.id DESC`
            );
            return res.json({ success: true, type: 'sales', data: rows });
        }

        if (type === 'purchases') {
            const [rows] = await db.query(
                `SELECT p.id, p.total_amount, p.status, p.created_at, s.name as supplier_name, u.name as created_by
                 FROM Purchases p
                 LEFT JOIN Suppliers s ON p.supplier_id = s.id
                 LEFT JOIN Users u ON p.user_id = u.id
                 ORDER BY p.id DESC`
            );
            return res.json({ success: true, type: 'purchases', data: rows });
        }

        if (type === 'inventory') {
            const [rows] = await db.query(
                `SELECT p.id, p.name, c.category_name, p.cost_price, p.selling_price, p.quantity, (p.quantity * p.cost_price) as stock_valuation
                 FROM Products p
                 LEFT JOIN Categories c ON p.category_id = c.id
                 ORDER BY p.name ASC`
            );
            return res.json({ success: true, type: 'inventory', data: rows });
        }

        return res.status(400).json({ success: false, message: 'Invalid report type requested' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error generating report data' });
    }
};
