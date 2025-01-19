const { default: mongoose } = require('mongoose');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		unique: true,
		required: true,
	},
	address: {
		type: String,
		unique: true,
		required: true,
	},
	sessionKeyString: {
		type: String,
		unique: true,
	},
});

module.exports = mongoose.model('User', userSchema);
