const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const router = express.Router();

router.post('/create', async (req, res) => {
  const data = req.body;

  // Input validation
  if (!data.seat || !data.tokenId || !data.orderNumber || !data.eventId || !data.userId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {


    const event = await Event.findOne({ contractAddress: data.eventId });
    const user = await User.findOne({ address: data.userId });

    const ticket = new Ticket({
      seat: data.seat,
      tokenId: data.tokenId,
      orderNumber: data.orderNumber,
      eventId: event._id,
      userId: user._id,
    });

    const savedTicket = await ticket.save();

    res.json(savedTicket);
   } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

module.exports = router;
