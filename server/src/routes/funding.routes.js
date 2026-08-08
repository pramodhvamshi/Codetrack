const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const FundingRequest = require('../models/FundingRequest');

const router = express.Router();

/**
 * GET /api/v2/funding
 * Fetch active student project funding & innovation grant requests
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, status } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (status) query.status = status;

    const requests = await FundingRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('student', 'name email branch currentYear college leetcodeUsername githubUsername')
      .populate('pledges.donor', 'name email role currentCompany currentCompanyRole')
      .lean();

    return res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('Error fetching funding requests:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch funding requests' });
  }
});

/**
 * POST /api/v2/funding/create
 * Student creates an Innovation Grant / Crowdfunding request
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, category, targetAmount, description, githubUrl, demoVideoUrl } = req.body;

    if (!title || !targetAmount || !description) {
      return res.status(400).json({ success: false, message: 'Title, target amount, and description are required' });
    }

    const fundingReq = await FundingRequest.create({
      student: req.user.id,
      title: title.trim(),
      category: category || 'AI/ML Prototype',
      targetAmount: parseFloat(targetAmount),
      description: description.trim(),
      githubUrl: githubUrl || '',
      demoVideoUrl: demoVideoUrl || ''
    });

    await fundingReq.populate('student', 'name email branch currentYear college');

    return res.status(201).json({
      success: true,
      message: 'Funding request published successfully',
      data: fundingReq
    });
  } catch (err) {
    console.error('Error creating funding request:', err);
    return res.status(500).json({ success: false, message: 'Failed to create funding request' });
  }
});

/**
 * POST /api/v2/funding/:id/pledge
 * Alumni pledges financial sponsorship to a student project
 */
router.post('/:id/pledge', authMiddleware, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const fundingId = req.params.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid pledge amount is required' });
    }

    const fundingReq = await FundingRequest.findById(fundingId);
    if (!fundingReq) {
      return res.status(404).json({ success: false, message: 'Funding request not found' });
    }

    const pledgeAmount = parseFloat(amount);
    fundingReq.pledges.push({
      donor: req.user.id,
      amount: pledgeAmount,
      note: note || '',
      date: new Date()
    });

    fundingReq.raisedAmount = (fundingReq.raisedAmount || 0) + pledgeAmount;
    if (fundingReq.raisedAmount >= fundingReq.targetAmount) {
      fundingReq.status = 'funded';
    }

    await fundingReq.save();
    await fundingReq.populate('pledges.donor', 'name email role currentCompany currentCompanyRole');

    return res.json({
      success: true,
      message: `Pledge of ₹${pledgeAmount} registered successfully!`,
      data: fundingReq
    });
  } catch (err) {
    console.error('Error pledging to funding request:', err);
    return res.status(500).json({ success: false, message: 'Failed to process pledge' });
  }
});

module.exports = router;
