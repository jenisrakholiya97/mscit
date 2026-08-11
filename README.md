# AI-Based Inventory Management System for Small Retail Businesses

An enterprise-grade, intelligent inventory management and demand forecasting web application designed specifically for small retail businesses (Grocery stores, Medical stores, Clothing shops, Electronics stores, Hardware stores, and Supermarkets).

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full access (Products, Users, Suppliers, Purchases, Sales, Reports, AI Dashboard).
   - **Store Manager**: Manage Inventory, Create Purchase Orders, Record Sales, View Analytics.
   - **Employee (Cashier)**: POS Billing, Stock Updates, Product Search.

2. **Point of Sale (POS) Billing & Invoicing**:
   - Real-time stock verification, quick barcode lookup.
   - Discount, GST/Tax, and payment method selection (Cash, Card, UPI, NetBanking).
   - Instant printable invoice modal.

3. **AI Demand Forecasting (Python Microservice)**:
   - Uses **Scikit-Learn Random Forest Regressor** and time-series linear trend models to predict 30-day product demand based on daily sales velocity.
   - Visual trend indicators and model confidence scoring.

4. **AI Smart Reorder Optimization**:
   - Automated calculation of Reorder Point (ROP), Safety Stock, and Recommended Order Quantity:
     $$\text{ROP} = (\text{Daily Demand} \times \text{Lead Time}) + \text{Safety Stock}$$
   - Direct 1-click restock purchase trigger.

5. **Expiry Date & Near-Expiry Alerts**:
   - Dedicated tracking for pharmaceutical, grocery, and cosmetic items.
   - Automated alerts for items expiring within 60 days with 1-click disposal audit logging.

6. **Barcode & QR Code Engine**:
   - Auto-generates CODE128 barcodes and SVG QR codes for all products with print functionality.

7. **Automated System Reports**:
   - Sales, Purchase, and Inventory Valuation reports.
   - Export to **Excel (.xlsx)** and **PDF (.pdf)**.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, Lucide Icons, Chart.js, JSBarcode, QRCode.react, jsPDF, XLSX, Custom Glassmorphism CSS design.
- **Backend**: Node.js, Express.js, MySQL2, JWT Authentication, Bcryptjs.
- **AI Service**: Python 3.10, Flask, Scikit-learn, Pandas, NumPy.
- **Database**: MySQL 8.0.
- **DevOps / Deployment**: Docker & Docker-Compose.

---

## 🚀 Quick Start with Docker

```bash
# Clone repository and navigate to root directory
cd /Users/jenis/Documents/mscit

# Launch all 4 services (MySQL, Python AI, Node Backend, React Frontend)
docker compose up --build
```

Access services:
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **AI Prediction Service**: `http://localhost:5001`
- **MySQL Database**: `localhost:3306`

---

## 🔐 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@retail.com` | `password123` / `admin123` |
| Store Manager | `manager@retail.com` | `password123` |
| Employee (Cashier) | `cashier@retail.com` | `password123` |

---

## 📁 Directory Structure

```
.
├── docker-compose.yml
├── README.md
├── database/
│   ├── schema.sql
│   └── seed.sql
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── Dockerfile
├── ai/
│   ├── app.py
│   ├── model.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── nginx.conf
    ├── Dockerfile
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── services/
```
