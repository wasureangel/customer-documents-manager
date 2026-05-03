/**
 * Migration: Add unique constraint to customers.name
 * Date: 2026-04-19
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    // Check if unique constraint already exists
    db.all('PRAGMA index_list(customers)', (err, indexes) => {
      if (err) {
        reject(err);
        return;
      }

      const hasUnique = indexes.some(idx => idx.name === 'sqlite_autoindex_customers_1');

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
            CREATE TABLE customers_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Copy data (skip duplicates, keep first occurrence)
            db.run(`
              INSERT INTO customers_new (id, name, created_at, updated_at)
              SELECT MIN(id) as id, name, MIN(created_at) as created_at, MIN(updated_at) as updated_at
              FROM customers
              GROUP BY name
            `, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              // Drop old table
              db.run('DROP TABLE customers', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                // Rename new table
                db.run('ALTER TABLE customers_new RENAME TO customers', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  // Recreate index
                  db.run('CREATE INDEX IF NOT EXISTS idx_export_batches_customer_id ON export_batches(customer_id)', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }

                    db.run('COMMIT', (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        console.log('Migration completed: Added unique constraint to customers.name');
                        resolve();
                      }
                    });
                  });
                });
              });
            });
          });
        });
      } else {
        console.log('Migration skipped: unique constraint on customers.name already exists');
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
