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

const PASSWORD_BLACKLIST = [
  "password",
  "password123",
  "admin123",
  "welcome123",
  "medha123",
  "password@123",
  "admin@123",
  "medha@123"
];

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
      hackerrankUsername,
      rememberMe
    } = req.body;

    const role = 'student';

    // 1. Trim all inputs
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';
    const trimmedMssid = typeof mssid === 'string' ? mssid.trim().toUpperCase() : '';
    const trimmedCollege = typeof college === 'string' ? college.trim() : '';
    const trimmedHostel = typeof hostel === 'string' ? hostel.trim() : '';
    const trimmedBranch = typeof branch === 'string' ? branch.trim() : '';
    const trimmedYear = typeof year === 'string' ? year.trim() : '';
    const trimmedLeetcode = typeof leetcodeUsername === 'string' ? leetcodeUsername.trim() : '';
    const trimmedCodechef = typeof codechefUsername === 'string' ? codechefUsername.trim() : '';
    const trimmedGfg = typeof gfgUsername === 'string' ? gfgUsername.trim() : '';
    const trimmedGithub = typeof githubUsername === 'string' ? githubUsername.trim() : '';
    const trimmedHackerrank = typeof hackerrankUsername === 'string' ? hackerrankUsername.trim() : '';

    const errors = {};

    // 2. Perform field validations
    if (!trimmedName) {
      errors.name = 'Name is required';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid Gmail address ending with @gmail.com';
    }

    const mssidRegex = /^MSS\d{7}$/;
    if (!trimmedMssid) {
      errors.mssid = 'MSSID is required';
    } else if (!mssidRegex.test(trimmedMssid)) {
      errors.mssid = 'MSSID must be in the format MSS2020012';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,32}$/;
    if (!trimmedPassword) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(trimmedPassword)) {
      errors.password = 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.';
    } else {
      const lowercasePw = trimmedPassword.toLowerCase();
      const isBlacklisted = PASSWORD_BLACKLIST.some(item => lowercasePw === item || lowercasePw.includes(item));
      if (isBlacklisted) {
        errors.password = 'Password is too weak. Please avoid common passwords like "Password@123", "Medha@123", or similar variations.';
      }
    }

    if (!trimmedCollege) errors.college = 'College is required';
    if (!trimmedHostel) errors.hostel = 'Hostel is required';
    if (!trimmedBranch) errors.branch = 'Branch is required';
    if (!trimmedYear) errors.year = 'Year is required';
    if (overallGpa == null || String(overallGpa).trim() === '') {
      errors.overallGpa = 'Overall GPA is required';
    }
    if (!trimmedLeetcode) errors.leetcodeUsername = 'LeetCode username is required';
    if (!trimmedCodechef) errors.codechefUsername = 'CodeChef username is required';

    // 3. Database uniqueness checks if formatting was otherwise correct
    if (!errors.email && trimmedEmail) {
      const existingEmail = await User.findOne({ email: trimmedEmail });
      if (existingEmail) {
        errors.email = 'Email already exists';
      }
    }

    if (!errors.mssid && trimmedMssid) {
      const existingMssid = await User.findOne({ mssid: trimmedMssid });
      if (existingMssid) {
        errors.mssid = 'MSSID already exists';
      }
    }

    // 4. Return structured error response if validation fails
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

     const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role,
      mssid: trimmedMssid,
      college: trimmedCollege,
      hostel: trimmedHostel,
      branch: trimmedBranch,
      year: trimmedYear,
      overallGpa: Number(overallGpa),
      leetcodeUsername: trimmedLeetcode,
      codechefUsername: trimmedCodechef,
      gfgUsername: trimmedGfg,
      githubUsername: trimmedGithub,
      hackerrankUsername: trimmedHackerrank,
      isOnboarded: true,
      profileCompletedAt: new Date(),
      lastProfileUpdateAt: new Date()
    });

    const tokens = generateTokens(user, rememberMe);
    setAuthCookies(res, tokens, rememberMe);

    // Clear stale backup cookies on registration
    res.clearCookie('adminAccessToken', { path: '/' });
    res.clearCookie('adminRefreshToken', { path: '/' });

    return res.status(201).json({
      token: tokens.accessToken,
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

    // Clear stale backup cookies on new login
    res.clearCookie('adminAccessToken', { path: '/' });
    res.clearCookie('adminRefreshToken', { path: '/' });

    return res.json({
      token: tokens.accessToken,
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
        isImpersonating: isImpersonating && user.role !== 'admin'
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
