require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const requestLogger = require('./middleware/logger');
const healthRoutes = require('./routes/health');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const nftMetadataRoutes = require('./routes/nftMetadata');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Add logger middleware

// Routes
app.use('/health', healthRoutes);
app.use('/events', eventRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/nft-metadata', nftMetadataRoutes);

// Connect to database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
	await connectDB();

	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
};

startServer();
