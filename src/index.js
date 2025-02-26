require('dotenv').config();
const express = require('express');
const corsConfig = require('./config/cors');
const connectDB = require('./config/database');
const requestLogger = require('./middleware/logger');
const healthRoutes = require('./routes/health');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const listingRoutes = require('./routes/listing');
const marketplaceRoutes = require('./routes/marketplace');
const nftMetadataRoutes = require('./routes/nftMetadata');
const ticketRoutes = require('./routes/ticket')
const { validateRequest } = require('./middleware/auth');

const app = express();

// Middleware
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Add logger middleware


app.use('/nft-metadata', nftMetadataRoutes);
app.use('/health', healthRoutes);
app.use(validateRequest);

// Routes
app.use('/user', userRoutes);
app.use('/events', eventRoutes);
app.use('/auth', authRoutes);
app.use('/listing', listingRoutes);
app.use('/marketplace', marketplaceRoutes);
app.use('/ticket', ticketRoutes);

// Connect to database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
	await connectDB();

	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
};

startServer();
