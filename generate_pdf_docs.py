import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Suppress headers on Cover Page if page 1
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * 72 - 36, "AI-Based Inventory Management System — Technical Manual & Module Documentation")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)
            
            # Footer
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * 72 - 54, 36, page_text)
            self.drawString(54, 36, "Confidential & Proprietary — AI Inventory System")
            self.line(54, 48, 8.5 * 72 - 54, 48)
            
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#1E3A8A")    # Dark Navy
    SECONDARY = colors.HexColor("#0D9488")  # Teal
    ACCENT = colors.HexColor("#4F46E5")     # Indigo Accent
    TEXT_DARK = colors.HexColor("#0F172A")  # Slate 900
    TEXT_MUTED = colors.HexColor("#475569") # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderColor=colors.HexColor("#CBD5E1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8
    )

    tbl_header_style = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    story = []

    # ---------------------------------------------------------
    # COVER / TITLE BLOCK
    # ---------------------------------------------------------
    story.append(Paragraph("AI-Based Inventory Management System", title_style))
    story.append(Paragraph("Full Module-Wise System Architecture & Technical Manual", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=0, spaceAfter=15))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>Document Version:</b> 2.0 (Comprehensive)", body_style), Paragraph("<b>Target Environment:</b> Node.js + Python AI + MySQL", body_style)],
        [Paragraph("<b>Author / System Architect:</b> Lead AI Software Engineer", body_style), Paragraph("<b>Date:</b> August 2026", body_style)],
        [Paragraph("<b>Project Scope:</b> Enterprise Multi-Tenant Inventory & POS", body_style), Paragraph("<b>Status:</b> Production Ready", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DBEAFE")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & SYSTEM OVERVIEW
    # ---------------------------------------------------------
    story.append(Paragraph("1. Executive Summary & Architecture Overview", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    exec_summary_text = (
        "The <b>AI-Based Inventory Management System</b> is an end-to-end, enterprise-grade web platform "
        "designed to streamline stock control, automate demand forecasting, manage suppliers and purchase orders, "
        "process sales via an interactive Point of Sale (POS) interface, and track product expiry dates. "
        "By integrating a dedicated Python-powered AI Machine Learning service with a Node.js Express API and "
        "a React dynamic frontend, the system minimizes stockouts, eliminates manual inventory tracking errors, "
        "and optimizes inventory holding costs using statistical safety stock formulas."
    )
    story.append(Paragraph(exec_summary_text, body_style))

    # Tech Stack Summary Table
    story.append(Spacer(1, 4))
    tech_data = [
        [Paragraph("Layer", tbl_header_style), Paragraph("Technology Stack", tbl_header_style), Paragraph("Key Purpose & Components", tbl_header_style)],
        [Paragraph("<b>Frontend UI</b>", tbl_cell_style), Paragraph("React 18, Vite, TailwindCSS, Lucide Icons, HTML5 Canvas", tbl_cell_style), Paragraph("Responsive SPA, POS Cashier desk, Barcode/QR generator, Real-time charts", tbl_cell_style)],
        [Paragraph("<b>Backend API</b>", tbl_cell_style), Paragraph("Node.js, Express.js, mysql2/promise, JWT, bcrypt", tbl_cell_style), Paragraph("REST API endpoints, MySQL Connection Pooling, Transactions, Auth middleware", tbl_cell_style)],
        [Paragraph("<b>AI Microservice</b>", tbl_cell_style), Paragraph("Python 3, Flask, scikit-learn, pandas, numpy", tbl_cell_style), Paragraph("Demand forecasting (RandomForestRegressor + LinearTrend), ROP & Safety Stock calculations", tbl_cell_style)],
        [Paragraph("<b>Database</b>", tbl_cell_style), Paragraph("MySQL 8.0 / MariaDB", tbl_cell_style), Paragraph("Relational schema with 12 normalized tables, Foreign keys, Cascade & Null constraints", tbl_cell_style)],
        [Paragraph("<b>Infrastructure</b>", tbl_cell_style), Paragraph("Docker, Docker Compose, Nginx Reverse Proxy", tbl_cell_style), Paragraph("Containerized multi-service deployment, environment configurations", tbl_cell_style)]
    ]
    tech_table = Table(tech_data, colWidths=[90, 160, 254])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 2. DATABASE SCHEMA & ENTITY RELATIONSHIPS
    # ---------------------------------------------------------
    story.append(Paragraph("2. Database Schema & Data Dictionary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))
    
    schema_intro = (
        "The relational database schema consists of <b>12 normalized tables</b> engineered for data integrity, "
        "fast transactional queries, and multi-tenant data isolation via `owner_id` scoping."
    )
    story.append(Paragraph(schema_intro, body_style))
    story.append(Spacer(1, 4))

    schema_tables = [
        ("1. Users Table", "`id` (INT PK), `name` (VARCHAR), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `role` (VARCHAR: Admin/Owner/Manager/Staff), `phone` (VARCHAR), `permissions` (JSON), `owner_id` (INT FK), `reset_token` (VARCHAR), `reset_token_expires` (DATETIME)"),
        ("2. Categories Table", "`id` (INT PK), `category_name` (VARCHAR UNIQUE), `description` (TEXT), `created_at` (TIMESTAMP)"),
        ("3. Suppliers Table", "`id` (INT PK), `name` (VARCHAR), `phone` (VARCHAR), `email` (VARCHAR), `address` (TEXT), `owner_id` (INT FK)"),
        ("4. Products Table", "`id` (INT PK), `name` (VARCHAR), `category_id` (INT FK), `cost_price` (DECIMAL), `selling_price` (DECIMAL), `quantity` (INT), `reorder_level` (INT), `barcode` (VARCHAR UNIQUE), `qr_code` (VARCHAR), `supplier_id` (INT FK), `expiry_date` (DATE), `owner_id` (INT FK)"),
        ("5. Customers Table", "`id` (INT PK), `name` (VARCHAR), `phone` (VARCHAR UNIQUE), `email` (VARCHAR), `address` (TEXT), `owner_id` (INT FK)"),
        ("6. Purchases Table", "`id` (INT PK), `supplier_id` (INT FK), `user_id` (INT FK), `total_amount` (DECIMAL), `status` (ENUM: Completed/Pending/Cancelled), `notes` (TEXT), `owner_id` (INT FK)"),
        ("7. PurchaseDetails Table", "`id` (INT PK), `purchase_id` (INT FK CASCADE), `product_id` (INT FK CASCADE), `quantity` (INT), `unit_cost` (DECIMAL)"),
        ("8. Sales Table", "`id` (INT PK), `customer_id` (INT FK SET NULL), `customer_name` (VARCHAR), `user_id` (INT FK), `subtotal` (DECIMAL), `discount` (DECIMAL), `tax_gst` (DECIMAL), `total_amount` (DECIMAL), `payment_method` (ENUM: Cash/Card/UPI/NetBanking), `owner_id` (INT FK)"),
        ("9. SalesDetails Table", "`id` (INT PK), `sale_id` (INT FK CASCADE), `product_id` (INT FK CASCADE), `quantity` (INT), `unit_price` (DECIMAL), `total_price` (DECIMAL)"),
        ("10. InventoryLogs Table", "`id` (INT PK), `product_id` (INT FK), `user_id` (INT FK), `action_type` (ENUM: STOCK_IN, STOCK_OUT, SALE, PURCHASE, ADJUSTMENT, EXPIRED_REMOVAL), `quantity_change` (INT), `notes` (TEXT), `owner_id` (INT FK)"),
        ("11. AIForecast Table", "`id` (INT PK), `product_id` (INT FK), `forecast_date` (DATE), `predicted_demand` (INT), `confidence_score` (DECIMAL), `reorder_recommended_qty` (INT)"),
        ("12. RolePermissions Table", "`id` (INT PK), `role` (VARCHAR UNIQUE), `permissions` (JSON), `updated_at` (TIMESTAMP)")
    ]

    schema_tbl_data = [[Paragraph("Table Name", tbl_header_style), Paragraph("Fields & Data Constraints", tbl_header_style)]]
    for tbl_name, tbl_fields in schema_tables:
        schema_tbl_data.append([Paragraph(f"<b>{tbl_name}</b>", tbl_cell_style), Paragraph(tbl_fields, tbl_cell_style)])

    schema_table_elem = Table(schema_tbl_data, colWidths=[140, 364])
    schema_table_elem.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(schema_table_elem)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 3. DETAILED MODULE-WISE BREAKDOWN (12 MODULES)
    # ---------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("3. Detailed Module-Wise Application Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=0, spaceAfter=10))

    modules = [
        ("Module 1: User Authentication & Role-Based Access Control (RBAC)", [
            "<b>Overview:</b> Secures application access through JSON Web Token (JWT) authentication, password hashing with bcrypt, and dynamic permission resolution.",
            "<b>Key Features:</b> User login with email/password, JWT generation with 24-hour expiration, stored custom permissions JSON per user, role hierarchy (Admin, Owner, Manager, Staff).",
            "<b>Technical File References:</b> [authController.js](file:///Users/jenis/Documents/mscit/backend/controllers/authController.js), [authMiddleware.js](file:///Users/jenis/Documents/mscit/backend/middleware/authMiddleware.js), [Login.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Login.jsx).",
            "<b>Permission Matrix:</b> Admin has full system bypass; Owner manages staff; Manager handles inventory & sales; Staff is restricted based on specific permissions array."
        ]),
        ("Module 2: Dashboard & Real-Time Business Analytics Hub", [
            "<b>Overview:</b> Central operational control center displaying real-time Key Performance Indicators (KPIs), urgent stock alerts, and financial metrics.",
            "<b>Key Features:</b> Stat Cards (Total Stock Value, Low Stock Count, Near-Expiry Items, Today's Sales), Recent Sales Activity Feed, Low Stock Warnings, Quick Navigation Action buttons.",
            "<b>Technical File References:</b> [Dashboard.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Dashboard.jsx), [reportController.js](file:///Users/jenis/Documents/mscit/backend/controllers/reportController.js).",
            "<b>Data Aggregation:</b> Queries database using MySQL SUM/COUNT aggregations filtered by current logged-in `owner_id`."
        ]),
        ("Module 3: Products Catalog & Category Management", [
            "<b>Overview:</b> End-to-end inventory item management featuring pricing, category classification, reorder threshold configuration, and barcode generation.",
            "<b>Key Features:</b> Create/Edit/Delete products, Category mapping, Cost vs Selling Price markup analysis, Image URL link attachment, EAN-13 style Barcode & QR code auto-generation, Filter by low-stock and category.",
            "<b>Technical File References:</b> [Products.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Products.jsx), [productController.js](file:///Users/jenis/Documents/mscit/backend/controllers/productController.js).",
            "<b>Barcode Generation:</b> Auto-generates unique 12-digit EAN barcode starting with prefix '890' if not provided."
        ]),
        ("Module 4: Point of Sale (POS) & Automated Billing Desk", [
            "<b>Overview:</b> Interactive, high-speed cashier checkout page designed for rapid retail transaction processing.",
            "<b>Key Features:</b> Live search & instant Barcode scanner input listener, Real-time stock availability validation, Quantity incremental adjustment, Customer phone lookup/auto-creation, Multi-payment methods (Cash, Card, UPI, NetBanking), Discount & Tax/GST calculation, Instant printable Invoice Modal.",
            "<b>Technical File References:</b> [POS.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/POS.jsx), [salesController.js](file:///Users/jenis/Documents/mscit/backend/controllers/salesController.js), [InvoiceModal.jsx](file:///Users/jenis/Documents/mscit/frontend/src/components/InvoiceModal.jsx).",
            "<b>ACID Transaction Guarantee:</b> Uses MySQL database transactions (`beginTransaction`, `commit`, `rollback`) to ensure stock reduction and sale entry execute atomically."
        ]),
        ("Module 5: Supplier Management & Purchase Procurement System", [
            "<b>Overview:</b> Manages vendor relationships, contact info, and stock replenishment purchase orders.",
            "<b>Key Features:</b> Supplier directory (name, phone, email, address), Create Purchase Order with multiple item lines, Automatic stock increment upon purchase completion, Cost price updating, Purchase log creation.",
            "<b>Technical File References:</b> [Suppliers.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Suppliers.jsx), [Purchases.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Purchases.jsx), [purchaseController.js](file:///Users/jenis/Documents/mscit/backend/controllers/purchaseController.js).",
            "<b>Stock Replenishment Flow:</b> Creating a completed purchase automatically adds quantity to the target product and writes a `STOCK_IN` inventory log."
        ]),
        ("Module 6: Inventory Movement Audit & Stock Adjustment System", [
            "<b>Overview:</b> Complete audit trail tracking every single item movement across the entire application lifecycle.",
            "<b>Key Features:</b> Immutable log repository (`InventoryLogs` table), Log action types (`STOCK_IN`, `STOCK_OUT`, `SALE`, `PURCHASE`, `ADJUSTMENT`, `EXPIRED_REMOVAL`), Manual stock adjustment modal with audit notes, User accountability tracking.",
            "<b>Technical File References:</b> [InventoryAudit.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/InventoryAudit.jsx), [inventoryController.js](file:///Users/jenis/Documents/mscit/backend/controllers/inventoryController.js).",
            "<b>Compliance:</b> Ensures complete auditability for shrinkage, damage, discrepancies, and audit reviews."
        ]),
        ("Module 7: Expiry Tracking & Automated Waste Mitigation", [
            "<b>Overview:</b> Monitors perishable products and alerts management before stock expires to prevent financial losses.",
            "<b>Key Features:</b> Expiry date tracking per product batch, Color-coded urgency badges (Expired = Red, Near Expiry < 60 days = Amber, Fresh = Green), One-click Write-Off / Removal action that removes stock and logs `EXPIRED_REMOVAL`.",
            "<b>Technical File References:</b> [ExpiryAlerts.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/ExpiryAlerts.jsx), [productController.js](file:///Users/jenis/Documents/mscit/backend/controllers/productController.js).",
            "<b>Loss Prevention:</b> Enables promotional clearance discounts on items approaching 30 days to expiration."
        ]),
        ("Module 8: AI Demand Forecasting Engine", [
            "<b>Overview:</b> Python-driven machine learning engine that forecasts 30-day future demand based on historical sales time-series data.",
            "<b>Key Features:</b> `RandomForestRegressor` model trained on day index, day of week, day of month, month, and weekend indicator features; `LinearRegression` slope calculation for trend classification (Fast-Growing, Steady, Declining); Confidence score estimation.",
            "<b>Technical File References:</b> [AIDemandForecast.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/AIDemandForecast.jsx), [app.py](file:///Users/jenis/Documents/mscit/ai/app.py), [model.py](file:///Users/jenis/Documents/mscit/ai/model.py).",
            "<b>Heuristic Fallback:</b> Automatically applies a statistical moving average for new products with fewer than 3 historical sales records."
        ]),
        ("Module 9: AI Smart Reorder Hub & Inventory Optimization", [
            "<b>Overview:</b> Computes optimal stock reorder points (ROP) and recommended order quantities using statistical inventory control equations.",
            "<b>Key Features:</b> Automatic calculation of Safety Stock at 95% service level ($SS = 1.65 \\times \\sqrt{L} \\times \\sigma_d$), Reorder Point ($ROP = (d \\times L) + SS$), Urgency ranking (CRITICAL, HIGH, MEDIUM, LOW), One-click auto-generated purchase order pre-filling target supplier.",
            "<b>Technical File References:</b> [AIReorderHub.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/AIReorderHub.jsx), [model.py](file:///Users/jenis/Documents/mscit/ai/model.py).",
            "<b>Automation:</b> Eliminates guesswork by generating precise purchase orders based on AI-calculated lead time and forecasted demand."
        ]),
        ("Module 10: Advanced Reports & Financial Analytics Engine", [
            "<b>Overview:</b> Comprehensive business intelligence reporting module delivering detailed sales, profit, and stock health analytics.",
            "<b>Key Features:</b> Date range filtering, Revenue vs Cost vs Net Profit calculations, Top-selling products ranking, Category revenue distribution breakdown, Export reports to CSV & printable summary layout.",
            "<b>Technical File References:</b> [Reports.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Reports.jsx), [reportController.js](file:///Users/jenis/Documents/mscit/backend/controllers/reportController.js).",
            "<b>Profit Insights:</b> Calculates gross margin percentage per product line and overall store profitability."
        ]),
        ("Module 11: Multi-Tenant Hierarchy & User Management", [
            "<b>Overview:</b> Enterprise tenant management enabling Store Owners to provision staff accounts with granular custom permissions.",
            "<b>Key Features:</b> Create/Edit/Disable staff user accounts, Role assignment (Manager, Cashier, Stock Clerk), Custom JSON permissions toggle (e.g. `pos_access`, `manage_products`, `view_reports`, `manage_users`), Automatic `owner_id` scoping across all DB tables.",
            "<b>Technical File References:</b> [UserManagement.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/UserManagement.jsx), [userController.js](file:///Users/jenis/Documents/mscit/backend/controllers/userController.js).",
            "<b>Tenant Security:</b> All queries enforce `WHERE owner_id = ?` preventing cross-tenant data leakage."
        ]),
        ("Module 12: Barcode & QR Code Utility Engine", [
            "<b>Overview:</b> Visual rendering component for generating, displaying, and printing physical barcode and QR code stickers for stock labeling.",
            "<b>Key Features:</b> Dynamic HTML5 Canvas rendering of EAN-13 barcodes, QR code generation, Modal print preview with custom sticker layout, High-resolution SVG export.",
            "<b>Technical File References:</b> [BarcodeModal.jsx](file:///Users/jenis/Documents/mscit/frontend/src/components/BarcodeModal.jsx), [Products.jsx](file:///Users/jenis/Documents/mscit/frontend/src/pages/Products.jsx).",
            "<b>Hardware Compatibility:</b> Compatible with standard thermal label printers and handheld laser scanners."
        ])
    ]

    for title, details in modules:
        story.append(Paragraph(title, h2_style))
        for line in details:
            story.append(Paragraph(f"• {line}", bullet_style))
        story.append(Spacer(1, 4))

    # ---------------------------------------------------------
    # 4. AI ENGINE & MATHEMATICAL FORMULAE
    # ---------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("4. AI Engine Algorithms & Inventory Control Formulae", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=0, spaceAfter=8))

    ai_desc = (
        "The AI Engine operates as a microservice running Flask on port 5001. "
        "It evaluates historical sales velocity and calculates reorder metrics using statistical inventory theory."
    )
    story.append(Paragraph(ai_desc, body_style))
    story.append(Spacer(1, 4))

    formula_data = [
        [Paragraph("Metric", tbl_header_style), Paragraph("Mathematical Formula / Logic", tbl_header_style), Paragraph("Description & Variables", tbl_header_style)],
        [
            Paragraph("<b>Average Daily Demand (d)</b>", tbl_cell_style),
            Paragraph("<i>d = D_30 / 30</i>", tbl_cell_style),
            Paragraph("Calculates predicted daily consumption from 30-day forecasted demand (<i>D_30</i>).", tbl_cell_style)
        ],
        [
            Paragraph("<b>Safety Stock (SS)</b>", tbl_cell_style),
            Paragraph("<i>SS = Z * sqrt(L) * sigma_d</i><br/><i>SS = 1.65 * sqrt(L) * (d * 0.3)</i>", tbl_cell_style),
            Paragraph("Buffers against demand volatility. Uses <i>Z = 1.65</i> for 95% service level, lead time <i>L</i> (days), and 30% std dev estimation.", tbl_cell_style)
        ],
        [
            Paragraph("<b>Reorder Point (ROP)</b>", tbl_cell_style),
            Paragraph("<i>ROP = (d * L) + SS</i>", tbl_cell_style),
            Paragraph("Threshold stock level that triggers a replenishment purchase order before stockout occurs.", tbl_cell_style)
        ],
        [
            Paragraph("<b>Recommended Order Qty</b>", tbl_cell_style),
            Paragraph("<i>Q_rec = max(0, (D_30 + SS) - S_curr)</i>", tbl_cell_style),
            Paragraph("Target inventory level minus current stock (<i>S_curr</i>) to cover 30 days of sales plus safety stock.", tbl_cell_style)
        ],
        [
            Paragraph("<b>Demand Forecasting</b>", tbl_cell_style),
            Paragraph("RandomForestRegressor(n_estimators=100)<br/>Features: [day_index, day_of_week, day_of_month, month, is_weekend]", tbl_cell_style),
            Paragraph("Ensemble regression tree captures weekly patterns, weekend surges, and monthly seasonality.", tbl_cell_style)
        ],
        [
            Paragraph("<b>Anomaly Detection</b>", tbl_cell_style),
            Paragraph("<i>if |quantity_change| >= 20 and action in ['SALE', 'STOCK_OUT', 'ADJUSTMENT']</i>", tbl_cell_style),
            Paragraph("Flags sudden large inventory drops to prevent unauthorized theft or unrecorded bulk losses.", tbl_cell_style)
        ]
    ]

    formula_table = Table(formula_data, colWidths=[120, 190, 194])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(formula_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 5. REST API ENDPOINT REFERENCE
    # ---------------------------------------------------------
    story.append(Paragraph("5. Complete REST API Endpoint Specification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    api_endpoints = [
        ("POST", "/api/auth/login", "Auth", "Authenticates user credentials, returns JWT token & user object."),
        ("POST", "/api/auth/register", "Auth", "Registers new Store Owner or admin account."),
        ("POST", "/api/auth/forgot-password", "Auth", "Generates 6-digit OTP reset token with 15-min expiration for user account."),
        ("POST", "/api/auth/reset-password", "Auth", "Validates OTP reset token and updates password hash securely."),
        ("GET", "/api/products", "Products", "Fetches list of products with optional filters (?search= &low_stock=true &near_expiry=true)."),
        ("POST", "/api/products", "Products", "Creates a new product record; auto-generates barcode/QR if empty."),
        ("PUT", "/api/products/:id", "Products", "Updates existing product details, price, or stock levels."),
        ("DELETE", "/api/products/:id", "Products", "Deletes a product record (Owner/Admin only)."),
        ("POST", "/api/sales", "Sales", "Executes POS sale transaction, updates stock, creates SalesDetails & InventoryLog."),
        ("GET", "/api/sales", "Sales", "Retrieves historical sales transaction records with pagination."),
        ("GET", "/api/suppliers", "Suppliers", "Fetches all active vendor/supplier contact profiles."),
        ("POST", "/api/purchases", "Purchases", "Creates stock replenishment purchase order and auto-increments product stock."),
        ("GET", "/api/inventory/logs", "Inventory", "Fetches complete immutable movement audit log trail."),
        ("POST", "/api/inventory/adjust", "Inventory", "Executes manual stock adjustment with required audit reason notes."),
        ("GET", "/api/reports/dashboard", "Reports", "Aggregates key financial & inventory metrics for dashboard widgets."),
        ("POST", "/api/ai/forecast", "AI Engine", "Calculates 30-day machine learning demand forecast for a given product."),
        ("POST", "/api/ai/reorder", "AI Engine", "Computes statistical Reorder Point & Safety Stock recommendation."),
        ("POST", "/api/ai/batch-analysis", "AI Engine", "Batch processes all products to generate reorder alerts and demand trends."),
        ("GET", "/api/users", "Users", "Lists all staff accounts under current logged-in Store Owner."),
        ("POST", "/api/users", "Users", "Creates new staff account with custom JSON permissions array.")
    ]

    api_tbl_data = [[Paragraph("Method", tbl_header_style), Paragraph("Endpoint Path", tbl_header_style), Paragraph("Module", tbl_header_style), Paragraph("Description", tbl_header_style)]]
    for method, path, mod, desc in api_endpoints:
        method_color = "#16A34A" if method == "GET" else ("#2563EB" if method == "POST" else ("#D97706" if method == "PUT" else "#DC2626"))
        method_p = Paragraph(f"<font color='{method_color}'><b>{method}</b></font>", tbl_cell_style)
        api_tbl_data.append([method_p, Paragraph(f"<code>{path}</code>", tbl_cell_style), Paragraph(mod, tbl_cell_style), Paragraph(desc, tbl_cell_style)])

    api_table = Table(api_tbl_data, colWidths=[50, 160, 70, 224])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # 6. SYSTEM SETUP & DEPLOYMENT GUIDE
    # ---------------------------------------------------------
    story.append(Paragraph("6. Installation, Configuration & System Setup Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SECONDARY, spaceBefore=0, spaceAfter=8))

    setup_instructions = (
        "<b>Step 1: Database Setup</b><br/>"
        "1. Create MySQL Database: <code>CREATE DATABASE inventory_db;</code><br/>"
        "2. Execute SQL schema script: <code>mysql -u root -p inventory_db < database/schema.sql</code><br/>"
        "3. (Optional) Insert seed data: <code>mysql -u root -p inventory_db < database/seed.sql</code><br/><br/>"
        "<b>Step 2: Backend Node.js Service Setup</b><br/>"
        "1. Navigate to <code>backend/</code> directory and install packages: <code>npm install</code><br/>"
        "2. Configure environment file <code>backend/.env</code>:<br/>"
        "<code>PORT=5000<br/>DB_HOST=localhost<br/>DB_USER=root<br/>DB_PASSWORD=yourpassword<br/>DB_NAME=inventory_db<br/>JWT_SECRET=your_super_secret_jwt_key</code><br/>"
        "3. Launch server: <code>npm run dev</code> (Server runs on http://localhost:5000)<br/><br/>"
        "<b>Step 3: AI Engine Python Service Setup</b><br/>"
        "1. Navigate to <code>ai/</code> directory.<br/>"
        "2. Create virtual environment & install requirements: <code>pip install -r requirements.txt</code><br/>"
        "3. Start Flask AI server: <code>python app.py</code> (Runs on http://localhost:5001)<br/><br/>"
        "<b>Step 4: Frontend React Web Client Setup</b><br/>"
        "1. Navigate to <code>frontend/</code> directory.<br/>"
        "2. Install npm dependencies: <code>npm install</code><br/>"
        "3. Launch Vite development server: <code>npm run dev</code> (Client runs on http://localhost:5173)<br/><br/>"
        "<b>Step 5: Docker Multi-Container Deployment</b><br/>"
        "Build and launch all services simultaneously using Docker Compose:<br/>"
        "<code>docker-compose up --build -d</code>"
    )
    story.append(Paragraph(setup_instructions, body_style))
    story.append(Spacer(1, 15))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated documentation PDF: {filename}")

if __name__ == '__main__':
    target_path = "/Users/jenis/Documents/mscit/AI_Inventory_Management_System_Documentation.pdf"
    build_pdf(target_path)
