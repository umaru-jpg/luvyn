// Test script for email functionality - simplified version
require('dotenv').config(); // Load environment variables

// Test nodemailer directly
const nodemailer = require('nodemailer');
console.log('Nodemailer loaded successfully:', typeof nodemailer.createTransport);

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS
  }
});

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

// Function to send order confirmation email to customer
const sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Calculate total items in the order
    const totalItems = order.products.reduce((total, product) => total + product.quantity, 0);

    // Build the email HTML content with structured order details
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #4a90e2; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .section { margin-bottom: 25px; }
          .order-summary { background: #f9f9f9; padding: 15px; border-radius: 5px; }
          .product-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .product-item:last-child { border-bottom: none; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #777; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 0; text-align: left; border-bottom: 1px solid #eee; }
          .total-row { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>konfirmasi Pesanan</h1>
            <p>Terima kasih telah berbelanja di toko kami!</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Halo ${user.full_name || user.username || 'Pelanggan'},</h2>
              <p>Pesanan Anda telah berhasil dibuat. Berikut adalah detail pesanan Anda:</p>
            </div>
            
            <div class="section order-summary">
              <h3>Ringkasan Pesanan #${order._id}</h3>
              <p><strong>Tanggal Pesanan:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
              <p><strong>Status Pesanan:</strong> ${order.status}</p>
              <p><strong>Metode Pembayaran:</strong> ${order.paymentMethod}</p>
              ${order.transactionId ? `<p><strong>ID Transaksi:</strong> ${order.transactionId}</p>` : ''}
            </div>
            
            <div class="section">
              <h3>Daftar Produk</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kuantitas</th>
                    <th>Harga Satuan</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.products.map(product => `
                    <tr>
                      <td>${product.name}</td>
                      <td>${product.quantity}</td>
                      <td>Rp ${(product.price).toLocaleString('id-ID')}</td>
                      <td>Rp ${(product.price * product.quantity).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="section">
              <h3>Alamat Pengiriman</h3>
              ${order.shippingAddress ? `
                <p><strong>Nama:</strong> ${order.shippingAddress.fullName}</p>
                <p><strong>Alamat:</strong> ${order.shippingAddress.address}</p>
                <p><strong>Kota:</strong> ${order.shippingAddress.city}</p>
                <p><strong>Kode Pos:</strong> ${order.shippingAddress.postalCode}</p>
                <p><strong>Negara:</strong> ${order.shippingAddress.country}</p>
              ` : '<p>Alamat pengiriman tidak disediakan</p>'}
            </div>
            
            <div class="section">
              <table>
                <tr>
                  <td>Total Produk:</td>
                  <td>${totalItems}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Pembayaran:</td>
                  <td>Rp ${order.totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <p>Silakan simpan email ini sebagai bukti pembelian Anda. Jika Anda memiliki pertanyaan tentang pesanan Anda, jangan ragu untuk menghubungi kami.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Toko Luvyn. Semua Hak Dilindungi.</p>
            <p>Silakan jangan membalas email ini karena dikirim secara otomatis.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER || '"Toko Luvyn" <no-reply@luvyn.com>',
      to: user.email,
      subject: `Konfirmasi Pesanan #${order._id} - Toko Luvyn`,
      html: htmlContent
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

// Send test email
sendOrderConfirmationEmail(mockOrder, mockUser)
  .then(result => {
    console.log('Email sent successfully:', result);
  })
  .catch(error => {
    console.error('Error sending email:', error);
  });