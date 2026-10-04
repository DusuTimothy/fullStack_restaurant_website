const { sequelize, Order, OrderItem, MenuItem, User } = require('../models');

/**
 * Checks whether a customer is allowed to access an order.
 *
 * @param {object} currentUser
 * @param {Order} order
 * @returns {boolean}
 */
const canAccessOrder = (currentUser, order) => {
  if (!currentUser) return false;
  if (currentUser.role !== 'customer') return true;
  return order.userId === currentUser.id;
};

/**
 * Checks whether a customer is permitted to cancel an order.
 * Customers can only cancel their own pending orders.
 * Staff and admins can update any status.
 *
 * @param {object} currentUser
 * @param {Order} order
 * @param {string} targetStatus
 * @returns {boolean}
 */
const canUpdateOrderStatus = (currentUser, order, targetStatus) => {
  if (!currentUser) return false;
  if (currentUser.role !== 'customer') return true;
  return order.userId === currentUser.id && targetStatus === 'cancelled' && order.status === 'pending';
};

/**
 * Checks whether a customer is permitted to delete/cancel an order.
 *
 * @param {object} currentUser
 * @param {Order} order
 * @returns {boolean}
 */
const canDeleteOrder = (currentUser, order) => {
  if (!currentUser) return false;
  if (currentUser.role !== 'customer') return true;
  return order.userId === currentUser.id && order.status === 'pending';
};

/**
 * Retrieves orders matching the requester's role and query filters.
 *
 * @param {object} params
 * @param {object} params.currentUser
 * @param {string} [params.status]
 * @param {string|number} [params.userId]
 * @returns {Promise<Order[]>}
 */
const getAllOrders = async ({ currentUser, status, userId }) => {
  const whereClause = {};

  if (currentUser && currentUser.role === 'customer') {
    whereClause.userId = currentUser.id;
  } else if (userId) {
    whereClause.userId = parseInt(userId, 10);
  }

  if (status) {
    whereClause.status = status;
  }

  return await Order.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role', 'phone'],
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: MenuItem,
            as: 'menuItem',
            attributes: ['id', 'name', 'price', 'imageUrl'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Finds an order by primary key with full user and item details.
 *
 * @param {number|string} id
 * @returns {Promise<Order|null>}
 */
const getOrderByIdWithDetails = async (id) => {
  return await Order.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role', 'phone'],
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: MenuItem,
            as: 'menuItem',
            attributes: ['id', 'name', 'description', 'price', 'imageUrl', 'categoryId'],
          },
        ],
      },
    ],
  });
};

/**
 * Finds order by primary key without deep associations.
 *
 * @param {number|string} id
 * @returns {Promise<Order|null>}
 */
const findOrderById = async (id) => {
  return await Order.findByPk(id);
};

/**
 * Validates requested order line items and calculates financial subtotal.
 *
 * @param {Array<{menuItemId: number, quantity: number}>} items
 * @returns {Promise<{ missingItems: number[], unavailableItems: string[], calculatedTotal: number, orderItemsToCreate: Array<object> }>}
 */
const validateAndCalculateOrderItems = async (items) => {
  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];
  const menuItems = await MenuItem.findAll({
    where: { id: menuItemIds },
  });

  const itemMap = new Map();
  menuItems.forEach((item) => itemMap.set(item.id, item));

  const missingItems = [];
  const unavailableItems = [];

  items.forEach((item) => {
    const found = itemMap.get(item.menuItemId);
    if (!found) {
      missingItems.push(item.menuItemId);
    } else if (!found.isAvailable) {
      unavailableItems.push(found.name);
    }
  });

  if (missingItems.length > 0 || unavailableItems.length > 0) {
    return { missingItems, unavailableItems, calculatedTotal: 0, orderItemsToCreate: [] };
  }

  let calculatedTotal = 0;
  const orderItemsToCreate = items.map((item) => {
    const menuItem = itemMap.get(item.menuItemId);
    const unitPrice = parseFloat(menuItem.price);
    const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
    calculatedTotal += subtotal;

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  calculatedTotal = Math.round(calculatedTotal * 100) / 100;

  return { missingItems, unavailableItems, calculatedTotal, orderItemsToCreate };
};

/**
 * Creates an order and its line items inside a database transaction.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {string} [params.notes]
 * @param {Array<object>} params.items
 * @returns {Promise<{ validationError?: { missingItems: number[], unavailableItems: string[] }, order?: Order }>}
 */
const createOrder = async ({ userId, notes, items }) => {
  const { missingItems, unavailableItems, calculatedTotal, orderItemsToCreate } =
    await validateAndCalculateOrderItems(items);

  if (missingItems.length > 0 || unavailableItems.length > 0) {
    return { validationError: { missingItems, unavailableItems } };
  }

  const createdOrder = await sequelize.transaction(async (t) => {
    const order = await Order.create(
      {
        userId,
        status: 'pending',
        totalAmount: calculatedTotal,
        notes: notes || null,
      },
      { transaction: t }
    );

    const itemsWithOrderId = orderItemsToCreate.map((oi) => ({
      ...oi,
      orderId: order.id,
    }));

    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    return order;
  });

  const completeOrder = await getOrderByIdWithDetails(createdOrder.id);
  return { order: completeOrder };
};

/**
 * Updates order status and returns refreshed order.
 *
 * @param {Order} order
 * @param {string} status
 * @returns {Promise<Order>}
 */
const updateOrderStatus = async (order, status) => {
  await order.update({ status });
  return await getOrderByIdWithDetails(order.id);
};

/**
 * Deletes an order instance.
 *
 * @param {Order} order
 * @returns {Promise<void>}
 */
const deleteOrder = async (order) => {
  return await order.destroy();
};

module.exports = {
  canAccessOrder,
  canUpdateOrderStatus,
  canDeleteOrder,
  getAllOrders,
  getOrderByIdWithDetails,
  findOrderById,
  validateAndCalculateOrderItems,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
