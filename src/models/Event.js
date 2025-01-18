const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
	{
		eventName: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		location: {
			type: String,
			required: true,
		},
		contractAddress: {
			type: String,
			required: true,
		},
		deadline: {
			type: String,
			required: true,
		},
		startDateTime: {
			type: String,
			required: true,
		},
		endDateTime: {
			type: String,
			required: true,
		},
		seatInputType: {
			type: String,
			required: true,
			enum: ['input', 'dropdown'],
		},
		seatOptions: {
			type: [String],
			default: [],
			validate: {
				validator: function (v) {
					return this.seatInputType === 'dropdown'
						? v.length > 0
						: true;
				},
				message: (props) =>
					`Seat Options must not be empty if seatInputType is 'dropdown'`,
			},
		},
		additionalInfo: [
			{
				type: String,
			},
		],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Event', eventSchema);
