const db = require('../config/database');

class Order {
  static getAll(searchTerm = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT
          o.*,
          c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
      `;

      const params = [];

      if (searchTerm) {
        sql += ` WHERE o.order_number LIKE ? OR c.name LIKE ?`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      sql += ` ORDER BY o.created_at DESC`;

      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          o.*,
          c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC
      `;
      db.all(sql, [customerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    const OrderProduct = require('./OrderProduct');

    const getOrder = () => new Promise((resolve, reject) => {
      const sql = `
        SELECT
          o.*,
          c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `;
      db.get(sql, [id], (err, order) => {
        if (err) reject(err);
        else resolve(order);
      });
    });

    return getOrder().then(async (order) => {
      if (!order) return null;

      const products = await OrderProduct.getByOrderId(id);
      const totalAmount = await OrderProduct.getTotalAmount(id);

      return {
        ...order,
        products,
        totalAmount
      };
    });
  }

  static generateOrderNumber() {
    return new Promise((resolve, reject) => {
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yy}${mm}${dd}`;

      db.all('SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1',
        [`ORD-${dateStr}%`],
        (err, rows) => {
          if (err) reject(err);
          else {
            let letter = 'A';
            if (rows.length > 0) {
              const lastNumber = rows[0].order_number;
              const lastLetter = lastNumber.slice(-1);
              if (lastLetter >= 'A' && lastLetter <= 'Z') {
                letter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
              }
            }
            resolve(`ORD-${dateStr}${letter}`);
          }
        }
      );
    });
  }

  static create(customerId, orderNumber = null) {
    const generateNumber = orderNumber
      ? Promise.resolve(orderNumber)
      : this.generateOrderNumber();

    return generateNumber.then(finalOrderNumber => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO orders (customer_id, order_number, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        db.run(sql, [customerId, finalOrderNumber], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    }).then(lastID => Order.getById(lastID));
  }

  static update(id, orderNumber) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE orders
        SET order_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.run(sql, [orderNumber, id], (err) => {
        if (err) reject(err);
        else Order.getById(id).then(resolve);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM orders WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Order;
