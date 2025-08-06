const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  
  // Business Information
  businessName: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['wholesaler', 'retailer', 'exporter', 'manufacturer'], 
    required: true 
  },
  yearsInBusiness: { type: Number, required: true, min: 0 },
  contactNumber: { type: String, required: true },
  emailAddress: { type: String, required: true },
  
  // Business Address
  registeredOfficeAddress: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  
  // Authentication
  password: { type: String, required: true, minlength: 6 },
  
  // Metadata
  userType: { type: String, default: 'buyer' },
  createdAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false }
});

// Add index for email lookup
buyerSchema.index({ emailAddress: 1 });

module.exports = mongoose.model('Buyer', buyerSchema); 