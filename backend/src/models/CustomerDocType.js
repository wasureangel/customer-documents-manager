const db = require('../config/database');

class CustomerDocType {
  /**
   * 获取客户的所有文件类型配置
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} 文件类型配置列表
   */
  static getByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          cdt.id,
          cdt.customer_id,
          cdt.document_type_id,
          cdt.is_required,
          dt.name as document_type_name,
          dt.description as document_type_description
        FROM customer_document_types cdt
        INNER JOIN document_types dt ON cdt.document_type_id = dt.id
        WHERE cdt.customer_id = ?
        ORDER BY dt.id
      `;
      db.all(sql, [customerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 获取客户的必需文件类型列表（用于完成度计算）
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} 必需文件类型ID列表
   */
  static getRequiredByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT document_type_id
        FROM customer_document_types
        WHERE customer_id = ? AND is_required = 1
      `;
      db.all(sql, [customerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 获取指定客户的必需文件类型详情
   * @param {number} customerId - 客户ID
   * @returns {Promise<Array>} 必需文件类型详情列表
   */
  static getRequiredDetailsByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          dt.id,
          dt.name,
          dt.description
        FROM customer_document_types cdt
        INNER JOIN document_types dt ON cdt.document_type_id = dt.id
        WHERE cdt.customer_id = ? AND cdt.is_required = 1
        ORDER BY dt.id
      `;
      db.all(sql, [customerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 更新单个配置项
   * @param {number} customerId - 客户ID
   * @param {number} documentTypeId - 文件类型ID
   * @param {boolean} isRequired - 是否必需
   */
  static upsert(customerId, documentTypeId, isRequired) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customer_document_types (customer_id, document_type_id, is_required)
        VALUES (?, ?, ?)
        ON CONFLICT(customer_id, document_type_id) DO UPDATE SET
          is_required = excluded.is_required
      `;
      db.run(sql, [customerId, documentTypeId, isRequired ? 1 : 0], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, customerId, documentTypeId, isRequired: isRequired ? 1 : 0 });
      });
    });
  }

  /**
   * 批量更新客户的文件类型配置
   * @param {number} customerId - 客户ID
   * @param {Array} configs - 配置数组 [{ document_type_id: number, is_required: boolean }]
   */
  static batchUpdate(customerId, configs) {
    return new Promise(async (resolve, reject) => {
      try {
        const results = [];
        for (const config of configs) {
          const result = await CustomerDocType.upsert(customerId, config.document_type_id, config.is_required);
          results.push(result);
        }
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 为新客户初始化文件类型配置（从 document_types 复制默认值）
   * @param {number} customerId - 客户ID
   */
  static initializeForCustomer(customerId) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customer_document_types (customer_id, document_type_id, is_required)
        SELECT ?, id, is_required
        FROM document_types
      `;
      db.run(sql, [customerId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  /**
   * 为新文件类型添加到所有客户
   * @param {number} documentTypeId - 文件类型ID
   * @param {boolean} isRequired - 默认是否必需
   */
  static addDocumentTypeToAllCustomers(documentTypeId, isRequired = false) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customer_document_types (customer_id, document_type_id, is_required)
        SELECT id, ?, ?
        FROM customers
      `;
      db.run(sql, [documentTypeId, isRequired ? 1 : 0], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  /**
   * 删除客户的所有文件类型配置
   * @param {number} customerId - 客户ID
   */
  static deleteByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM customer_document_types WHERE customer_id = ?', [customerId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = CustomerDocType;
