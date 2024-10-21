class Transport {
	constructor() {
		if (new.target === Transport) {
			throw new TypeError(
				"Cannot instantiate abstract class Transport directly",
			);
		}
	}

	isOpen() {
		throw new Error("Method 'isOpen()' must be implemented.");
	}

	open() {
		throw new Error("Method 'open()' must be implemented.");
	}

	close() {
		throw new Error("Method 'close()' must be implemented.");
	}

	send(data) {
		throw new Error("Method 'send(data)' must be implemented.");
	}

	onDataReceived(callback) {
		throw new Error("Method 'onData(callback)' must be implemented.");
	}

	onError(callback) {
		throw new Error("Method 'onError(callback)' must be implemented.");
	}

	onClose(callback) {
		throw new Error("Method 'onClose(callback)' must be implemented.");
	}
}

module.exports = Transport;
