const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Rate limiting for auth routes: 5 attempts per 15 mins for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // slightly more generous for register+login cycle
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /register
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;

      // If email already exists in DB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash the password using bcryptjs with salt rounds of 10
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Save new User to MongoDB
      const newUser = new User({
        name,
        email,
        password: hashedPassword
      });

      const savedUser = await newUser.save();

      // Generate a JWT token with payload { id: user._id } that expires in 7 days
      const payload = {
        id: savedUser._id
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Return 201 with { token, user: { id, name, email } }
      return res.status(201).json({
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          targetRole: savedUser.targetRole || '',
          targetCompany: savedUser.targetCompany || '',
          bio: savedUser.bio || ''
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user by email, if not found return 400
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Compare password with bcryptjs, if wrong return 400
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const payload = {
        id: user._id
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Return 200 with { token, user: { id, name, email } }
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          targetRole: user.targetRole || '',
          targetCompany: user.targetCompany || '',
          bio: user.bio || ''
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
