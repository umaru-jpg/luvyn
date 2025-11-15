// Test script for email functionality
require('dotenv').config(); // Load environment variables

const { sendOrderConfirmationEmail } = require('./services/emailService');

// Mock order and user data for testing
const mockOrder = {
  _id: 'test_order_123',
  products: [
    {
      name: 'Product 1',
      quantity: 2,
      price: 100000
    },
    {
      name: 'Product 2',
      quantity: 1,
      price: 250000
    }
  ],
  totalAmount: 450000,
  shippingAddress: {
    fullName: 'Test Customer',
    address: 'Jl. Test No. 123',
    city: 'Jakarta',
    postalCode: '12345',
    country: 'Indonesia'
  },
  paymentMethod: 'Credit Card',
  transactionId: 'txn_test_123',
  createdAt: new Date(),
  status: 'confirmed'
};

const mockUser = {
  email: process.env.EMAIL_USER || 'test@example.com',
  full_name: 'Test Customer',
  username: 'testuser'
};

console.log('Testing email functionality...');
console.log('Using email:', mockUser.email);

// Send test email
sendOrderConfirmationEmail(mockOrder, mockUser)
  .then(result => {
    console.log('Email sent successfully:', result);
  })
  .catch(error => {
    console.error('Error sending email:', error);
  });