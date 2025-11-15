const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Koneksi ke MongoDB - opsional, karena MongoDB mungkin tidak selalu berjalan
let dbConnected = false;
let User, Order;

// Make models available globally so other modules can access them
global.dbConnected = false;
global.User = null;
global.Order = null;

// Coba koneksi ke MongoDB, jika gagal gunakan storage sementara
mongoose.connect('mongodb://localhost:27017/luvyn-ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  dbConnected = true;
  console.log('Terhubung ke MongoDB');

    // Schema Pengguna
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    full_name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    }
  }, {
    timestamps: true
  });

  // Schema Pesanan
  const orderSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      }
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      postalCode: String,
      country: String
    },
    paymentMethod: {
      type: String,
      required: true
    },
    transactionId: {
      type: String, // For storing payment transaction ID
      required: false
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true
  });

  User = mongoose.model('User', userSchema);
  Order = mongoose.model('Order', orderSchema);

  // Assign to global for access by other modules
  global.dbConnected = dbConnected;
  global.User = User;
  global.Order = Order;
})
.catch(err => {
  console.log('Tidak dapat terhubung ke MongoDB, menggunakan storage sementara');
  dbConnected = false;

  // Fungsi storage sementara untuk pengguna
  const usersFile = path.join(__dirname, 'users.json');
  const ordersFile = path.join(__dirname, 'orders.json');

  // Inisialisasi file users jika belum ada
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }

  // Inisialisasi file orders jika belum ada
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([]));
  }

  // Fungsi untuk membaca users dari file
  const readUsers = () => {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  };

  // Fungsi untuk menulis users ke file
  const writeUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  };

  // Fungsi untuk membaca orders dari file
  const readOrders = () => {
    const data = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(data);
  };

  // Fungsi untuk menulis orders ke file
  const writeOrders = (orders) => {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
  };

  // Simulasi model User
  User = {
    findOne: async (query) => {
      const users = readUsers();
      if (query.email) {
        return users.find(user => user.email === query.email);
      } else if (query.username) {
        return users.find(user => user.username === query.username);
      }
      return null;
    },
    create: async (userData) => {
      const users = readUsers();
      const newUser = {
        _id: Date.now().toString(), // ID sementara
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      writeUsers(users);
      return newUser;
    }
  };

  // Simulasi model Order
  Order = {
    create: async (orderData) => {
      const orders = readOrders();
      const newOrder = {
        _id: Date.now().toString(), // ID sementara
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      orders.push(newOrder);
      writeOrders(orders);
      return newOrder;
    },
    find: async (query) => {
      const orders = readOrders();
      if (query.userId) {
        return orders.filter(order => order.userId === query.userId);
      }
      return orders;
    },
    findById: async (orderId) => {
      const orders = readOrders();
      return orders.find(order => order._id === orderId);
    }
  };

  // Assign to global for access by other modules
  global.dbConnected = dbConnected;
  global.User = User;
  global.Order = Order;
});

// Rute untuk registrasi
app.post('/api/register', [
  // Validasi input
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username harus antara 3-50 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('full_name').optional().isLength({ max: 100 }).withMessage('Nama lengkap maksimal 100 karakter')
], async (req, res) => {
  try {
    // Periksa validasi
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validasi gagal',
        errors: errors.array() 
      });
    }

    const { username, email, password, full_name } = req.body;

    // Periksa apakah username atau email sudah ada
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username atau email sudah digunakan' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      full_name
    });

    // Kembalikan response sukses
    res.status(201).json({ 
      success: true,
      message: 'Akun berhasil dibuat',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server' 
    });
  }
});

// Rute untuk login
app.post('/api/login', [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').exists().withMessage('Password diperlukan')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validasi gagal',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Email atau password salah' 
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Email atau password salah' 
      });
    }

    // Buat token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server' 
    });
  }
});

// Middleware untuk otentikasi JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak, token tidak ditemukan'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    req.user = user; // Menyimpan data user dari token
    next();
  });
};

const orderRoutes = require('./routes/orderRoutes');

// Gunakan rute pesanan
app.use('/api/orders', orderRoutes);

// Rute untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  if (!dbConnected) {
    console.log('Catatan: Server berjalan tanpa database MongoDB. Data akan disimpan sementara.');
  }
});