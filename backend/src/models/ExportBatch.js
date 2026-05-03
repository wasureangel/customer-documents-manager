const db = require('../config/database');

class ExportBatch {
  static getAll(searchTerm = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          eb.*,
          c.name as customer_name
        FROM export_batches eb
        LEFT JOIN customers c ON eb.customer_id = c.id
      `;
      
      const params = [];
      
      if (searchTerm) {
        sql += ` WHERE eb.batch_number LIKE ? OR c.name LIKE ?`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }
      
      sql += ` ORDER BY eb.created_at DESC`;
      
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
          eb.*,
          c.name as customer_name
        FROM export_batches eb
        LEFT JOIN customers c ON eb.customer_id = c.id
        WHERE eb.customer_id = ?
        ORDER BY eb.created_at DESC
      `;
      db.all(sql, [customerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    const Document = require('./Document');
    const CustomerDocType = require('./CustomerDocType');

    const getBatch = () => new Promise((resolve, reject) => {
      const sql = `
        SELECT
          eb.*,
          c.name as customer_name
        FROM export_batches eb
        LEFT JOIN customers c ON eb.customer_id = c.id
        WHERE eb.id = ?
      `;
      db.get(sql, [id], (err, batch) => {
        if (err) reject(err);
        else resolve(batch);
      });
    });

    return getBatch().then(async (batch) => {
      if (!batch) return null;

      const documents = await Document.getByBatchId(id);
      const requiredDocTypes = await CustomerDocType.getRequiredDetailsByCustomerId(batch.customer_id);

      const uploadedRequiredTypes = new Set(
        documents
          .filter(d => requiredDocTypes.some(t => t.id === d.document_type_id))
          .map(d => d.document_type_id)
      );

      const completionRate = requiredDocTypes.length > 0
        ? Math.round((uploadedRequiredTypes.size / requiredDocTypes.length) * 100)
        : 100;

      return {
        ...batch,
        documents,
        requiredDocTypes,
        completionRate
      };
    });
  }

  static generateBatchNumber() {
    return new Promise((resolve, reject) => {
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yy}${mm}${dd}`;

      db.all('SELECT batch_number FROM export_batches WHERE batch_number LIKE ? ORDER BY id DESC LIMIT 1',
        [`${dateStr}%`],
        (err, rows) => {
          if (err) reject(err);
          else {
            let letter = 'A';
            if (rows.length > 0) {
              const lastNumber = rows[0].batch_number;
              const lastLetter = lastNumber.slice(-1);
              if (lastLetter >= 'A' && lastLetter <= 'Z') {
                letter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
              }
            }
            resolve(`${dateStr}${letter}`);
          }
        }
      );
    });
  }

  static create(customerId, batchNumber = null, billOfLading = null) {
    const generateNumber = batchNumber
      ? Promise.resolve(batchNumber)
      : this.generateBatchNumber();

    return generateNumber.then(finalBatchNumber => {
      return new Promise((resolve, reject) => {
        // Check for duplicate batch_number
        db.get('SELECT id FROM export_batches WHERE batch_number = ?', [finalBatchNumber], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (row) {
            reject(new Error('出口发票号已存在'));
            return;
          }

          const sql = `
            INSERT INTO export_batches (customer_id, batch_number, bill_of_lading, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;
          db.run(sql, [customerId, finalBatchNumber, billOfLading], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      });
    }).then(lastID => ExportBatch.getById(lastID));
  }

  static update(id, batchNumber, billOfLading = null) {
    return new Promise((resolve, reject) => {
      // Check for duplicate batch_number (excluding current record)
      db.get('SELECT id FROM export_batches WHERE batch_number = ? AND id != ?', [batchNumber, id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (row) {
          reject(new Error('出口发票号已存在'));
          return;
        }

        const sql = `
          UPDATE export_batches
          SET batch_number = ?, bill_of_lading = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        db.run(sql, [batchNumber, billOfLading, id], (err) => {
          if (err) reject(err);
          else ExportBatch.getById(id).then(resolve);
        });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM export_batches WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = ExportBatch;
