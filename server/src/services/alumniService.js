const User = require('../models/User');

/**
 * Search and filter alumni profiles
 */
async function searchAlumni({ page = 1, limit = 12, batch = '', branch = '', company = '', location = '', query = '' }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Filter users who have role 'alumni' OR have alumnus fields populated (batch/company)
  const dbQuery = {
    $or: [
      { role: 'alumni' },
      { currentCompany: { $ne: null, $exists: true } },
      { batch: { $ne: null, $exists: true } }
    ]
  };

  if (batch && batch.trim().length > 0) {
    dbQuery.batch = batch.trim();
  }

  if (branch && branch.trim().length > 0) {
    dbQuery.branch = new RegExp(branch.trim(), 'i');
  }

  if (company && company.trim().length > 0) {
    dbQuery.currentCompany = new RegExp(company.trim(), 'i');
  }

  if (location && location.trim().length > 0) {
    dbQuery.location = new RegExp(location.trim(), 'i');
  }

  if (query && query.trim().length > 0) {
    const regex = new RegExp(query.trim(), 'i');
    dbQuery.$and = dbQuery.$and || [];
    dbQuery.$and.push({
      $or: [
        { name: regex },
        { currentCompany: regex },
        { currentCompanyRole: regex },
        { branch: regex },
        { batch: regex }
      ]
    });
  }

  const alumni = await User.find(dbQuery)
    .select('name email role branch college batch currentCompany currentCompanyRole location homeTown socialLinks projects workExperience')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalItems = await User.countDocuments(dbQuery);
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    alumni,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      hasMore: page < totalPages
    }
  };
}

/**
 * Get distinct filter suggestions for company & location dropdowns
 */
async function getFilterSuggestions() {
  const companies = await User.distinct('currentCompany', { currentCompany: { $ne: null } });
  const batches = await User.distinct('batch', { batch: { $ne: null } });
  const branches = await User.distinct('branch', { branch: { $ne: null } });

  return {
    companies: companies.filter(Boolean),
    batches: batches.filter(Boolean),
    branches: branches.filter(Boolean)
  };
}

/**
 * Fetch full public profile of a user (student or alumnus)
 */
async function getPublicProfile(userId) {
  const user = await User.findById(userId)
    .select('-passwordHash')
    .lean();

  if (!user) {
    throw new Error('User profile not found');
  }

  return user;
}

module.exports = {
  searchAlumni,
  getFilterSuggestions,
  getPublicProfile
};
