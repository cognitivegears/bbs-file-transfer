/* eslint-disable no-unused-vars */
const _ = require('lodash');

class FileTransfer {
	constructor(transport, logger = console) {
		if (!_.isObject(transport) || !(transport instanceof require('../transport/transport'))) {
			throw new Error('transport must be an instance of Transport');
		}

		this.transport = transport;
		this.packetSize = 128; // Default packet size
		this.timeout = 10; // Default timeout in seconds
		this.logger = logger;

		// Ensure the logger has the required methods
		if (!_.isFunction(this.logger.info)
        || !_.isFunction(this.logger.warn)
        || !_.isFunction(this.logger.error)) {
			throw new Error('logger must have info, warn, and error methods');
		}
	}

	// Initialize the connection and start the transfer
	startTransfer(fileBuffer) {
		throw new Error('startTransfer method must be implemented by subclasses');
	}

	// Send a file using the protocol
	sendFile(fileBuffer) {
		throw new Error('sendFile method must be implemented by subclasses');
	}

	// Receive a file using the protocol
	receiveFile() {
		throw new Error('receiveFile method must be implemented by subclasses');
	}

	// Handle errors and retries (default implementation)
	handleError(error) {
		this.logger.error('Handling error:', error.message);
		this.abortTransfer();
	}

	// Abort the transfer (default implementation)
	abortTransfer() {
		throw new Error('abortTransfer method must be implemented by subclasses');
	}
}

module.exports = FileTransfer;
