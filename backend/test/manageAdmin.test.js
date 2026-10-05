const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../src/models');
const { executeAdminManagement } = require('../src/scripts/manageAdmin');

describe('Admin Management CLI Safeguards Test Suite', () => {
  before(async () => {
    await sequelize.authenticate();
  });

  describe('Pre-connection validation', () => {
    test('rejects missing or unknown commands before touching database', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'unknownCommand', 'admin@example.com'],
          });
        },
        /Invalid or missing command/
      );
    });

    test('rejects invalid or missing email addresses', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'promote', 'not-an-email'],
          });
        },
        /Invalid email address/
      );

      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'promote'],
          });
        },
        /Invalid email address/
      );
    });

    test('rejects passing passwords as positional CLI arguments', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: [
              'node',
              'manageAdmin.js',
              'create',
              'operator@example.com',
              'Operator User',
              'PositionalPass123!', // Disallowed positional argument
            ],
          });
        },
        /Passing passwords as positional command-line arguments is strictly prohibited/
      );
    });

    test('rejects create with missing or short name', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'create', 'newadmin@example.com', ' '],
            env: { ADMIN_PASSWORD: 'ValidPassword123!' },
          });
        },
        /Name is required and must be at least 2 characters long/
      );
    });

    test('rejects short passwords (< 6 characters)', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'create', 'shortpwd@example.com', 'Admin User', '--confirm'],
            env: { ADMIN_PASSWORD: '123' },
          });
        },
        /Admin password must be at least 6 characters long/
      );
    });
  });

  describe('Database checks & operation execution', () => {
    const testTimestamp = Date.now();
    const existingCustomerEmail = `cli_customer_${testTimestamp}@example.com`;
    const newAdminEmail = `cli_newadmin_${testTimestamp}@example.com`;

    before(async () => {
      const hash = await bcrypt.hash('CustPass123!', 10);
      await User.create({
        name: 'CLI Test Customer',
        email: existingCustomerEmail,
        role: 'customer',
        password: hash,
      });
    });

    after(async () => {
      await User.destroy({
        where: {
          email: [existingCustomerEmail, newAdminEmail],
        },
      });
    });

    test('promote fails when target user does not exist', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'promote', `nonexistent_${Date.now()}@example.com`, '--confirm'],
          });
        },
        /not found/
      );
    });

    test('create fails when user already exists', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'create', existingCustomerEmail, 'Existing User', '--confirm'],
            env: { ADMIN_PASSWORD: 'ValidPassword123!' },
          });
        },
        /already exists/
      );
    });

    test('fails if confirmation is not provided in non-interactive environment', async () => {
      // Not a TTY, no --confirm flag provided
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'promote', existingCustomerEmail],
            env: {}, // no ADMIN_CONFIRM
          });
        },
        /Confirmation required/
      );
    });

    test('aborts if interactive user declines confirmation prompt', async () => {
      await assert.rejects(
        async () => {
          await executeAdminManagement({
            argv: ['node', 'manageAdmin.js', 'promote', existingCustomerEmail],
            env: {},
            promptQuestionFn: async () => 'no', // user types 'no'
          });
        },
        /Operation cancelled by user/
      );

      // Verify role was not changed
      const user = await User.findOne({ where: { email: existingCustomerEmail } });
      assert.equal(user.role, 'customer');
    });

    test('successfully promotes existing customer with --confirm flag', async () => {
      const result = await executeAdminManagement({
        argv: ['node', 'manageAdmin.js', 'promote', existingCustomerEmail, '--confirm'],
      });

      assert.equal(result.success, true);
      assert.ok(result.message.includes('[AUDIT]'));
      assert.ok(result.message.includes('successfully promoted to \'admin\''));

      const user = await User.findOne({ where: { email: existingCustomerEmail } });
      assert.equal(user.role, 'admin');
    });

    test('successfully creates new admin using ADMIN_PASSWORD env and --confirm flag', async () => {
      const result = await executeAdminManagement({
        argv: ['node', 'manageAdmin.js', 'create', newAdminEmail, 'CLI Created Admin', '--confirm'],
        env: { ADMIN_PASSWORD: 'SecretAdminPassword123!' },
      });

      assert.equal(result.success, true);
      assert.ok(result.message.includes('[AUDIT]'));

      const created = await User.findOne({ where: { email: newAdminEmail } });
      assert.ok(created);
      assert.equal(created.role, 'admin');
      assert.equal(created.name, 'CLI Created Admin');

      // Verify password was hashed properly
      const withPwd = await User.scope('withPassword').findOne({ where: { email: newAdminEmail } });
      assert.ok(await bcrypt.compare('SecretAdminPassword123!', withPwd.password));
    });
  });
});
