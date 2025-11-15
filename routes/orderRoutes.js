const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { createOrder, getUserOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');

// Create a new order (when customer completes payment)
router.post('/', authMiddleware, [
  // Validation rules
  body('products').isArray({ min: 1 }).withMessage('Products array is required'),
  body('products.*.productId').notEmpty().withMessage('Product ID is required'),
  body('products.*.name').notEmpty().withMessage('Product name is required'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('products.*.price').isNumeric().withMessage('Price must be a number'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  body('shippingAddress').optional().isObject(),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
], (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Call controller function
  createOrder(req, res);
});

// Get all orders for current user
router.get('/', authMiddleware, (req, res) => {
  // Call controller function
  getUserOrders(req, res);
});

// Get a specific order by ID
router.get('/:id', authMiddleware, (req, res) => {
  // Validate order ID
  const orderId = req.params.id;
  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }

  // Call controller function
  getOrderById(req, res);
});

// Update order status (admin functionality)
router.put('/:id/status', authMiddleware, (req, res) => {
  // Call controller function
  updateOrderStatus(req, res);
});

module.exports = router;