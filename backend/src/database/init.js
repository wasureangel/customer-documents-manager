const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/database.db');

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('开始初始化数据库...');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 创建表的 SQL 语句
const createTables = [
  // 创建客户表
  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 创建出口批次表
  `CREATE TABLE IF NOT EXISTS export_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    batch_number TEXT NOT NULL,
    bill_of_lading TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`,

  // 创建文件类型表
  `CREATE TABLE IF NOT EXISTS document_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_required INTEGER DEFAULT 0
  )`,

  // 创建文件记录表
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    document_type_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (batch_id) REFERENCES export_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE RESTRICT
  )`,

  // 创建客户文件类型关联表
  `CREATE TABLE IF NOT EXISTS customer_document_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    document_type_id INTEGER NOT NULL,
    is_required INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE CASCADE,
    UNIQUE(customer_id, document_type_id)
  )`,

  // 创建批次产品表
  `CREATE TABLE IF NOT EXISTS batch_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    model TEXT DEFAULT '',
    quantity REAL NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (batch_id) REFERENCES export_batches(id) ON DELETE CASCADE
  )`,

  // 创建订单表
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_number TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`,

  // 创建订单产品表
  `CREATE TABLE IF NOT EXISTS order_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    model TEXT DEFAULT '',
    quantity REAL NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    product_id INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`,

  // 创建产品表
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, model)
  )`,

  // 创建索引以提高查询性能
  `CREATE INDEX IF NOT EXISTS idx_export_batches_customer_id ON export_batches(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_batch_id ON documents(batch_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_document_type_id ON documents(document_type_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`,
  `CREATE INDEX IF NOT EXISTS idx_customer_document_types_customer_id ON customer_document_types(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customer_document_types_document_type_id ON customer_document_types(document_type_id)`,
  `CREATE INDEX IF NOT EXISTS idx_batch_products_batch_id ON batch_products(batch_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_products_order_id ON order_products(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`
];

// 插入默认外贸文件类型
const defaultDocTypes = [
  { name: '报关单', description: '海关报关单', is_required: 1 },
  { name: '装箱单', description: '出口货物装箱清单', is_required: 1 },
  { name: '商业发票', description: '商业贸易发票', is_required: 1 },
  { name: '申报要素', description: '海关申报要素表', is_required: 1 },
  { name: '提单', description: '海运提单(B/L)', is_required: 1 },
  { name: '产地证', description: '原产地证书', is_required: 0 },
  { name: '本地费用发票', description: '本地港杂费用发票', is_required: 0 },
  { name: '拖车报关发票', description: '拖车运输和报关费用发票', is_required: 0 },
  { name: '费用清单', description: '各项费用汇总清单', is_required: 0 }
];

// 迁移现有客户的文件类型配置
async function migrateCustomerDocumentTypes() {
  try {
    // 检查 customer_document_types 表是否已有数据
    const existingCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM customer_document_types', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (existingCount > 0) {
      console.log('客户文件类型配置已存在，跳过迁移');
      return;
    }

    // 获取所有客户
    const customers = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM customers', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 获取所有文件类型
    const documentTypes = await new Promise((resolve, reject) => {
      db.all('SELECT id, is_required FROM document_types', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (customers.length === 0 || documentTypes.length === 0) {
      console.log('没有客户或文件类型，跳过迁移');
      return;
    }

    // 为每个客户复制文件类型配置
    const insertStmt = db.prepare(`
      INSERT INTO customer_document_types (customer_id, document_type_id, is_required)
      VALUES (?, ?, ?)
    `);

    for (const customer of customers) {
      for (const docType of documentTypes) {
        await new Promise((resolve, reject) => {
          insertStmt.run(customer.id, docType.id, docType.is_required, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }
    insertStmt.finalize();

    console.log(`已为 ${customers.length} 个客户迁移文件类型配置`);
  } catch (error) {
    console.error('迁移客户文件类型配置失败:', error.message);
    // 不中断初始化流程，继续执行
  }
}

// 迁移 order_products 表，添加 product_id 列
async function migrateOrderProducts() {
  try {
    // 检查 product_id 列是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(order_products)', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasProductId = tableInfo.some(col => col.name === 'product_id');

    if (hasProductId) {
      console.log('order_products 表已有 product_id 列，跳过迁移');
      return;
    }

    // 添加 product_id 列
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE order_products ADD COLUMN product_id INTEGER', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('已为 order_products 表添加 product_id 列');
  } catch (error) {
    console.error('迁移 order_products 表失败:', error.message);
    // 不中断初始化流程，继续执行
  }
}

// 迁移 products 表，添加 product_code 列
async function migrateProducts() {
  try {
    // 检查 product_code 列是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(products)', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasProductCode = tableInfo.some(col => col.name === 'product_code');

    if (hasProductCode) {
      console.log('products 表已有 product_code 列，跳过迁移');
      return;
    }

    // 添加 product_code 列
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE products ADD COLUMN product_code TEXT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 为现有产品生成编号（0001, 0002...）
    const existingProducts = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM products ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (let i = 0; i < existingProducts.length; i++) {
      const code = String(i + 1).padStart(4, '0');
      await new Promise((resolve, reject) => {
        db.run('UPDATE products SET product_code = ? WHERE id = ?', [code, existingProducts[i].id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`已为 products 表添加 product_code 列，并为 ${existingProducts.length} 条现有记录生成编号`);
  } catch (error) {
    console.error('迁移 products 表失败:', error.message);
    // 不中断初始化流程，继续执行
  }
}

// 顺序执行所有创建表的语句
async function initDatabase() {
  try {
    // 创建所有表
    for (const sql of createTables) {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('所有表创建完成');

    // 插入默认文件类型
    const insertDocType = db.prepare(`
      INSERT OR IGNORE INTO document_types (name, description, is_required)
      VALUES (?, ?, ?)
    `);

    for (const docType of defaultDocTypes) {
      await new Promise((resolve, reject) => {
        insertDocType.run(docType.name, docType.description, docType.is_required, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    insertDocType.finalize();

    // 迁移数据：为现有客户初始化文件类型配置
    await migrateCustomerDocumentTypes();

    // 迁移数据：为 order_products 表添加 product_id 列
    await migrateOrderProducts();

    // 迁移数据：为 products 表添加 product_code 列
    await migrateProducts();

    console.log('数据库初始化完成！');
    console.log(`数据库文件位置: ${dbPath}`);

    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    db.close();
    process.exit(1);
  }
}

initDatabase();
