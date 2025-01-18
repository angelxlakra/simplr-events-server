const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
	const dbHealth = mongoose.connection.readyState === 1;

	res.json({
		status: 'success',
		message: 'Health check completed',
		server: 'healthy',
		database: dbHealth ? 'connected' : 'disconnected',
	});
});

module.exports = router;
