const express = require('express');
const { verifyToken } = require('../middleware/auth'); // Add this line
const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
	try {
		// Input validation
		if (
			!req.body.name ||
			!req.body.email ||
			!req.body.address ||
			!req.body.sessionKeyString
		) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(req.body.email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		const user = new User({
			name: req.body.name.trim(),
			email: req.body.email.toLowerCase(),
			address: req.body.address.trim(),
			sessionKeyString: req.body.sessionKeyString,
		});

		const savedUser = await user.save();
		res.status(201).json(savedUser);
	} catch (error) {
		res.status(500).json({
			message: 'Error creating user',
			error: error.message,
		});
	}
});

router.get('/exists', async (req, res) => {
	try {
		const { email } = req.query;

		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.json({ exists: false });
		}

		res.json({
			exists: true,
			user: user,
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error checking user existence',
			error: error.message,
		});
	}
});

router.put('/session-key', verifyToken, async (req, res) => {
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

module.exports = router;
