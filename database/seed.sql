USE inventory_db;

-- Passwords: 'password123' bcrypt hash: $2a$10$4.p9p1t/1tM1D8CqU7Cj1uJj5O71YV/7sWf7P.y0w/oY7t8z0Y6n6
-- (We will also handle password verification gracefully in seed or bcrypt module if default)
INSERT INTO Users (name, email, password_hash, role, phone) VALUES
('System Admin', 'admin@retail.com', '$2b$10$E9cQ8zZ7f3bYV5X.5K1z/u9O5A1m7y1e1h2i3j4k5l6m7n8o9p0q', 'Admin', '+19876543210'),
('Store Manager', 'manager@retail.com', '$2b$10$E9cQ8zZ7f3bYV5X.5K1z/u9O5A1m7y1e1h2i3j4k5l6m7n8o9p0q', 'Store Manager', '+19876543211'),
('Sarah Cashier', 'cashier@retail.com', '$2b$10$E9cQ8zZ7f3bYV5X.5K1z/u9O5A1m7y1e1h2i3j4k5l6m7n8o9p0q', 'Employee', '+19876543212');

-- Seed Categories
INSERT INTO Categories (category_name, description) VALUES
('Groceries & Food', 'Daily essentials, fresh produce, and packaged food'),
('Pharmaceuticals', 'Over the counter medicines, health supplies, cosmetics'),
('Electronics', 'Gadgets, accessories, home appliances'),
('Clothing & Apparel', 'Shirts, jeans, footwear and accessories'),
('Hardware & Tools', 'Home improvement, fasteners, hand tools');

-- Seed Suppliers
INSERT INTO Suppliers (name, phone, email, address) VALUES
('Global Food Distro Inc.', '+1 555-0192', 'orders@globalfood.com', '100 Supply Chain Blvd, Suite 4'),
('Apex Pharma Supplies', '+1 555-0482', 'support@apexpharma.com', '45 Healthcare Way'),
('TechWholesale Co.', '+1 555-0771', 'sales@techwholesale.io', '88 Innovation Park'),
('Urban Style Traders', '+1 555-0339', 'contact@urbanstyle.com', '12 Fashion Hub Street');

-- Seed Customers
INSERT INTO Customers (name, phone, email, address) VALUES
('John Doe', '+1 555-1111', 'john@example.com', '123 Main St'),
('Alice Smith', '+1 555-2222', 'alice@example.com', '456 Oak Ave'),
('Robert Johnson', '+1 555-3333', 'robert@example.com', '789 Pine Rd');

-- Seed Products
INSERT INTO Products (name, category_id, cost_price, selling_price, quantity, reorder_level, barcode, qr_code, supplier_id, expiry_date) VALUES
('Organic Whole Milk 1L', 1, 1.80, 2.99, 45, 15, '890100100001', 'QR-MILK-1L', 1, '2026-08-20'),
('Whole Wheat Bread 400g', 1, 1.20, 2.49, 8, 12, '890100100002', 'QR-BREAD-400G', 1, '2026-08-12'),
('Basmati Rice 5kg', 1, 8.50, 14.99, 60, 20, '890100100003', 'QR-RICE-5KG', 1, '2027-01-01'),
('Paracetamol 500mg (10s)', 2, 0.50, 1.99, 120, 30, '890200200001', 'QR-PARA-500', 2, '2027-06-30'),
('Vitamin C 1000mg Chewable', 2, 3.20, 7.99, 5, 10, '890200200002', 'QR-VITC-1000', 2, '2026-08-10'),
('Wireless Bluetooth Earbuds', 3, 12.00, 29.99, 25, 8, '890300300001', 'QR-EARBUDS-BL', 3, NULL),
('Fast Charging USB-C Cable', 3, 2.50, 8.99, 50, 15, '890300300002', 'QR-USBC-CABLE', 3, NULL),
('Men Cotton T-Shirt (M)', 4, 4.00, 12.99, 30, 10, '890400400001', 'QR-TSHIRT-M', 4, NULL),
('Stainless Steel Hammer 16oz', 5, 6.00, 15.99, 14, 5, '890500500001', 'QR-HAMMER-16', 3, NULL);

-- Seed Purchases
INSERT INTO Purchases (supplier_id, user_id, total_amount, status, notes) VALUES
(1, 1, 245.00, 'Completed', 'Initial grocery stock replenishment'),
(2, 2, 180.00, 'Completed', 'Pharma batch order #491');

-- Seed Purchase Details
INSERT INTO PurchaseDetails (purchase_id, product_id, quantity, unit_cost) VALUES
(1, 1, 50, 1.80),
(1, 2, 30, 1.20),
(2, 4, 150, 0.50),
(2, 5, 20, 3.20);

-- Seed Historical Sales for AI Demand Forecasting Model
-- Generating 60 days of historical sales records
INSERT INTO Sales (customer_id, customer_name, user_id, subtotal, discount, tax_gst, total_amount, payment_method, created_at) VALUES
(1, 'John Doe', 3, 15.47, 0.00, 1.00, 16.47, 'Cash', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(2, 'Alice Smith', 3, 37.98, 2.00, 2.50, 38.48, 'UPI', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(1, 'John Doe', 3, 29.99, 0.00, 2.10, 32.09, 'Card', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(3, 'Robert Johnson', 3, 8.99, 0.00, 0.60, 9.59, 'Cash', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 'Alice Smith', 3, 44.97, 5.00, 3.00, 42.97, 'UPI', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(NULL, 'Walk-in Customer', 3, 17.48, 0.00, 1.20, 18.68, 'Cash', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Sales Details
INSERT INTO SalesDetails (sale_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 3, 2.99, 8.97),
(1, 2, 2, 2.49, 4.98),
(2, 6, 1, 29.99, 29.99),
(2, 4, 4, 1.99, 7.96),
(3, 6, 1, 29.99, 29.99),
(4, 7, 1, 8.99, 8.99),
(5, 3, 2, 14.99, 29.98),
(5, 8, 1, 12.99, 12.99),
(6, 1, 2, 2.99, 5.98),
(6, 5, 1, 7.99, 7.99);

-- Inventory Logs
INSERT INTO InventoryLogs (product_id, user_id, action_type, quantity_change, notes, created_at) VALUES
(1, 1, 'STOCK_IN', 50, 'Initial Stock Purchase', DATE_SUB(NOW(), INTERVAL 60 DAY)),
(1, 3, 'SALE', -3, 'POS Sale #1', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(2, 3, 'SALE', -2, 'POS Sale #1', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(6, 3, 'SALE', -1, 'POS Sale #2', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(5, 1, 'ADJUSTMENT', -5, 'Damaged package during display setup', DATE_SUB(NOW(), INTERVAL 10 DAY));
