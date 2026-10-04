/**
 * Admin Management CLI Script
 *
 * Safely create or promote administrator accounts outside public HTTP routes.
 * Strictly restricted to trusted operators via local command line.
 *
 * Usage:
 *   Promote existing user to admin:
 *     node src/scripts/manageAdmin.js promote <email> [--confirm]
 *
 *   Create a new admin user:
 *     node src/scripts/manageAdmin.js create <email> "<name>" [--confirm]
 *
 * Security Protections:
 *   - Prohibits passing passwords as positional CLI arguments to avoid leaking secrets in shell history and process listings.
 *   - Prompts for password securely without terminal echo, or reads from ADMIN_PASSWORD environment variable.
 *   - Validates command syntax, email format, name, and user existence before mutating data.
 *   - Requires explicit operator confirmation (--confirm or prompt).
 *   - Closes Sequelize cleanly on both success and error, producing appropriate exit codes.
 *   - Never logs passwords, hashes, or tokens.
 */

const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { sequelize, User } = require('../models');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const printUsage = () => {
  console.log(`
Aura Bistro - Admin Management CLI (Trusted Operator Tool)
==========================================================
Usage:
  Promote existing user to admin:
    node src/scripts/manageAdmin.js promote <email> [--confirm]

  Create a new admin user:
    node src/scripts/manageAdmin.js create <email> "<name>" [--confirm]

Security Rules:
  - Do NOT pass passwords as positional command-line arguments.
  - Set ADMIN_PASSWORD in environment or enter when prompted securely.
  - In automated / CI environments, specify --confirm or ADMIN_CONFIRM=yes.
`);
};

/**
 * Prompts user for sensitive secret input without echo in TTY.
 */
const defaultPromptSecret = (query) => {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(query);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let secret = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(secret);
      } else if (char === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        process.exit(130);
      } else if (char === '\u007f' || char === '\b') {
        if (secret.length > 0) {
          secret = secret.slice(0, -1);
        }
      } else {
        secret += char;
      }
    };
    stdin.on('data', onData);
  });
};

/**
 * Prompts user for standard confirmation.
 */
const defaultPromptQuestion = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

/**
 * Main admin management function.
 *
 * @param {object} options
 * @param {string[]} [options.argv=process.argv]
 * @param {object} [options.env=process.env]
 * @param {Function} [options.promptSecretFn=defaultPromptSecret]
 * @param {Function} [options.promptQuestionFn=defaultPromptQuestion]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const executeAdminManagement = async ({
  argv = process.argv,
  env = process.env,
  promptSecretFn = defaultPromptSecret,
  promptQuestionFn = defaultPromptQuestion,
  closeConnection = false,
} = {}) => {
  const rawArgs = argv.slice(2);
  const confirmFlags = new Set(['--confirm', '-y', '--yes']);
  const isConfirmedExplicitly = rawArgs.some((arg) => confirmFlags.has(arg)) || env.ADMIN_CONFIRM === 'yes';

  // Filter out flags from positional arguments
  const positionalArgs = rawArgs.filter((arg) => !confirmFlags.has(arg) && !arg.startsWith('--'));
  const [command, email, name] = positionalArgs;

  // 1. Pre-connection validation: Command
  if (!command || !['promote', 'create'].includes(command)) {
    printUsage();
    throw new Error('Invalid or missing command. Allowed commands: promote, create.');
  }

  // 2. Pre-connection validation: Email
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throw new Error(`Invalid email address: "${email || ''}". A valid email format is required.`);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 3. Pre-connection validation: Disallow positional passwords
  if (command === 'create') {
    if (!name || name.trim().length < 2) {
      throw new Error('Name is required and must be at least 2 characters long.');
    }

    if (positionalArgs.length > 3) {
      throw new Error(
        'Passing passwords as positional command-line arguments is strictly prohibited to prevent credential exposure in shell history and process listings. ' +
        'Supply the password via the ADMIN_PASSWORD environment variable or enter it at the secure prompt.'
      );
    }
  } else if (command === 'promote') {
    if (positionalArgs.length > 2) {
      throw new Error('Unexpected arguments for "promote" command. Usage: node manageAdmin.js promote <email> [--confirm]');
    }
  }

  // 4. Secure password resolution for create
  let password = '';
  if (command === 'create') {
    if (env.ADMIN_PASSWORD) {
      password = env.ADMIN_PASSWORD;
    } else {
      password = await promptSecretFn('Enter admin password (min 6 characters): ');
    }

    if (!password || password.length < 6) {
      throw new Error('Admin password must be at least 6 characters long.');
    }
  }

  // 5. Connect to database
  let connected = false;
  try {
    await sequelize.authenticate();
    connected = true;

    // 6. User existence checks before confirmation or changes
    if (command === 'promote') {
      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        throw new Error(`User with email "${normalizedEmail}" not found. Cannot promote non-existent user.`);
      }

      if (user.role === 'admin') {
        return {
          success: true,
          message: `User "${user.name}" (${normalizedEmail}) is already an administrator. No changes needed.`,
        };
      }

      // 7. Explicit confirmation
      if (!isConfirmedExplicitly) {
        const isInteractive = Boolean(process.stdin.isTTY) || promptQuestionFn !== defaultPromptQuestion;
        if (!isInteractive) {
          throw new Error('Confirmation required. Specify --confirm or ADMIN_CONFIRM=yes in non-interactive environments.');
        }
        const answer = await promptQuestionFn(`⚠️  Confirm: Promote user "${user.name}" (${normalizedEmail}) to administrator? [y/N]: `);
        if (!['y', 'yes'].includes((answer || '').toLowerCase().trim())) {
          throw new Error('Operation cancelled by user. No database changes were made.');
        }
      }

      // 8. Perform promotion
      await user.update({ role: 'admin' });
      return {
        success: true,
        message: `[AUDIT] User "${user.name}" (${normalizedEmail}) has been successfully promoted to 'admin'.`,
      };
    }

    if (command === 'create') {
      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing) {
        throw new Error(`User with email "${normalizedEmail}" already exists. Use 'promote' instead.`);
      }

      // 7. Explicit confirmation
      if (!isConfirmedExplicitly) {
        const isInteractive = Boolean(process.stdin.isTTY) || promptQuestionFn !== defaultPromptQuestion;
        if (!isInteractive) {
          throw new Error('Confirmation required. Specify --confirm or ADMIN_CONFIRM=yes in non-interactive environments.');
        }
        const answer = await promptQuestionFn(`⚠️  Confirm: Create new administrator account for "${normalizedEmail}"? [y/N]: `);
        if (!['y', 'yes'].includes((answer || '').toLowerCase().trim())) {
          throw new Error('Operation cancelled by user. No database changes were made.');
        }
      }

      // 8. Perform creation
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
      });

      return {
        success: true,
        message: `[AUDIT] New administrator account "${newAdmin.name}" (${normalizedEmail}) created successfully.`,
      };
    }
  } finally {
    if (closeConnection && connected) {
      try {
        await sequelize.close();
      } catch {
        // Ignore close errors
      }
    }
  }
};

const run = async () => {
  try {
    const result = await executeAdminManagement({ closeConnection: true });
    console.log(`✅ ${result.message}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    try {
      await sequelize.close();
    } catch {
      // Ignore close errors
    }
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = {
  executeAdminManagement,
};
