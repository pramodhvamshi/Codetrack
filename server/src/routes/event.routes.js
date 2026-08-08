const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v2/events - List all events & hackathons
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('host', 'name email role currentCompany currentCompanyRole college branch batch')
      .sort({ eventDate: 1 });
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// POST /api/v2/events - Create new Event or Hackathon (Alumni / Admin / Coordinator)
router.post('/', async (req, res) => {
  try {
    const { title, type, description, meetingUrl, eventDate, endDate, isHackathon, themes, submissionUrl, maxTeamSize, prizePool } = req.body;

    if (!title || !type || !description || !eventDate) {
      return res.status(400).json({ success: false, message: 'Title, type, description, and eventDate are required' });
    }

    const event = await Event.create({
      title,
      type,
      description,
      meetingUrl: meetingUrl || '',
      eventDate: new Date(eventDate),
      endDate: endDate ? new Date(endDate) : null,
      host: req.user.id,
      isHackathon: Boolean(isHackathon || type === 'hackathon'),
      themes: Array.isArray(themes) ? themes : (themes ? themes.split(',').map(s => s.trim()) : []),
      submissionUrl: submissionUrl || '',
      maxTeamSize: maxTeamSize ? Number(maxTeamSize) : 4,
      prizePool: prizePool || ''
    });

    const populated = await Event.findById(event._id).populate('host', 'name email role currentCompany currentCompanyRole');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating event:', err);
    return res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// POST /api/v2/events/:id/rsvp - RSVP to event
router.post('/:id/rsvp', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userIdStr = String(req.user.id);
    const hasRsvped = event.rsvps.some(r => String(r) === userIdStr);

    if (hasRsvped) {
      event.rsvps = event.rsvps.filter(r => String(r) !== userIdStr);
    } else {
      event.rsvps.push(req.user.id);
    }

    await event.save();
    return res.json({ success: true, data: { rsvped: !hasRsvped, rsvpCount: event.rsvps.length } });
  } catch (err) {
    console.error('Error RSVPIng event:', err);
    return res.status(500).json({ success: false, message: 'Failed to update RSVP' });
  }
});

module.exports = router;
