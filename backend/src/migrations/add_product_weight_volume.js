/**
 * Migration: Add unit_weight_kg and unit_volume_cbm to products table
 * Date: 2026-04-20
 */

const db = require('../config/database');

const migrate = async () => {
  return new Promise((resolve, reject) => {
    // Check if columns already exist
    db.all('PRAGMA table_info(products)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasWeightColumn = columns.some(col => col.name === 'unit_weight_kg');
      const hasVolumeColumn = columns.some(col => col.name === 'unit_volume_cbm');

      const migrations = [];

      if (!hasWeightColumn) {
        migrations.push(new Promise((resolve, reject) => {
          db.run('ALTER TABLE products ADD COLUMN unit_weight_kg REAL DEFAULT 0', (err) => {
            if (err) reject(err);
            else {
              console.log('Migration completed: Added unit_weight_kg column to products table');
              resolve();
            }
          });
        }));
      } else {
        console.log('Migration skipped: unit_weight_kg column already exists');
      }

      if (!hasVolumeColumn) {
        migrations.push(new Promise((resolve, reject) => {
          db.run('ALTER TABLE products ADD COLUMN unit_volume_cbm REAL DEFAULT 0', (err) => {
            if (err) reject(err);
            else {
              console.log('Migration completed: Added unit_volume_cbm column to products table');
              resolve();
            }
          });
        }));
      } else {
        console.log('Migration skipped: unit_volume_cbm column already exists');
      }

      Promise.all(migrations)
        .then(() => resolve())
        .catch(reject);
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
