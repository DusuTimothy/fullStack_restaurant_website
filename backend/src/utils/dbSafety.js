const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/**
 * Checks whether the target database is clearly a local development or test database.
 * Rejects remote hosts, cloud providers, and databases named or marked for production.
 *
 * @param {object} [env=process.env] - Environment variables object
 * @returns {{ isLocal: boolean, reason?: string, host?: string, database?: string }}
 */
const checkDatabaseLocality = (env = process.env) => {
  const dialect = env.DB_DIALECT || 'postgres';

  if (dialect === 'sqlite') {
    const storage = env.SQLITE_STORAGE || 'restaurant.sqlite';
    const storageLower = storage.toLowerCase();
    if (storageLower.includes('prod') || storageLower.includes('live')) {
      return {
        isLocal: false,
        reason: `SQLite storage path "${storage}" appears to be configured for production.`,
        database: storage,
      };
    }
    return { isLocal: true, host: 'localhost', database: storage };
  }

  let host = env.DB_HOST || 'localhost';
  let database = env.DB_NAME || 'restaurant_db';

  if (env.DATABASE_URL) {
    try {
      const parsed = new URL(env.DATABASE_URL);
      host = parsed.hostname;
      database = parsed.pathname.replace(/^\//, '');
    } catch {
      return {
        isLocal: false,
        reason: 'Unable to parse DATABASE_URL to verify database host locality.',
      };
    }
  }

  // Verify host is strictly local
  if (!LOCAL_HOSTNAMES.has(host.toLowerCase())) {
    return {
      isLocal: false,
      reason: `Target database host "${host}" is not a recognized local development host (${Array.from(LOCAL_HOSTNAMES).join(', ')}).`,
      host,
      database,
    };
  }

  // Verify database name does not indicate production
  const dbLower = database.toLowerCase();
  if (dbLower.includes('prod') || dbLower.includes('live')) {
    return {
      isLocal: false,
      reason: `Target database name "${database}" indicates a production or live environment.`,
      host,
      database,
    };
  }

  return { isLocal: true, host, database };
};

/**
 * Asserts that the current environment and target database are safe for destructive operations.
 * Throws an error if NODE_ENV is production or the database is not local.
 *
 * @param {string} [operationName='Destructive operation'] - Human-readable name of the operation
 * @param {object} [env=process.env] - Environment variables object
 */
const assertSafeForDestructiveOperation = (operationName = 'Destructive operation', env = process.env) => {
  const nodeEnv = (env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    throw new Error(
      `[SECURITY] ${operationName} is strictly forbidden in production (NODE_ENV=${env.NODE_ENV}).`
    );
  }

  const locality = checkDatabaseLocality(env);
  if (!locality.isLocal) {
    throw new Error(
      `[SECURITY] ${operationName} aborted: ${locality.reason}`
    );
  }
};

/**
 * Asserts that the current environment and target database are safe for ordinary seeding.
 * Throws an error if NODE_ENV is production or the database is not local.
 *
 * @param {object} [env=process.env] - Environment variables object
 */
const assertSafeForOrdinarySeed = (env = process.env) => {
  const nodeEnv = (env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    throw new Error(
      `[SECURITY] Database seeding is strictly forbidden in production (NODE_ENV=${env.NODE_ENV}).`
    );
  }

  const locality = checkDatabaseLocality(env);
  if (!locality.isLocal) {
    throw new Error(
      `[SECURITY] Database seeding aborted: ${locality.reason}`
    );
  }
};

/**
 * Checks if the database contains existing records.
 *
 * @param {{ User: object, Category: object, MenuItem: object }} models
 * @returns {Promise<{ isEmpty: boolean, counts: { users: number, categories: number, menuItems: number } }>}
 */
const checkDatabaseEmpty = async (models) => {
  const [users, categories, menuItems] = await Promise.all([
    models.User.count().catch(() => 0),
    models.Category.count().catch(() => 0),
    models.MenuItem.count().catch(() => 0),
  ]);

  const isEmpty = users === 0 && categories === 0 && menuItems === 0;
  return { isEmpty, counts: { users, categories, menuItems } };
};

/**
 * Asserts that the database has no existing data before running ordinary seed.
 *
 * @param {{ User: object, Category: object, MenuItem: object }} models
 */
const assertDatabaseEmptyForSeed = async (models) => {
  const { isEmpty, counts } = await checkDatabaseEmpty(models);
  if (!isEmpty) {
    throw new Error(
      `[SECURITY] Database already contains existing data (${counts.users} users, ${counts.categories} categories, ${counts.menuItems} menu items). ` +
      `Ordinary seed aborted to protect existing data.\n` +
      `If you intend to completely reset your local development database, run "npm run db:reset" (development only).`
    );
  }
};

module.exports = {
  LOCAL_HOSTNAMES,
  checkDatabaseLocality,
  assertSafeForDestructiveOperation,
  assertSafeForOrdinarySeed,
  checkDatabaseEmpty,
  assertDatabaseEmptyForSeed,
};
