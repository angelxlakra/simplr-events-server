const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const NFTMetadata = require('../models/NFTMetadata');
const { verifyToken } = require('../middleware/auth');
const cors = require('cors');

// Create a new NFT metadata
router.post('/', async (req, res) => {
	try {
		const requiredFields = ['event', 'tokenId', 'seat'];

		// Check for required fields
		for (const field of requiredFields) {
			if (!req.body[field]) {
				return res
					.status(400)
					.json({ message: `${field} is required` });
			}
		}

		const event = await Event.findOne({ contractAddress: req.body.event });

		// check if metadata already exists and delete the old one
		const existingMetadata = await NFTMetadata.findOne({
			event: event.contractAddress.toLowerCase(),
			tokenId: req.body.tokenId,
		});
		if (existingMetadata)
      await NFTMetadata.findOneAndDelete({ _id: existingMetadata._id });

		const nftMetadata = new NFTMetadata({
			event: event.contractAddress.toLowerCase(),
			tokenId: req.body.tokenId,
			metadata: {
				name: `Digital Twin for ${event.eventName}`,
				description: `NFT Ticket provided by Simplr Events for ${event.eventName}`,
				image: event.image,
				attributes: [
					{
						trait_type: 'Seat',
						value: req.body.seat,
					},
					{
						trait_type: 'Token Id',
						value: req.body.tokenId,
					},
					{
						trait_type: 'Event Name',
						value: event.eventName,
					},
					{
						trait_type: 'Event Date',
						value: `${event.startDateTime} ${event.endDateTime ? '-' : ''} ${event.endDateTime ?? ''}`,
					},
				],
				tokenId: req.body.tokenId,
			},
		});
		const savedNFTMetadata = await nftMetadata.save();
		res.status(201).json(savedNFTMetadata);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

// Get the metadata for a specific NFT
router.get('/:eventContract/:tokenId', cors(), async (req, res) => {
	const { eventContract, tokenId } = req.params;

	try {
		const nftMetadata = await NFTMetadata.findOne({
			event: eventContract.toLowerCase(),
			tokenId,
		});

		if (!nftMetadata) {
			return res.status(404).json({ message: 'NFT metadata not found' });
		}

		res.json(nftMetadata.metadata);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
