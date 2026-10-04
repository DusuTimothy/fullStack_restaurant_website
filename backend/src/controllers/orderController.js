const orderService = require('../services/orderService');

// GET /api/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, userId } = req.query;

    const orders = await orderService.getAllOrders({
      currentUser: req.user,
      status,
      userId,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderByIdWithDetails(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${id} not found`,
      });
    }

    // Role check: Customers can only view their own orders
    if (!orderService.canAccessOrder(req.user, order)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own orders',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { notes, items } = req.body;
    const userId = req.user.id;

    const result = await orderService.createOrder({ userId, notes, items });

    if (result.validationError) {
      const { missingItems, unavailableItems } = result.validationError;

      if (missingItems.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'One or more menu items were not found',
          details: missingItems.map((id) => ({
            field: 'items',
            message: `Menu item #${id} does not exist`,
          })),
        });
      }

      if (unavailableItems.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'One or more items are currently unavailable',
          details: unavailableItems.map((name) => ({
            field: 'items',
            message: `'${name}' is currently sold out / unavailable`,
          })),
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result.order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await orderService.findOrderById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${id} not found`,
      });
    }

    // Permissions check
    if (!orderService.canUpdateOrderStatus(req.user, order, status)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Customers can only cancel their own pending orders',
      });
    }

    const updatedOrder = await orderService.updateOrderStatus(order, status);

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.findOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${id} not found`,
      });
    }

    if (!orderService.canDeleteOrder(req.user, order)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Customers can only cancel their own pending orders',
      });
    }

    await orderService.deleteOrder(order);

    return res.status(200).json({
      success: true,
      message: `Order with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
