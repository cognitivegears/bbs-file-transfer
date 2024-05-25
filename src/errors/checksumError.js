class ChecksumError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ChecksumError';
	}
}

module.exports = ChecksumError;
