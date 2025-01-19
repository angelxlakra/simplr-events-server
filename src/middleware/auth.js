const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
	const token = req.header('Authorization')?.replace('Bearer ', '');

	if (!token) {
		return res
			.status(401)
			.json({ message: 'Access denied. Token required.' });
	}

	try {
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		next();
	} catch (err) {
		res.status(401).json({ message: 'Invalid token' });
	}
};

const validateRequest = (req, res, next) => {
  const customAuthHeader = req.headers['x-custom-auth'];

  // Define allowed auth tokens
  const validTokens = {
    'simplr-events-website': true,
    'postman-temporary-token': true,
  };

  if (!customAuthHeader || !validTokens[customAuthHeader]) {
    return res.status(403).json({error: 'Unauthorized request origin'});
  }

  next();
}

module.exports = { verifyToken, validateRequest };
