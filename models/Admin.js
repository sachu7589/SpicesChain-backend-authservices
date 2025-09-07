const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // Authentication
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Metadata
  userType: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});


module.exports = mongoose.model('Admin', adminSchema);
