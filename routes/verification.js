const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const AadhaarVerification = require('../models/AadhaarVerification');

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'spiceschain@gmail.com',
    pass: 'gmlv kaea eebq qfaz'
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP email
const sendOTPEmail = async (email, name, otp, userType) => {
  const subject = `🔐 Verify Your SpicesChain ${userType === 'farmer' ? 'Farmer' : 'Buyer'} Account`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - SpicesChain</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #2d5016, #4a7c59);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2d5016;
            }
            .message {
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .otp-container {
                background: #f8f9fa;
                border: 2px dashed #4a7c59;
                border-radius: 8px;
                padding: 25px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #2d5016;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                color: #856404;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                font-size: 14px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }
            .button {
                display: inline-block;
                background: #4a7c59;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🌶️ SpicesChain</div>
                <div class="subtitle">Connecting Farmers & Buyers</div>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${name}! 👋</div>
                
                <div class="message">
                    Welcome to SpicesChain! We're excited to have you join our community of ${userType === 'farmer' ? 'farmers' : 'buyers'}. 
                    To complete your registration and secure your account, please verify your email address using the OTP below.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Important:</strong> This OTP is valid for 10 minutes only. 
                    Do not share this code with anyone. SpicesChain will never ask for your OTP.
                </div>
                
                <div class="message">
                    Once verified, you'll be able to:
                    ${userType === 'farmer' 
                        ? '• List your spice products<br>• Connect with verified buyers<br>• Track your sales and analytics<br>• Access market insights'
                        : '• Browse verified farmer products<br>• Place orders directly<br>• Track your purchases<br>• Get quality assurance'
                    }
                </div>
            </div>
            
            <div class="footer">
                <p>If you didn't create an account with SpicesChain, please ignore this email.</p>
                <p>© 2024 SpicesChain. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: 'spiceschain@gmail.com',
    to: email,
    subject: subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, userType } = req.body;

    if (!email || !name || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and userType are required'
      });
    }

    if (!['farmer', 'buyer'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userType. Must be either farmer or buyer'
      });
    }

    // Check if user exists
    const UserModel = userType === 'farmer' ? Farmer : Buyer;
    const existingUser = await UserModel.findOne({ emailAddress: email });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `${userType} with this email not found`
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user document
    existingUser.otp = otp;
    existingUser.otpExpiry = otpExpiry;
    await existingUser.save();

    // Send email
    await sendOTPEmail(email, name, otp, userType);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email: email,
        userType: userType,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and userType are required'
      });
    }

    const UserModel = userType === 'farmer' ? Farmer : Buyer;
    const user = await UserModel.findOne({ emailAddress: email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${userType} with this email not found`
      });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or is invalid'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.emailAddress,
        userType: userType,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// Store Aadhaar verification details
router.post('/store-aadhaar', async (req, res) => {
  try {
    const { userId, aadhaarData } = req.body;

    // Validate required fields
    if (!userId || !aadhaarData) {
      return res.status(400).json({
        success: false,
        message: 'userId and aadhaarData are required'
      });
    }

    // Check if farmer exists
    const farmer = await Farmer.findById(userId);
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer with this ID not found'
      });
    }

    // Check if Aadhaar number already exists
    const existingAadhaar = await AadhaarVerification.findOne({
      'aadhaarData.aadhaar_number': aadhaarData.aadhaar_number
    });

    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number already registered with another account'
      });
    }

    // Check if farmer already has Aadhaar verification
    const existingVerification = await AadhaarVerification.findOne({
      userId: userId
    });

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar verification already exists for this farmer'
      });
    }

    // Create new Aadhaar verification record
    const aadhaarVerification = new AadhaarVerification({
      userId: userId,
      aadhaarData: aadhaarData
    });

    await aadhaarVerification.save();

    res.status(201).json({
      success: true,
      message: 'Aadhaar data stored successfully',
      data: {
        verificationId: aadhaarVerification._id,
        userId: userId
      }
    });

  } catch (error) {
    console.error('Store Aadhaar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store Aadhaar data',
      error: error.message
    });
  }
});

module.exports = router;
