const express = require('express');
const { verifyToken } = require('../middleware/auth'); // Add this line
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { USER_TICKETS_QUERY } = require('../gql/queries/user-tickets.query');
const { default: axios } = require('axios');
const { getSubgraphUrl } = require('../utils/subgraph');



router.post('/create', async (req, res) => {
	try {
		const email = req.body.email;
		const existingUser = await User.findOne({ email: email.toLowerCase() });

		if (existingUser) {
			return res.json({
				exists: true,
				user: existingUser,
			});
		}

		// Input validation
		if (!req.body.email || !req.body.name || !req.body.address) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		const user = new User({
			name: req.body.name.trim(),
			email: email.toLowerCase(),
			address: req.body.address.trim(),
			sessionKeyString: req.body.sessionKeyString ?? '',
		});

		const savedUser = await user.save();
		res.status(201).json({
			exists: false,
			user: savedUser,
		});
	} catch (error) {
		console.log({ error });
		res.status(500).json({
			message: 'Error creating/checking user',
			error: error.message,
		});
	}
});

router.get('/:address', (req, res) => {
	User.findOne({ address: req.params.address })
		.then((users) => res.json(users))
		.catch((err) => res.status(400).json('Error: ' + err));
});

router.put('/session-key', async (req, res) => {
	try {
		const { email, sessionKeyString } = req.body;

		if (!email || !sessionKeyString) {
			return res
				.status(400)
				.json({ message: 'Email and sessionKeyString are required' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		const updatedUser = await User.findOneAndUpdate(
			{ email: email.toLowerCase() },
			{ sessionKeyString },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.json(updatedUser);
	} catch (error) {
		res.status(500).json({
			message: 'Error updating session key',
			error: error.message,
		});
	}
});

router.get('/:address/tickets', async (req, res) => {
	const network = req.query.network;
	const subgraph_url = getSubgraphUrl(network);

	const address = req.params.address;

	const user = await User.findOne({
		address: { $regex: new RegExp(`^${address}$`, 'i') },
	});

	if (!user) {
		return res.status(404).json({ message: 'User not found' });
	}

	const response = await axios.post(subgraph_url, {
		query: USER_TICKETS_QUERY,
		variables: {
			userId: `user-${address.toLowerCase()}`,
		},
	});

	const tickets = response?.data?.data?.user?.ticketsOwned?.items.filter(ticket => !ticket.listings.items[0].price) ?? [];

	// Extract eventIds from tickets
	const eventIds = tickets.map(ticket => ticket.eventId.split('-')[1]);

	// Fetch events from database with case-insensitive search
	const events = await Event.find({
		contractAddress: {
			$in: eventIds.map(id => new RegExp(`^${id}$`, 'i'))
		}
	});

	// Create a map for quick event lookup (convert to lowercase for comparison)
	const eventMap = events.reduce((acc, event) => {
		acc[event.contractAddress.toLowerCase()] = event;
		return acc;
	}, {});

	const ticketsOwned = tickets.map((ticket) => {
		return {
			_id: ticket.id,
			event: ticket.eventId.split('-')[1].toLowerCase(),
			tokenId: ticket.tokenMetadata.tokenId || '',
			seat: ticket.seat || '',
		};
	});

	return res.json({ticketsOwned, eventMap, tickets});
});

module.exports = router;
