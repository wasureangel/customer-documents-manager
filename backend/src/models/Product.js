const db = require('../config/database');

class Product {
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM products ORDER BY product_code';
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM products WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static generateProductCode() {
    return new Promise((resolve, reject) => {
      db.all('SELECT product_code FROM products ORDER BY product_code DESC LIMIT 1', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if (rows.length === 0) {
            resolve('0001');
          } else {
            const lastCode = rows[0].product_code;
            const lastNum = parseInt(lastCode, 10);
            const newNum = lastNum + 1;
            if (newNum > 9999) {
              reject(new Error('产品编号已达到最大值 9999'));
            } else {
              resolve(String(newNum).padStart(4, '0'));
            }
          }
        }
      });
    });
  }

  static create(name, model) {
    return Product.generateProductCode().then(code => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO products (product_code, name, model, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        db.run(sql, [code, name, model || ''], function(err) {
          if (err) reject(err);
          else Product.getById(this.lastID).then(resolve);
        });
      });
    });
  }

  static update(id, name, model) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE products
        SET name = ?, model = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(sql, [name, model || '', id], (err) => {
        if (err) reject(err);
        else Product.getById(id).then(resolve);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 检查产品是否被订单引用
   * @param {number} id - 产品ID
   * @returns {Promise<boolean>} 是否被引用
   */
  static isReferenced(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM order_products WHERE product_id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      });
    });
  }
}

module.exports = Product;
