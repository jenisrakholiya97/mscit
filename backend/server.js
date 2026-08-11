const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const salesRoutes = require('./routes/salesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Enhanced Health Check Endpoint
app.get('/health', async (req, res) => {
    const dbStatus = await db.testConnection();
    res.json({
        status: dbStatus.connected ? 'UP' : 'DEGRADED',
        service: 'AI-Based Inventory Management Backend API',
        database: dbStatus.connected ? 'CONNECTED' : `DISCONNECTED: ${dbStatus.error}`,
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, async () => {
    console.log(`=================================================`);
    console.log(`Backend Server running on port ${PORT}`);
    const dbStatus = await db.testConnection();
    if (dbStatus.connected) {
        console.log(`Database Connection: SUCCESS ✓ (MySQL host: ${process.env.DB_HOST || 'localhost'}, db: ${process.env.DB_NAME || 'inventory_db'})`);
    } else {
        console.warn(`Database Connection: WARNING ⚠️ (${dbStatus.error})`);
        console.warn(`Tip: If using Docker, run: 'docker compose up -d' to start MySQL database.`);
    }
    console.log(`=================================================`);
});
