class PacketError extends Error {
	constructor(message) {
		super(message);
		this.name = 'PacketError';
	}
}

module.exports = PacketError;
