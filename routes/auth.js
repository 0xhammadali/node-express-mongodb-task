const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['player', 'fan'].includes(role)) {
      return res.status(400).json({ msg: 'Role must be player or fan' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed, role });

    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { id: user._id, role: user.role };

    const { jwtSecret } = require('../config/config');
    console.log("jwtSecret",jwtSecret);
    console.log("payload",payload);
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    console.log('SIGNED TOKEN:', token);
    console.log('PAYLOAD USED:', payload);

    // update lastLogin
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date(), online: true } });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 