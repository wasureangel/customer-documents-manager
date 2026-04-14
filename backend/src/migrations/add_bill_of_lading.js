/**
 * Migration: Add bill_of_lading field to export_batches table
 * Date: 2025-04-14
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    // Check if bill_of_lading column already exists
    db.all('PRAGMA table_info(export_batches)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasColumn = columns.some(col => col.name === 'bill_of_lading');

      if (!hasColumn) {
        // Add bill_of_lading column
        db.run(
          'ALTER TABLE export_batches ADD COLUMN bill_of_lading TEXT',
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Migration completed: Added bill_of_lading column to export_batches table');
              resolve();
            }
          }
        );
      } else {
        console.log('Migration skipped: bill_of_lading column already exists');
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
