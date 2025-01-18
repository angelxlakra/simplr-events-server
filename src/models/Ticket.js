const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
	{
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		ticketData: {
			type: String,
		},
		orderNumber: {
			type: String,
			required: true,
		},
		seat: {
			type: String,
			required: true,
		},
		tokenId: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
