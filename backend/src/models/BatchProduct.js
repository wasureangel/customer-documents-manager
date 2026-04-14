const db = require('../config/database');

class BatchProduct {
  /**
   * 获取批次的所有产品
   * @param {number} batchId - 批次ID
   * @returns {Promise<Array>} 产品列表
   */
  static getByBatchId(batchId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM batch_products
        WHERE batch_id = ?
        ORDER BY id
      `;
      db.all(sql, [batchId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 根据ID获取单个产品
   * @param {number} id - 产品ID
   * @returns {Promise<Object>} 产品对象
   */
  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM batch_products WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * 为批次创建产品
   * @param {number} batchId - 批次ID
   * @param {Object} data - 产品数据
   * @returns {Promise<Object>} 创建的产品对象
   */
  static create(batchId, data) {
    const { product_id, quantity = 0, unit_price = 0 } = data;

    // 如果提供了 product_id，从产品表获取产品名和型号
    const getProductInfo = product_id
      ? new Promise((resolve, reject) => {
          const sql = 'SELECT name, model FROM products WHERE id = ?';
          db.get(sql, [product_id], (err, row) => {
            if (err) reject(err);
            else resolve(row ? { name: row.name, model: row.model } : null);
          });
        })
      : Promise.resolve(null);

    return getProductInfo.then(productInfo => {
      const finalProductName = productInfo ? productInfo.name : '';
      const finalModel = productInfo ? productInfo.model : '';
      const total_price = (quantity || 0) * (unit_price || 0);

      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO batch_products (batch_id, product_name, model, quantity, unit_price, total_price, product_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(sql, [batchId, finalProductName, finalModel, quantity || 0, unit_price || 0, total_price, product_id || null], function(err) {
          if (err) reject(err);
          else BatchProduct.getById(this.lastID).then(resolve);
        });
      });
    });
  }

  /**
   * 更新产品
   * @param {number} id - 产品ID
   * @param {Object} data - 产品数据
   * @returns {Promise<Object>} 更新后的产品对象
   */
  static update(id, data) {
    const { product_name, model = '', quantity = 0, unit_price = 0 } = data;
    const total_price = (quantity || 0) * (unit_price || 0);

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE batch_products
        SET product_name = ?, model = ?, quantity = ?, unit_price = ?, total_price = ?
        WHERE id = ?
      `;
      db.run(sql, [product_name, model, quantity || 0, unit_price || 0, total_price, id], (err) => {
        if (err) reject(err);
        else BatchProduct.getById(id).then(resolve);
      });
    });
  }

  /**
   * 删除产品
   * @param {number} id - 产品ID
   * @returns {Promise<void>}
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM batch_products WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 计算批次总金额
   * @param {number} batchId - 批次ID
   * @returns {Promise<number>} 总金额
   */
  static getTotalAmount(batchId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COALESCE(SUM(total_price), 0) as total
        FROM batch_products
        WHERE batch_id = ?
      `;
      db.get(sql, [batchId], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
  }
}

module.exports = BatchProduct;
