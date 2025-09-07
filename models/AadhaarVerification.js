const mongoose = require('mongoose');

const aadhaarVerificationSchema = new mongoose.Schema({
  // User Reference (Farmer ID)
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmers'
  },
  
  // Aadhaar Data
  aadhaarData: {
    aadhaar_number: { 
      type: String,
      unique: true,
      validate: {
        validator: function(v) {
          return /^\d{12}$/.test(v);
        },
        message: 'Aadhaar number must be exactly 12 digits'
      }
    },
    name: { type: String },
    father_name: { type: String },
    mother_name: { type: String },
    date_of_birth: { type: String }, // Stored as string in DD/MM/YYYY format
    gender: { 
      type: String, 
      enum: ['Male', 'Female', 'Other']
    },
    address: { type: String },
    pin_code: { 
      type: String,
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Pin code must be exactly 6 digits'
      }
    },
    state: { type: String },
    district: { type: String }
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date }
});

// Update the updatedAt field before saving
aadhaarVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AadhaarVerification', aadhaarVerificationSchema);
