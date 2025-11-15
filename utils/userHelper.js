// Helper function to get user by ID, compatible with both MongoDB and file storage
const getUserById = async (userId) => {
  // Use the global User model that was set in server.js
  if (global.dbConnected && global.User) {
    // Using MongoDB
    if (global.User.findById) {
      // Mongoose model
      return await global.User.findById(userId).select('email full_name username');
    } else {
      // Fallback to direct collection query if findById is not available
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      return user;
    }
  } else {
    // Using file storage - get user from users.json
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '..', 'users.json');

    if (!fs.existsSync(usersFile)) {
      return null;
    }

    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    return users.find(u => u._id === userId);
  }
};

module.exports = {
  getUserById
};