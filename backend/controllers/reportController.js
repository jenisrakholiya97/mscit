const db = require('../config/db');
const { getOwnerId } = require('../utils/authUtils');

exports.getDashboardStats = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        const filterClause = ownerId ? 'WHERE (owner_id = ? OR owner_id IS NULL)' : '';
        const filterParams = ownerId ? [ownerId] : [];

        const [[{ total_products }]] = await db.query(
            `SELECT COUNT(*) as total_products FROM Products ${filterClause}`,
            filterParams
        );
        const [[{ total_sales_count, total_revenue }]] = await db.query(
            `SELECT COUNT(*) as total_sales_count, COALESCE(SUM(total_amount), 0) as total_revenue FROM Sales ${filterClause}`,
            filterParams
        );
        const [[{ total_purchases_count, total_purchase_cost }]] = await db.query(
            `SELECT COUNT(*) as total_purchases_count, COALESCE(SUM(total_amount), 0) as total_purchase_cost FROM Purchases ${filterClause}`,
            filterParams
        );

        const prodFilter = ownerId ? `AND (owner_id = ${parseInt(ownerId, 10)} OR owner_id IS NULL)` : '';

        const [[{ low_stock_count }]] = await db.query(
            `SELECT COUNT(*) as low_stock_count FROM Products WHERE quantity <= reorder_level ${prodFilter}`
        );
        const [[{ out_of_stock_count }]] = await db.query(
            `SELECT COUNT(*) as out_of_stock_count FROM Products WHERE quantity = 0 ${prodFilter}`
        );
        const [[{ near_expiry_count }]] = await db.query(
            `SELECT COUNT(*) as near_expiry_count FROM Products WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) ${prodFilter}`
        );

        const estimated_profit = Math.max(0, total_revenue - (total_purchase_cost * 0.7));

        // Monthly sales trend
        const salesFilter = ownerId ? `WHERE (owner_id = ${parseInt(ownerId, 10)} OR owner_id IS NULL)` : '';
        const [monthlySales] = await db.query(
            `SELECT DATE_FORMAT(created_at, '%b %Y') as month_name, 
                    SUM(total_amount) as revenue,
                    COUNT(id) as orders
             FROM Sales
             ${salesFilter}
             GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
             ORDER BY MIN(created_at) ASC
             LIMIT 6`
        );

        // Top selling products
        const topProdFilter = ownerId ? `WHERE (p.owner_id = ${parseInt(ownerId, 10)} OR p.owner_id IS NULL)` : '';
        const [topProducts] = await db.query(
            `SELECT p.name, SUM(sd.quantity) as total_units_sold, SUM(sd.total_price) as total_revenue
             FROM SalesDetails sd
             JOIN Products p ON sd.product_id = p.id
             ${topProdFilter}
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
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT s.*, u.name AS seller_name 
             FROM Sales s 
             LEFT JOIN Users u ON s.user_id = u.id`;
        const params = [];
        if (ownerId) {
            sql += ` WHERE (s.owner_id = ? OR s.owner_id IS NULL)`;
            params.push(ownerId);
        }
        sql += ` ORDER BY s.id DESC LIMIT 100`;

        const [sales] = await db.query(sql, params);
        return res.json({ success: true, count: sales.length, sales });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error generating sales report' });
    }
};

exports.getReportsData = async (req, res) => {
    try {
        const ownerId = getOwnerId(req.user);
        let sql = `SELECT s.*, u.name AS seller_name 
             FROM Sales s 
             LEFT JOIN Users u ON s.user_id = u.id`;
        const params = [];
        if (ownerId) {
            sql += ` WHERE (s.owner_id = ? OR s.owner_id IS NULL)`;
            params.push(ownerId);
        }
        sql += ` ORDER BY s.id DESC LIMIT 100`;

        const [sales] = await db.query(sql, params);
        return res.json({ success: true, count: sales.length, sales });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error generating reports data' });
    }
};
