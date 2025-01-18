const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
	const { password } = req.body;

	// Compare with environment variable
	const correctPassword = process.env.ADMIN_PASSWORD;

	console.log({ correctPassword });
	if (password === process.env.ADMIN_PASSWORD) {
		const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
			expiresIn: '48h',
		});
		res.json({ token });
	} else {
		res.status(401).json({ message: 'Invalid password' });
	}
});

module.exports = router;
