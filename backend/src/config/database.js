const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dialect = process.env.DB_DIALECT || 'postgres';
const sslCaPath = process.env.DB_SSL_CA_PATH;

const postgresSsl = (() => {
  if (!isProduction && !sslCaPath) return undefined;

  const ssl = {
    rejectUnauthorized: true,
  };

  if (sslCaPath) {
    if (sslCaPath.includes('-----BEGIN CERTIFICATE-----')) {
      ssl.ca = sslCaPath;
    } else {
      const resolvedCaPath = path.isAbsolute(sslCaPath)
        ? sslCaPath
        : path.resolve(__dirname, '../..', sslCaPath);
      ssl.ca = fs.readFileSync(resolvedCaPath, 'utf8');
    }
  }

  return ssl;
})();

let sequelize;

if (process.env.DATABASE_URL) {
  let databaseUrl = process.env.DATABASE_URL;
  if (postgresSsl) {
    const parsedUrl = new URL(databaseUrl);
    ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'sslnegotiation'].forEach((key) => {
      parsedUrl.searchParams.delete(key);
    });
    databaseUrl = parsedUrl.toString();
  }

  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: postgresSsl ? { ssl: postgresSsl } : {}
  });
} else if (dialect === 'sqlite') {
  const storagePath = process.env.SQLITE_STORAGE || path.join(__dirname, '../../restaurant.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: isProduction ? false : (msg) => console.log(`[Sequelize SQLite] ${msg}`)
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'restaurant_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
      logging: isProduction ? false : (msg) => console.log(`[Sequelize Postgres] ${msg}`),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: postgresSsl ? { ssl: postgresSsl } : {},
    }
  );
}

module.exports = sequelize;
