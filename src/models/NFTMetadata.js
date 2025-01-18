const { default: mongoose } = require('mongoose');

const nftMetadataSchema = new mongoose.Schema({
	tokenId: {
		type: String,
		required: true,
	},
	event: {
		type: String,
		required: true,
	},
	metadata: {
		type: Object,
		required: true,
	},
});

module.exports = mongoose.model('NFTMetadata', nftMetadataSchema);
