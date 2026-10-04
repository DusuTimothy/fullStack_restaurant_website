const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dialect = process.env.DB_DIALECT || 'postgres';

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
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
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
