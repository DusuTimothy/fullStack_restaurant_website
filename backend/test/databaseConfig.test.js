const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

test('PostgreSQL config loads the configured CA and verifies the server certificate', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'restaurant-db-config-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const caPath = path.join(tempDir, 'provider-ca.pem');
  const caCertificate = '-----BEGIN CERTIFICATE-----\nexample-ca\n-----END CERTIFICATE-----\n';
  fs.writeFileSync(caPath, caCertificate);

  const script = `
    const sequelize = require('./src/config/database');
    process.stdout.write(JSON.stringify(sequelize.options.dialectOptions.ssl));
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?sslmode=require',
      DB_SSL_CA_PATH: caPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    rejectUnauthorized: true,
    ca: caCertificate,
  });
  assert.doesNotMatch(result.stderr, /SECURITY WARNING: The SSL modes/);
});

test('PostgreSQL config accepts an inline CA certificate', () => {
  const caCertificate = '-----BEGIN CERTIFICATE-----\nexample-ca\n-----END CERTIFICATE-----\n';
  const script = `
    const sequelize = require('./src/config/database');
    process.stdout.write(JSON.stringify(sequelize.options.dialectOptions.ssl));
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?sslmode=require',
      DB_SSL_CA_PATH: caCertificate,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    rejectUnauthorized: true,
    ca: caCertificate,
  });
  assert.doesNotMatch(result.stderr, /SECURITY WARNING: The SSL modes/);
});
