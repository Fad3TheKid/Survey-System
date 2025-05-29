const express = require('express');
const router = express.Router();
const User = require('../../User'); // Adjust the path if needed

// Mock middleware to simulate authenticated user
// Replace this with real auth in production (JWT, session, etc.)
const mockUserId = '6654f19e3aa998e7c88fdc81'; // <- Replace with a real user ID in your DB

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(mockUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      role: user.role,
      canCreateForms: ['admin', 'editor'].includes(user.role),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
