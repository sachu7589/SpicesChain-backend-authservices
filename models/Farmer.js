const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  dateOfBirth: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  emailAddress: { type: String, required: false }, // Optional
  
  // Address Information
  permanentAddress: { type: String, required: true },
  farmLocation: { type: String, required: false }, // Optional
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  
  // Authentication
  password: { type: String, required: true, minlength: 6 },
  
  // Metadata
  userType: { type: String, default: 'farmer' },
  createdAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model('Farmer', farmerSchema); 