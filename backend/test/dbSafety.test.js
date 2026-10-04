const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  LOCAL_HOSTNAMES,
  checkDatabaseLocality,
  assertSafeForDestructiveOperation,
  assertSafeForOrdinarySeed,
  checkDatabaseEmpty,
  assertDatabaseEmptyForSeed,
} = require('../src/utils/dbSafety');
const { seedData } = require('../src/seeds/seed');

describe('Database Safety & Locality Safeguards Suite', () => {
  describe('checkDatabaseLocality()', () => {
    test('recognizes standard local hostnames as safe', () => {
      for (const host of ['localhost', '127.0.0.1', '::1', '0.0.0.0']) {
        const result = checkDatabaseLocality({ DB_HOST: host, DB_NAME: 'restaurant_dev' });
        assert.equal(result.isLocal, true, `Host ${host} should be local`);
        assert.equal(result.host, host);
      }
    });

    test('rejects remote database hosts', () => {
      const remoteHosts = [
        'rds.amazonaws.com',
        'db.myrestaurant.com',
        '192.168.1.50',
        '10.0.0.1',
      ];
      for (const host of remoteHosts) {
        const result = checkDatabaseLocality({ DB_HOST: host, DB_NAME: 'restaurant_dev' });
        assert.equal(result.isLocal, false);
        assert.ok(result.reason.includes('not a recognized local development host'));
      }
    });

    test('parses and validates DATABASE_URL locality correctly', () => {
      const localUrlResult = checkDatabaseLocality({
        DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/my_local_db',
      });
      assert.equal(localUrlResult.isLocal, true);
      assert.equal(localUrlResult.host, '127.0.0.1');
      assert.equal(localUrlResult.database, 'my_local_db');

      const remoteUrlResult = checkDatabaseLocality({
        DATABASE_URL: 'postgres://user:pass@postgres.internal.cloud:5432/restaurant_db',
      });
      assert.equal(remoteUrlResult.isLocal, false);
      assert.ok(remoteUrlResult.reason.includes('not a recognized local development host'));
    });

    test('rejects databases named or marked for production or live', () => {
      for (const dbName of ['production_db', 'prod_restaurant', 'live_data', 'restaurant_live']) {
        const result = checkDatabaseLocality({ DB_HOST: 'localhost', DB_NAME: dbName });
        assert.equal(result.isLocal, false);
        assert.ok(result.reason.includes('indicates a production or live environment'));
      }
    });

    test('handles SQLite locality and rejects production-named sqlite files', () => {
      const safeSqlite = checkDatabaseLocality({
        DB_DIALECT: 'sqlite',
        SQLITE_STORAGE: 'restaurant.sqlite',
      });
      assert.equal(safeSqlite.isLocal, true);

      const unsafeSqlite = checkDatabaseLocality({
        DB_DIALECT: 'sqlite',
        SQLITE_STORAGE: 'restaurant_prod.sqlite',
      });
      assert.equal(unsafeSqlite.isLocal, false);
      assert.ok(unsafeSqlite.reason.includes('configured for production'));
    });
  });

  describe('assertSafeForDestructiveOperation()', () => {
    test('throws when NODE_ENV is production or prod', () => {
      assert.throws(
        () => {
          assertSafeForDestructiveOperation('Database Reset', {
            NODE_ENV: 'production',
            DB_HOST: 'localhost',
            DB_NAME: 'restaurant_dev',
          });
        },
        (err) => {
          return (
            err instanceof Error &&
            err.message.includes('[SECURITY] Database Reset is strictly forbidden in production')
          );
        }
      );

      assert.throws(
        () => {
          assertSafeForDestructiveOperation('Database Reset', {
            NODE_ENV: 'prod',
            DB_HOST: 'localhost',
            DB_NAME: 'restaurant_dev',
          });
        },
        /strictly forbidden in production/
      );
    });

    test('throws when database host is remote even in development environment', () => {
      assert.throws(
        () => {
          assertSafeForDestructiveOperation('Database Reset', {
            NODE_ENV: 'development',
            DB_HOST: 'remote-server.com',
            DB_NAME: 'restaurant_dev',
          });
        },
        /not a recognized local development host/
      );
    });

    test('succeeds in development environment with local host', () => {
      assert.doesNotThrow(() => {
        assertSafeForDestructiveOperation('Database Reset', {
          NODE_ENV: 'development',
          DB_HOST: '127.0.0.1',
          DB_NAME: 'restaurant_dev',
        });
      });
    });
  });

  describe('assertSafeForOrdinarySeed()', () => {
    test('throws when NODE_ENV is production', () => {
      assert.throws(
        () => {
          assertSafeForOrdinarySeed({
            NODE_ENV: 'production',
            DB_HOST: 'localhost',
            DB_NAME: 'restaurant_dev',
          });
        },
        /Database seeding is strictly forbidden in production/
      );
    });

    test('throws when target database is remote', () => {
      assert.throws(
        () => {
          assertSafeForOrdinarySeed({
            NODE_ENV: 'development',
            DB_HOST: 'remote-db.corp.net',
            DB_NAME: 'restaurant_dev',
          });
        },
        /Target database host "remote-db.corp.net" is not a recognized local development host/
      );
    });

    test('succeeds in development on local database', () => {
      assert.doesNotThrow(() => {
        assertSafeForOrdinarySeed({
          NODE_ENV: 'development',
          DB_HOST: 'localhost',
          DB_NAME: 'restaurant_dev',
        });
      });
    });
  });

  describe('Existing data protection for ordinary seed', () => {
    test('checkDatabaseEmpty identifies empty vs non-empty database', async () => {
      const mockEmptyModels = {
        User: { count: async () => 0 },
        Category: { count: async () => 0 },
        MenuItem: { count: async () => 0 },
      };
      const emptyResult = await checkDatabaseEmpty(mockEmptyModels);
      assert.equal(emptyResult.isEmpty, true);

      const mockPopulatedModels = {
        User: { count: async () => 5 },
        Category: { count: async () => 2 },
        MenuItem: { count: async () => 10 },
      };
      const populatedResult = await checkDatabaseEmpty(mockPopulatedModels);
      assert.equal(populatedResult.isEmpty, false);
      assert.equal(populatedResult.counts.users, 5);
      assert.equal(populatedResult.counts.categories, 2);
      assert.equal(populatedResult.counts.menuItems, 10);
    });

    test('assertDatabaseEmptyForSeed refuses when database already has data and instructs how to reset', async () => {
      const mockPopulatedModels = {
        User: { count: async () => 4 },
        Category: { count: async () => 6 },
        MenuItem: { count: async () => 12 },
      };

      await assert.rejects(
        async () => {
          await assertDatabaseEmptyForSeed(mockPopulatedModels);
        },
        (err) => {
          assert.ok(err.message.includes('Database already contains existing data'));
          assert.ok(err.message.includes('Ordinary seed aborted to protect existing data'));
          assert.ok(err.message.includes('npm run db:reset'));
          return true;
        }
      );
    });

    test('assertDatabaseEmptyForSeed passes when database is empty', async () => {
      const mockEmptyModels = {
        User: { count: async () => 0 },
        Category: { count: async () => 0 },
        MenuItem: { count: async () => 0 },
      };

      await assert.doesNotReject(async () => {
        await assertDatabaseEmptyForSeed(mockEmptyModels);
      });
    });
  });

  describe('Seed password requirement safeguard', () => {
    test('seedData refuses to run when SEED_USER_PASSWORD is missing', async () => {
      const originalPassword = process.env.SEED_USER_PASSWORD;
      const originalDefault = process.env.SEED_DEFAULT_PASSWORD;
      delete process.env.SEED_USER_PASSWORD;
      delete process.env.SEED_DEFAULT_PASSWORD;

      try {
        await assert.rejects(
          async () => {
            await seedData();
          },
          (err) => {
            assert.ok(err.message.includes('SEED_USER_PASSWORD is not set'));
            assert.ok(err.message.includes('Never fall back to a public or hardcoded default credential'));
            return true;
          }
        );
      } finally {
        if (originalPassword) process.env.SEED_USER_PASSWORD = originalPassword;
        if (originalDefault) process.env.SEED_DEFAULT_PASSWORD = originalDefault;
      }
    });
  });
});
