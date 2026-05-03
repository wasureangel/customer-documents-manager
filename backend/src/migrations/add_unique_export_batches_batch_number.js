/**
 * Migration: Add unique constraint to export_batches.batch_number
 * Date: 2026-04-19
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    // Check if unique constraint already exists
    db.all('PRAGMA index_list(export_batches)', (err, indexes) => {
      if (err) {
        reject(err);
        return;
      }

      const hasUnique = indexes.some(idx => idx.name === 'sqlite_autoindex_export_batches_1');

      if (!hasUnique) {
        // SQLite doesn't support ALTER TABLE to add unique constraint directly
        // We need to recreate the table
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Create new table with unique constraint
          db.run(`
            CREATE TABLE export_batches_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              customer_id INTEGER NOT NULL,
              batch_number TEXT NOT NULL UNIQUE,
              bill_of_lading TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Copy data (skip duplicates, keep first occurrence)
            db.run(`
              INSERT INTO export_batches_new (id, customer_id, batch_number, bill_of_lading, created_at, updated_at)
              SELECT MIN(id) as id, customer_id, batch_number, bill_of_lading, MIN(created_at) as created_at, MIN(updated_at) as updated_at
              FROM export_batches
              GROUP BY batch_number
            `, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              // Drop old table
              db.run('DROP TABLE export_batches', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                // Rename new table
                db.run('ALTER TABLE export_batches_new RENAME TO export_batches', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  // Recreate indexes
                  db.run('CREATE INDEX IF NOT EXISTS idx_export_batches_customer_id ON export_batches(customer_id)', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }

                    db.run('CREATE INDEX IF NOT EXISTS idx_documents_batch_id ON documents(batch_id)', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }

                      db.run('CREATE INDEX IF NOT EXISTS idx_batch_products_batch_id ON batch_products(batch_id)', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          reject(err);
                          return;
                        }

                        db.run('COMMIT', (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            console.log('Migration completed: Added unique constraint to export_batches.batch_number');
                            resolve();
                          }
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      } else {
        console.log('Migration skipped: unique constraint on export_batches.batch_number already exists');
        resolve();
      }
    });
  });
};

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration successful');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrate;
