/**
 * Migration: Add category field to document_types table
 * Date: 2025-04-14
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    // Check if category column already exists
    db.all('PRAGMA table_info(document_types)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasCategory = columns.some(col => col.name === 'category');

      if (!hasCategory) {
        // Add category column with default value '报关资料'
        db.run(
          'ALTER TABLE document_types ADD COLUMN category TEXT DEFAULT "报关资料"',
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Migration completed: Added category column to document_types table');
              resolve();
            }
          }
        );
      } else {
        console.log('Migration skipped: category column already exists');
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
