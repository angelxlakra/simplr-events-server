// Password protection middleware
const checkPassword = (req, res, next) => {
	const password = req.headers['x-api-password'];
	const correctPassword = process.env.API_PASSWORD;

	if (!password || password !== correctPassword) {
		return res
			.status(401)
			.json({ message: 'Unauthorized: Invalid password' });
	}
	next();
};

module.exports = { checkPassword };
