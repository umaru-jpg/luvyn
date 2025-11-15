const Order = require('../models/orderModel');
const { getUserById } = require('../utils/userHelper');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// Create a new order
const createOrder = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { products, totalAmount, shippingAddress, paymentMethod, transactionId } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products list is required and cannot be empty'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount is required and must be greater than 0'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Create the order object
    const orderData = {
      userId: req.user.userId, // Get from JWT token
      products,
      totalAmount,
      shippingAddress,
      paymentMethod,
      ...(transactionId && { transactionId }), // Add transactionId if provided
      status: 'confirmed' // Set initial status to confirmed after payment
    };

    // Create new order
    const newOrder = await Order.create(orderData);

    // Fetch user details to get email for sending confirmation
    const user = await getUserById(req.user.userId);

    // Send order confirmation email asynchronously (don't wait for it to complete)
    if (user && user.email) {
      try {
        await sendOrderConfirmationEmail(newOrder, user);
        console.log('Order confirmation email sent successfully to:', user.email);
      } catch (emailError) {
        // Log email error but don't fail the order creation
        console.error('Failed to send order confirmation email:', emailError);
        // Optionally, you could add a note to the order about email failure
      }
    } else {
      console.warn('User email not found for order confirmation:', newOrder._id);
    }

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat membuat pesanan'
    });
  }
};

// Get all orders for a specific user
const getUserOrders = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find orders based on userId from token
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Pesanan berhasil diambil',
      orders: orders
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil pesanan'
    });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const orderId = req.params.id;

    // Find order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    // Make sure the order belongs to the user who is logged in
    if (order.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda hanya dapat mengakses pesanan Anda sendiri'
      });
    }

    res.json({
      success: true,
      message: 'Pesanan berhasil diambil',
      order: order
    });
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil pesanan'
    });
  }
};

// Update order status (for admin functionality)
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Find and update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memperbarui status pesanan'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
};