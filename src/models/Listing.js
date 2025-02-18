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
    isResolved: {
      type: Boolean,
      default: false
    },
    disputed: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputeFrom: {
      type:
    String,
    enum: ['Buyer', 'Seller']
    }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
