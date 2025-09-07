const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key';

// Farmer Registration
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      gender,
      dateOfBirth,
      contactNumber,
      whatsappNumber,
      emailAddress,
      permanentAddress,
      farmLocation,
      district,
      state,
      pincode,
      password
    } = req.body;

    // Check if farmer already exists
    const existingFarmer = await Farmer.findOne({ 
      $or: [{ contactNumber }, { emailAddress }] 
    });

    if (existingFarmer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer with this contact number or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new farmer
    const farmer = new Farmer({
      fullName,
      gender,
      dateOfBirth,
      contactNumber,
      whatsappNumber,
      emailAddress,
      permanentAddress,
      farmLocation,
      district,
      state,
      pincode,
      password: hashedPassword
    });

    await farmer.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: farmer._id, userType: 'farmer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: {
        farmer: {
          id: farmer._id,
          fullName: farmer.fullName,
          userType: farmer.userType,
          isVerified: farmer.isVerified
        },
        token
      }
    });

  } catch (error) {
    console.error('Farmer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get All Farmers
router.get('/', async (req, res) => {
  try {
    const farmers = await Farmer.find({}, {
      password: 0, // Exclude password from response
      otp: 0,
      otpExpiry: 0
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Farmers retrieved successfully',
      data: {
        farmers: farmers,
        count: farmers.length
      }
    });

  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 