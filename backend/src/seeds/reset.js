const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { sequelize } = require('../models');
const { assertSafeForDestructiveOperation } = require('../utils/dbSafety');
const { seedData } = require('./seed');

/**
 * Explicit, development-only destructive database reset.
 * Strictly verifies environment safety (rejects NODE_ENV=production and remote databases)
 * before dropping and recreating all tables with clean demo data.
 */
const resetDatabase = async () => {
  try {
    console.log('🛡️  Verifying environment safety for destructive reset...');
    assertSafeForDestructiveOperation('Database Reset');

    console.log('🔄 Connecting to database for reset...');
    await sequelize.authenticate();
    console.log('✅ Connected. Performing destructive reset (dropping and recreating tables)...');

    await sequelize.sync({ force: true });
    console.log('✅ Tables reset successfully.');

    await seedData();

    console.log('🎉 Database successfully reset and seeded with fresh development sample data!');
    console.log('ℹ️  Note: Administrator accounts are NOT seeded. Use "npm run admin:create" to provision an administrator.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    try {
      await sequelize.close();
    } catch {
      // Ignore close errors
    }
    process.exit(1);
  }
};

if (require.main === module) {
  resetDatabase();
}

module.exports = {
  resetDatabase,
};
