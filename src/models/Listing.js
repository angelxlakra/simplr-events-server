const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
{
		ticketId: {
			type: String,
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
    price: {
      type: String,
      required: true
    },
		signature: {
      type: String,
      required: true,
    },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
