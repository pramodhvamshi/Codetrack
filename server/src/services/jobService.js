const Job = require('../models/Job');
const Post = require('../models/Post');

/**
 * Fetch filterable & paginated job listings
 */
async function getJobListings({ page = 1, limit = 10, type = 'all', keyword = '', location = '' }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { status: 'active' };

  if (type && type !== 'all') {
    query.employmentType = type;
  }

  if (location && location.trim().length > 0) {
    query.location = new RegExp(location.trim(), 'i');
  }

  if (keyword && keyword.trim().length > 0) {
    const regex = new RegExp(keyword.trim(), 'i');
    query.$or = [
      { title: regex },
      { company: regex },
      { description: regex },
      { tags: regex }
    ];
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name role email currentCompany currentCompanyRole')
    .lean();

  const totalItems = await Job.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    jobs,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      hasMore: page < totalPages
    }
  };
}

/**
 * Create a new job listing & publish to Community Feed
 */
async function createJobListing(data) {
  const { authorId, title, company, location, employmentType, salary, description, requirements, tags, applicationDeadline } = data;

  const job = await Job.create({
    author: authorId,
    title,
    company,
    location,
    employmentType: employmentType || 'Full-Time',
    salary: salary || '',
    description,
    requirements: requirements || '',
    tags: Array.isArray(tags) ? tags : [],
    applicationDeadline: applicationDeadline || null
  });

  await job.populate('author', 'name role currentCompany');

  // Also publish job listing to Community Feed as a job post
  try {
    await Post.create({
      author: authorId,
      postType: 'job',
      title: `${title} at ${company}`,
      content: `${company} is hiring for ${title} (${employmentType}, ${location}). ${description.slice(0, 150)}...`,
      category: 'career',
      metadata: {
        company,
        role: title,
        salary,
        jobId: job._id.toString()
      }
    });
  } catch (err) {
    console.error('Failed to auto-publish job to feed:', err.message);
  }

  return job;
}

module.exports = {
  getJobListings,
  createJobListing
};
