const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key';

// Buyer Registration
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      businessName,
      businessType,
      yearsInBusiness,
      contactNumber,
      emailAddress,
      registeredOfficeAddress,
      city,
      district,
      state,
      pincode,
      password
    } = req.body;

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ 
      $or: [{ contactNumber }, { emailAddress }] 
    });

    if (existingBuyer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Buyer with this contact number or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new buyer
    const buyer = new Buyer({
      fullName,
      businessName,
      businessType,
      yearsInBusiness,
      contactNumber,
      emailAddress,
      registeredOfficeAddress,
      city,
      district,
      state,
      pincode,
      password: hashedPassword
    });

    await buyer.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: buyer._id, userType: 'buyer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully',
      data: {
        buyer: {
          id: buyer._id,
          fullName: buyer.fullName,
          businessName: buyer.businessName,
          userType: buyer.userType,
          isVerified: buyer.isVerified
        },
        token
      }
    });

  } catch (error) {
    console.error('Buyer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get All Buyers
router.get('/', async (req, res) => {
  try {
    const buyers = await Buyer.find({}, {
      password: 0, // Exclude password from response
      otp: 0,
      otpExpiry: 0
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Buyers retrieved successfully',
      data: {
        buyers: buyers,
        count: buyers.length
      }
    });

  } catch (error) {
    console.error('Get buyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 