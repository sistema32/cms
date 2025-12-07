CREATE TABLE IF NOT EXISTS lexcommerce_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'simple',
    status TEXT DEFAULT 'draft',
    price DECIMAL(10, 2),
    regular_price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    stock_status TEXT DEFAULT 'instock',
    stock_quantity INTEGER DEFAULT 0,
    manage_stock BOOLEAN DEFAULT 0,
    sku TEXT,
    description TEXT,
    short_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lexcommerce_product_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    FOREIGN KEY(product_id) REFERENCES lexcommerce_products(id) ON DELETE CASCADE
);
