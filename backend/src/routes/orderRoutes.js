const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middlewares/validate');
const { authenticateUser } = require('../middlewares/auth');
const { createOrderSchema, updateOrderStatusSchema } = require('../schemas/orderSchema');

// All order operations require a valid authenticated user
router.get('/', authenticateUser, orderController.getAllOrders);
router.get('/:id', authenticateUser, orderController.getOrderById);
router.post('/', authenticateUser, validate(createOrderSchema), orderController.createOrder);
router.patch('/:id/status', authenticateUser, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.delete('/:id', authenticateUser, orderController.deleteOrder);

module.exports = router;
