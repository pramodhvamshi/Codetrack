const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const router = express.Router();

/**
 * REGISTER
 * Student registration now collects ALL mandatory profile data.
 * This eliminates onboarding completely.
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,

      // student required fields
      college,
      hostel,
      branch,
      year,
      overallGpa,
      leetcodeUsername,
      codechefUsername
    } = req.body;

    // ---- BASIC VALIDATION ----
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    if (!['student', 'coordinator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // ---- STUDENT-SPECIFIC VALIDATION ----
    if (role === 'student') {
      if (
        !college ||
        !hostel ||
        !branch ||
        !year ||
        overallGpa == null ||
        !leetcodeUsername ||
        !codechefUsername
      ) {
        return res.status(400).json({
          message: 'All academic and platform fields are required for students'
        });
      }
    }

    // ---- DUPLICATE EMAIL CHECK ----
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ---- CREATE USER ----
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,

      // academic profile
      college: role === 'student' ? college : undefined,
      hostel: role === 'student' ? hostel : undefined,
      branch: role === 'student' ? branch : undefined,
      year: role === 'student' ? year : undefined,
      overallGpa: role === 'student' ? Number(overallGpa) : undefined,

      // platforms
      leetcodeUsername: role === 'student' ? leetcodeUsername : undefined,
      codechefUsername: role === 'student' ? codechefUsername : undefined,

      // onboarding is now DONE at registration
      isOnboarded: role === 'student',
      profileCompletedAt: role === 'student' ? new Date() : undefined,
      lastProfileUpdateAt: new Date()
    });

    // ---- JWT ----
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

// LOGIN (unchanged)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;
