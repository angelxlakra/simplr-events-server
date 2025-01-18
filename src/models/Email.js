const { default: mongoose } = require('mongoose');
const { type } = require('os');

const emailSchema = new mongoose.Schema({
	subject: {
		type: String,
		required: true,
	},
	bodyTemplateHtml: {
		type: String,
		required: true,
	},
	bodyTemplateText: {
		type: String,
		required: true,
	},
	requiredVariables: {
		type: [String],
		default: [],
	},
	event: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Event',
		required: true,
	},
});

module.exports = mongoose.model('Email', emailSchema);
