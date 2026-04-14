const db = require('../config/database');

class Document {
  static getByBatchId(batchId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          d.*,
          dt.name as document_type_name,
          dt.description as document_type_description,
          dt.is_required,
          dt.category
        FROM documents d
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        WHERE d.batch_id = ?
        ORDER BY d.uploaded_at DESC
      `;
      db.all(sql, [batchId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          d.*,
          dt.name as document_type_name,
          dt.description as document_type_description,
          dt.is_required,
          dt.category
        FROM documents d
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        WHERE d.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(batchId, documentTypeId, filePath, fileName, fileSize) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO documents (batch_id, document_type_id, file_path, file_name, file_size, uploaded_at, status)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')
      `;
      db.run(sql, [batchId, documentTypeId, filePath, fileName, fileSize], function(err) {
        if (err) reject(err);
        else Document.getById(this.lastID).then(resolve);
      });
    });
  }

  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE documents 
        SET status = ?
        WHERE id = ?
      `;
      db.run(sql, [status, id], (err) => {
        if (err) reject(err);
        else Document.getById(id).then(resolve);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM documents WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static getBatchStats(batchId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM documents
        WHERE batch_id = ?
      `;
      db.get(sql, [batchId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = Document;
