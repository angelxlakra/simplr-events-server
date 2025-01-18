const requestLogger = (req, res, next) => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.url}`);

	// Log request body if present
	if (Object.keys(req.body).length > 0) {
		console.log('Request body:', req.body);
	}

	// Capture response
	const originalSend = res.send;
	res.send = function (body) {
		console.log(`[${timestamp}] Response status:`, res.statusCode);
		return originalSend.call(this, body);
	};

	next();
};

module.exports = requestLogger;
