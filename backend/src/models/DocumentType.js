const db = require('../config/database');

class DocumentType {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM document_types ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getRequired() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM document_types WHERE is_required = 1 ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM document_types WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getByName(name) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM document_types WHERE name = ?', [name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(name, description = null, isRequired = false, category = '报关资料') {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO document_types (name, description, is_required, category)
        VALUES (?, ?, ?, ?)
      `;
      db.run(sql, [name, description, isRequired ? 1 : 0, category], function(err) {
        if (err) reject(err);
        else DocumentType.getById(this.lastID).then(resolve);
      });
    });
  }

  static update(id, name, description = null, isRequired = false, category = '报关资料') {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE document_types
        SET name = ?, description = ?, is_required = ?, category = ?
        WHERE id = ?
      `;
      db.run(sql, [name, description, isRequired ? 1 : 0, category, id], (err) => {
        if (err) reject(err);
        else DocumentType.getById(id).then(resolve);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM document_types WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = DocumentType;
