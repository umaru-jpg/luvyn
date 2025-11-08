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
let User;

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

  User = mongoose.model('User', userSchema);
})
.catch(err => {
  console.log('Tidak dapat terhubung ke MongoDB, menggunakan storage sementara');
  dbConnected = false;
  
  // Fungsi storage sementara untuk pengguna
  const usersFile = path.join(__dirname, 'users.json');
  
  // Inisialisasi file users jika belum ada
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
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