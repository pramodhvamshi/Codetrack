const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const AlumniGroup = require('../models/AlumniGroup');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const { getIO } = require('../services/socketService');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v2/groups/contacts - Search registered contacts (Students & Alumni) for member selection
router.get('/contacts', async (req, res) => {
  try {
    const { query, role } = req.query;
    const filter = { _id: { $ne: req.user.id } };

    if (role) {
      filter.role = role;
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { currentCompany: { $regex: query, $options: 'i' } },
        { branch: { $regex: query, $options: 'i' } }
      ];
    }

    const contacts = await User.find(filter)
      .select('name email role college branch currentYear batch currentCompany currentCompanyRole')
      .sort({ name: 1 })
      .limit(100)
      .lean();

    return res.json({ success: true, data: contacts });
  } catch (err) {
    console.error('Error fetching group contacts:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// GET /api/v2/groups - List available groups for logged in user
router.get('/', async (req, res) => {
  try {
    const { category, audience, query } = req.query;
    const userIdStr = String(req.user.id);

    let filter = {};

    // Students can see public clubs OR groups where they are enroled as a member
    if (req.user.role === 'student') {
      filter.$or = [
        { targetAudience: 'all' },
        { members: req.user.id }
      ];
    } else if (audience && audience !== 'all') {
      filter.targetAudience = audience;
    }

    if (category && category !== 'all') filter.category = category;

    if (query) {
      const searchRegex = { $regex: query, $options: 'i' };
      const textMatches = [{ title: searchRegex }, { description: searchRegex }];
      if (filter.$or) {
        filter = { $and: [{ $or: filter.$or }, { $or: textMatches }] };
      } else {
        filter.$or = textMatches;
      }
    }

    const groups = await AlumniGroup.find(filter)
      .populate('creator', 'name role currentCompany currentCompanyRole college branch batch')
      .populate('admins', 'name role email')
      .populate('members', 'name role email currentCompany branch')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, data: groups });
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
});

// POST /api/v2/groups - Create custom peer group or public club with selected member contacts
router.post('/', async (req, res) => {
  try {
    const { title, description, category, targetAudience, memberIds, meetingUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const audienceSetting = (targetAudience === 'alumni-only' && req.user.role !== 'student')
      ? 'alumni-only'
      : 'all';

    // Unique list of members including creator
    const rawMemberIds = Array.isArray(memberIds) ? memberIds : [];
    const uniqueMembers = Array.from(new Set([String(req.user.id), ...rawMemberIds.map(String)]));

    const group = await AlumniGroup.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'General',
      groupType: rawMemberIds.length > 0 ? 'custom_group' : 'public_club',
      targetAudience: audienceSetting,
      meetingUrl: meetingUrl || '',
      creator: req.user.id,
      admins: [req.user.id],
      members: uniqueMembers
    });

    const populated = await AlumniGroup.findById(group._id)
      .populate('creator', 'name role currentCompany currentCompanyRole')
      .populate('admins', 'name role email')
      .populate('members', 'name role email currentCompany branch');

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating group:', err);
    return res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

// POST /api/v2/groups/:id/members - Add members to existing group (Admin only)
router.post('/:id/members', async (req, res) => {
  try {
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'memberIds array required' });
    }

    const group = await AlumniGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Check if requester is admin or creator
    const userIdStr = String(req.user.id);
    const isAdmin = group.admins.some(a => String(a) === userIdStr) || String(group.creator) === userIdStr;

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members.' });
    }

    const currentMembersStr = group.members.map(String);
    memberIds.forEach(id => {
      if (!currentMembersStr.includes(String(id))) {
        group.members.push(id);
      }
    });

    await group.save();

    const updated = await AlumniGroup.findById(group._id)
      .populate('creator', 'name role currentCompany currentCompanyRole')
      .populate('admins', 'name role email')
      .populate('members', 'name role email currentCompany branch');

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error adding group members:', err);
    return res.status(500).json({ success: false, message: 'Failed to add members' });
  }
});

// DELETE /api/v2/groups/:id/members/:userId - Remove a member from group (Admin only)
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const group = await AlumniGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const userIdStr = String(req.user.id);
    const targetUserId = req.params.userId;
    const isAdmin = group.admins.some(a => String(a) === userIdStr) || String(group.creator) === userIdStr;

    if (!isAdmin && userIdStr !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members.' });
    }

    group.members = group.members.filter(m => String(m) !== String(targetUserId));
    await group.save();

    const updated = await AlumniGroup.findById(group._id)
      .populate('creator', 'name role currentCompany currentCompanyRole')
      .populate('admins', 'name role email')
      .populate('members', 'name role email currentCompany branch');

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error removing group member:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
});

// POST /api/v2/groups/:id/join - Join / Leave group
router.post('/:id/join', async (req, res) => {
  try {
    const group = await AlumniGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.targetAudience === 'alumni-only' && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'This is an exclusive Alumni-Only peer group.' });
    }

    const userIdStr = String(req.user.id);
    const isMember = group.members.some(m => String(m) === userIdStr);

    if (isMember) {
      group.members = group.members.filter(m => String(m) !== userIdStr);
    } else {
      group.members.push(req.user.id);
    }

    await group.save();
    return res.json({ success: true, data: { joined: !isMember, memberCount: group.members.length } });
  } catch (err) {
    console.error('Error joining group:', err);
    return res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

// GET /api/v2/groups/:id/messages - Fetch group chat message history
router.get('/:id/messages', async (req, res) => {
  try {
    const group = await AlumniGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.targetAudience === 'alumni-only' && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Access denied to Alumni-Only peer group chat.' });
    }

    const messages = await GroupMessage.find({ groupId: req.params.id })
      .populate('sender', 'name role currentCompany currentCompanyRole college branch batch')
      .sort({ createdAt: 1 });

    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Error fetching group messages:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch group messages' });
  }
});

// POST /api/v2/groups/:id/messages - Send message in native group chat
router.post('/:id/messages', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Message text is required' });

    const group = await AlumniGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.targetAudience === 'alumni-only' && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Access denied to Alumni-Only peer group chat.' });
    }

    const message = await GroupMessage.create({
      groupId: req.params.id,
      sender: req.user.id,
      text: text.trim()
    });

    const populatedMsg = await GroupMessage.findById(message._id)
      .populate('sender', 'name role currentCompany currentCompanyRole college branch batch');

    try {
      const io = getIO();
      io.to(`group_${req.params.id}`).emit('new_group_message', populatedMsg);
    } catch (sockErr) {
      console.error('Socket emit error:', sockErr.message);
    }

    return res.status(201).json({ success: true, data: populatedMsg });
  } catch (err) {
    console.error('Error sending group message:', err);
    return res.status(500).json({ success: false, message: 'Failed to send group message' });
  }
});

module.exports = router;
