const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env if available
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'rootpassword',
    database: process.env.DB_NAME || 'inventory_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

/**
 * Test Database Connection on server startup
 */
pool.testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        return { connected: true };
    } catch (err) {
        return {
            connected: false,
            error: err.message,
            code: err.code
        };
    }
};

module.exports = pool;
