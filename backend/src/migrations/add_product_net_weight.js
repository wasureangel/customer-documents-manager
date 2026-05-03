/**
 * Migration: Add unit_net_weight_kg column to products table
 * Date: 2026-04-20
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(products)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasNetWeightColumn = columns.some(col => col.name === 'unit_net_weight_kg');

      if (!hasNetWeightColumn) {
        db.run('ALTER TABLE products ADD COLUMN unit_net_weight_kg REAL DEFAULT 0', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Migration completed: Added unit_net_weight_kg column to products table');
            resolve();
          }
        });
      } else {
        console.log('Migration skipped: unit_net_weight_kg column already exists');
        resolve();
      }
    });
  });
};

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
