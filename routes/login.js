const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key';

// Unified Login
router.post('/', async (req, res) => {
  try {
    const { emailAddress, contactNumber, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!emailAddress && !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email address or contact number is required'
      });
    }

    // Build query based on provided email or contact number
    const query = {};
    if (emailAddress) query.emailAddress = emailAddress;
    if (contactNumber) query.contactNumber = contactNumber;

    // Check in both Farmer and Buyer collections
    let user = null;
    let userType = null;

    // First check in Farmer collection
    const farmer = await Farmer.findOne(query);
    if (farmer) {
      const isPasswordValid = await bcrypt.compare(password, farmer.password);
      if (isPasswordValid) {
        user = farmer;
        userType = 'farmer';
      }
    }

    // If not found in Farmer, check in Buyer collection
    if (!user) {
      const buyer = await Buyer.findOne(query);
      if (buyer) {
        const isPasswordValid = await bcrypt.compare(password, buyer.password);
        if (isPasswordValid) {
          user = buyer;
          userType = 'buyer';
        }
      }
    }

    // If no user found or password is invalid
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare response data
    const userData = {
      id: user._id,
      fullName: user.fullName,
      userType: userType,
      isVerified: user.isVerified
    };

    // Add business name for buyers
    if (userType === 'buyer') {
      userData.businessName = user.businessName;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 