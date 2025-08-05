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
    const { emailAddress, contactNumber, password, userType } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!userType || !['farmer', 'buyer'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userType (farmer or buyer) is required'
      });
    }

    // Find user based on email or contact number
    let user;
    const query = {};
    
    if (emailAddress) query.emailAddress = emailAddress;
    if (contactNumber) query.contactNumber = contactNumber;
    
    if (userType === 'farmer') {
      user = await Farmer.findOne(query);
    } else {
      user = await Buyer.findOne(query);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          userType: user.userType,
          isVerified: user.isVerified,
          ...(userType === 'buyer' && { businessName: user.businessName })
        },
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