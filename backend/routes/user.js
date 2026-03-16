const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Session = require('../models/Session');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get total sessions count
    const sessionCount = await Session.countDocuments({ userId: req.user.id });
    
    return res.status(200).json({ ...user.toObject(), sessionCount });
  } catch (error) {
    console.error('=== /profile GET ERROR ===', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, targetRole, targetCompany, bio } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, targetRole, targetCompany, bio } },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json(user);
  } catch (error) {
    console.error('=== /profile PUT ERROR ===', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
