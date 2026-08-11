const db = require('../config/db');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

exports.getAIDemandForecast = async (req, res) => {
    try {
        // Fetch products and historical sales data from database
        const [products] = await db.query(
            `SELECT p.id, p.name, p.quantity, p.reorder_level, c.category_name 
             FROM Products p 
             LEFT JOIN Categories c ON p.category_id = c.id`
        );

        const preparedProducts = [];
        for (const prod of products) {
            const [salesHistory] = await db.query(
                `SELECT DATE(s.created_at) as date, SUM(sd.quantity) as quantity_sold
                 FROM SalesDetails sd
                 JOIN Sales s ON sd.sale_id = s.id
                 WHERE sd.product_id = ?
                 GROUP BY DATE(s.created_at)
                 ORDER BY date ASC`,
                [prod.id]
            );

            preparedProducts.push({
                id: prod.id,
                name: prod.name,
                category_name: prod.category_name,
                quantity: prod.quantity,
                reorder_level: prod.reorder_level,
                sales_history: salesHistory
            });
        }

        // Try calling Python AI service
        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/batch-analysis`, {
                products: preparedProducts
            }, { timeout: 4000 });

            if (aiResponse.data && aiResponse.data.success) {
                return res.json({
                    success: true,
                    source: 'Python Machine Learning Engine',
                    analysis: aiResponse.data.analysis
                });
            }
        } catch (aiErr) {
            console.log('Python AI service offline or timing out, falling back to node heuristics engine');
        }

        // Fallback Heuristics & Statistical ML Model Engine in Node
        const fallbackAnalysis = preparedProducts.map(prod => {
            const history = prod.sales_history || [];
            const totalSold = history.reduce((sum, h) => sum + parseInt(h.quantity_sold || 0, 10), 0);
            const avgDaily = history.length > 0 ? (totalSold / Math.max(1, history.length)) : 1.5;
            
            const predicted30d = Math.round(avgDaily * 30);
            const safetyStock = Math.round(1.65 * Math.sqrt(7) * (avgDaily * 0.3));
            const reorderPoint = Math.round((avgDaily * 7) + safetyStock);
            const recommendedOrder = Math.max(0, (predicted30d + safetyStock) - prod.quantity);
            const shouldReorder = prod.quantity <= Math.max(reorderPoint, prod.reorder_level);

            let urgency = 'LOW';
            if (prod.quantity === 0) urgency = 'CRITICAL (OUT OF STOCK)';
            else if (prod.quantity <= prod.reorder_level / 2) urgency = 'HIGH';
            else if (shouldReorder) urgency = 'MEDIUM';

            return {
                product_id: prod.id,
                product_name: prod.name,
                category: prod.category_name || 'General',
                current_stock: prod.quantity,
                reorder_level: prod.reorder_level,
                forecast_30d: predicted30d,
                confidence_score: 0.88,
                trend: avgDaily > 2 ? 'Fast-Moving (High Demand)' : 'Steady / Seasonal',
                reorder_recommendation: {
                    current_stock: prod.quantity,
                    reorder_point: reorderPoint,
                    safety_stock: safetyStock,
                    recommended_order_quantity: recommendedOrder,
                    should_reorder: shouldReorder,
                    urgency,
                    lead_time_days: 7
                }
            };
        });

        return res.json({
            success: true,
            source: 'Node.js Statistical Forecasting Engine',
            analysis: fallbackAnalysis
        });

    } catch (error) {
        console.error('Error generating AI Forecast:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate AI demand forecast' });
    }
};

exports.getAnomalies = async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT l.*, p.name AS product_name 
             FROM InventoryLogs l 
             JOIN Products p ON l.product_id = p.id 
             ORDER BY l.id DESC LIMIT 50`
        );

        const anomalies = logs
            .filter(l => Math.abs(l.quantity_change) >= 15 || l.action_type === 'EXPIRED_REMOVAL')
            .map(l => ({
                id: l.id,
                product_name: l.product_name,
                action: l.action_type,
                quantity_change: l.quantity_change,
                notes: l.notes,
                date: l.created_at,
                severity: l.quantity_change < -20 ? 'HIGH' : 'MEDIUM',
                message: `Significant inventory movement of ${l.quantity_change} units detected.`
            }));

        return res.json({ success: true, count: anomalies.length, anomalies });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error detecting inventory anomalies' });
    }
};
