const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      // eslint-disable-next-line no-console
      console.warn('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables to seed the admin account.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      let changed = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        changed = true;
      }
      const passwordMatch = await bcrypt.compare(adminPassword, existingAdmin.passwordHash);
      if (!passwordMatch) {
        existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
        changed = true;
      }
      if (changed) {
        await existingAdmin.save();
      }
      // eslint-disable-next-line no-console
      console.log(`Admin account verified: ${adminEmail.toLowerCase()}`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: 'System Admin',
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true
    });

    // eslint-disable-next-line no-console
    console.log(`Admin account created: ${adminEmail.toLowerCase()}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error seeding default admin account:', err.message);
  }
}

module.exports = { seedAdmin };
