const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Category <-> MenuItem
Category.hasMany(MenuItem, {
  foreignKey: 'categoryId',
  as: 'menuItems',
  onDelete: 'RESTRICT',
});
MenuItem.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// User <-> Order
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'CASCADE',
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Order <-> OrderItem
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// MenuItem <-> OrderItem
MenuItem.hasMany(OrderItem, {
  foreignKey: 'menuItemId',
  as: 'orderItems',
});
OrderItem.belongsTo(MenuItem, {
  foreignKey: 'menuItemId',
  as: 'menuItem',
});

module.exports = {
  sequelize,
  User,
  Category,
  MenuItem,
  Order,
  OrderItem,
};
