const Transport = require("./transport");

class Net extends Transport {
	constructor(connection) {
		super();
		this.connection = connection;

		this.connection.on("data", this.onDataReceived.bind(this));
		this.connection.on("error", this.onError.bind(this));
		this.connection.on("close", this.onClose.bind(this));
	}

	// implement isOpen method
	isOpen() {
		return !this.connection.destroyed;
	}

	// implement close method
	close() {
		return new Promise((resolve, reject) => {
			this.connection.end((err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	}

	send(data) {
		return new Promise((resolve, reject) => {
			this.connection.write(data, (err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	}
}

module.exports = Net;
