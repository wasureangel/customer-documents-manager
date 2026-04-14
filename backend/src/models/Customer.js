const db = require('../config/database');

class Customer {
  static getAll(searchTerm = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          c.*,
          COUNT(eb.id) as batch_count
        FROM customers c
        LEFT JOIN export_batches eb ON c.id = eb.customer_id
      `;
      
      const params = [];
      
      if (searchTerm) {
        sql += ' WHERE c.name LIKE ?';
        params.push(`%${searchTerm}%`);
      }
      
      sql += `
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(name) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customers (name, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      db.run(sql, [name], function(err) {
        if (err) reject(err);
        else Customer.getById(this.lastID).then(resolve);
      });
    });
  }

  static update(id, name) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE customers 
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(sql, [name, id], (err) => {
        if (err) reject(err);
        else Customer.getById(id).then(resolve);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM customers WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Customer;
