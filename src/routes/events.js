const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Email = require('../models/Email');
const { verifyToken } = require('../middleware/auth');

// Create a new event - now with JWT protection
router.post('/', verifyToken, async (req, res) => {
	try {
		const requiredFields = [
			'eventName',
			'location',
			'image',
			'contractAddress',
			'deadline',
			'startDateTime',
			'endDateTime',
			'seatInputType',
		];

		// Check for required fields
		for (const field of requiredFields) {
			if (!req.body[field]) {
				return res
					.status(400)
					.json({ message: `${field} is required` });
			}
		}

		// Validate seatInputType
		if (!['input', 'dropdown'].includes(req.body.seatInputType)) {
			return res.status(400).json({
				message: 'seatInputType must be either "input" or "dropdown"',
			});
		}

		// Validate seatOptions only if seatInputType is dropdown
		if (req.body.seatInputType === 'dropdown') {
			if (
				!req.body.seatOptions ||
				!Array.isArray(req.body.seatOptions) ||
				!req.body.seatOptions.every((item) => typeof item === 'string')
			) {
				return res.status(400).json({
					message:
						'seatOptions must be an array of strings when seatInputType is dropdown',
				});
			}
		} else {
			// For input type, ensure seatOptions is empty array
			req.body.seatOptions = [];
		}

		const event = new Event(req.body);
		const savedEvent = await event.save();
		res.status(201).json(savedEvent);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// Get all events
router.get('/', async (req, res) => {
	try {
		const events = await Event.find();
		res.json(events);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Get a specific event
router.get('/:id', async (req, res) => {
	try {
		const event = await Event.findById(req.params.id);
		if (event) {
			res.json(event);
		} else {
			res.status(404).json({ message: 'Event not found' });
		}
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// Register an email template to the event
router.post('/:id/registerEmail', verifyToken, async (req, res) => {
	try {
		const event = await Event.findById(req.params.id);
		if (!event) {
			return res.status(404).json({ message: 'Event not found' });
		}

		if (
			!req.body.subject ||
			!req.body.bodyTemplateHtml ||
			!req.body.bodyTemplateText
		) {
			return res
				.status(400)
				.json({ message: 'Email subject and body are required' });
		}

		const email = new Email({
			subject: req.body.subject,
			bodyTemplateHtml: req.body.bodyTemplateHtml,
			bodyTemplateText: req.body.bodyTemplateText,
			requiredVariables: req.body.requiredVariables || [],
			event: event._id, // Using the event._id from the found event object
		});

		const savedEmail = await email.save();
		event.emailTemplate = savedEmail._id;
		const updatedEvent = await event.save();
		res.json(updatedEvent);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
