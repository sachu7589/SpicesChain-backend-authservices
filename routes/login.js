const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const Admin = require('../models/Admin');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key';

// Google Login Endpoint
router.post('/google/login', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        message: "Invalid request data"
      });
    }

    // Check if user exists in database
    const farmer = await Farmer.findOne({ emailAddress: email });
    const buyer = await Buyer.findOne({ emailAddress: email });
    
    const user = farmer || buyer;
    const userType = farmer ? 'farmer' : buyer ? 'buyer' : null;

    // If user exists, generate JWT token and return user data
    if (user) {
      const token = jwt.sign(
        { userId: user._id, userType: userType },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Prepare user data
      const userData = {
        id: user._id,
        email: user.emailAddress,
        fullName: user.fullName,
        userType: userType,
        contactNumber: user.contactNumber,
        isVerified: user.isVerified
      };

      // Add business-specific fields for buyers
      if (userType === 'buyer') {
        userData.businessName = user.businessName;
        userData.businessType = user.businessType;
      }

      return res.status(200).json({
        success: true,
        data: {
          exists: true,
          token: token,
          user: userData
        },
        message: "Login successful"
      });
    }

    // If user doesn't exist, return not found response
    return res.status(200).json({
      success: true,
      data: {
        exists: false,
        email: email
      },
      message: "User not registered"
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      message: "Internal server error"
    });
  }
});

// Unified Login
router.post('/login', async (req, res) => {
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

    // Check in Farmer, Buyer, and Admin collections
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

    // If not found in Buyer, check in Admin collection
    if (!user) {
      const adminQuery = emailAddress ? { email: emailAddress } : {};
      const admin = await Admin.findOne(adminQuery);
      if (admin) {
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (isPasswordValid) {
          user = admin;
          userType = 'admin';
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
      userType: userType
    };

    // Add user-specific fields
    if (userType === 'farmer' || userType === 'buyer') {
      userData.fullName = user.fullName;
      userData.isVerified = user.isVerified;
    }

    if (userType === 'admin') {
      userData.email = user.email;
    }

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