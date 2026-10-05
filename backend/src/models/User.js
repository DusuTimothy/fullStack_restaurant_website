const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  role: {
    type: DataTypes.ENUM('customer', 'staff', 'admin'),
    allowNull: false,
    defaultValue: 'customer',
  },
  phone: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Allow null for existing users without passwords
  },
  isRestricted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] },
    },
  },
});

// Safeguard: Never leak password in JSON serialization
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
