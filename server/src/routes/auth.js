const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const router = express.Router();

// Helper to generate access and refresh tokens
function generateTokens(user, rememberMe = false) {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );

  return { accessToken, refreshToken };
}

// Helper to set HTTP-only cookies in express response
function setAuthCookies(res, { accessToken, refreshToken }, rememberMe = false) {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
  });
}

/**
 * REGISTER
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mssid,
      college,
      hostel,
      branch,
      year,
      overallGpa,
      leetcodeUsername,
      codechefUsername,
      gfgUsername,
      githubUsername,
      rememberMe
    } = req.body;

    const role = 'student';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

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

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      mssid,
      college,
      hostel,
      branch,
      year,
      overallGpa: Number(overallGpa),
      leetcodeUsername,
      codechefUsername,
      gfgUsername,
      githubUsername,
      isOnboarded: true,
      profileCompletedAt: new Date(),
      lastProfileUpdateAt: new Date()
    });

    const tokens = generateTokens(user, rememberMe);
    setAuthCookies(res, tokens, rememberMe);

    return res.status(201).json({
      token: tokens.accessToken, // send access token back for client-side headers fallback
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        isImpersonating: false
      }
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * LOGIN
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account deactivated. Please contact administrator.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user, rememberMe);
    setAuthCookies(res, tokens, rememberMe);

    let isImpersonating = false;
    if (req.headers.cookie) {
      const cookies = {};
      req.headers.cookie.split(';').forEach(c => {
        const parts = c.split('=');
        cookies[parts.shift().trim()] = decodeURI(parts.join('='));
      });
      isImpersonating = !!cookies['adminAccessToken'];
    }

    return res.json({
      token: tokens.accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        isImpersonating
      }
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

/**
 * LOGOUT
 */
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('adminAccessToken', { path: '/' });
  res.clearCookie('adminRefreshToken', { path: '/' });
  return res.json({ message: 'Logout successful' });
});

/**
 * REFRESH ACCESS TOKEN
 */
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = null;
    let isImpersonating = false;

    // Prefer cookie-parser populated cookies (always available since we added cookie-parser)
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
      isImpersonating = !!req.cookies.adminAccessToken;
    } else if (req.headers.cookie) {
      // Fallback: manual parse with quote stripping
      const cookies = {};
      req.headers.cookie.split(';').forEach(c => {
        const parts = c.split('=');
        const key = parts.shift().trim();
        const val = decodeURIComponent(parts.join('=')).trim().replace(/^"|"$/g, '');
        cookies[key] = val;
      });
      refreshToken = cookies['refreshToken'];
      isImpersonating = !!cookies['adminAccessToken'];
    }

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const decoded = jwt.verify(refreshToken, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account deactivated. Please contact administrator.' });
    }

    // Generate new tokens
    const tokens = generateTokens(user, true);
    setAuthCookies(res, tokens, true);

    return res.json({
      token: tokens.accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded,
        isImpersonating
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.generateTokens = generateTokens;
router.setAuthCookies = setAuthCookies;

module.exports = router;
