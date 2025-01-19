const express = require('express');
const { verifyToken } = require('../middleware/auth'); // Add this line
const router = express.Router();
const User = require('../models/User');


router.post('/create', async (req, res) => {
  try {
    const email = req.body.email;
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.json({
        exists: true,
        user: existingUser
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
      sessionKeyString: req.body.sessionKeyString ?? "",
    });

    const savedUser = await user.save();
    res.status(201).json({
      exists: false,
      user: savedUser
    });
  } catch (error) {
    console.log({error})
    res.status(500).json({
      message: 'Error creating/checking user',
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
