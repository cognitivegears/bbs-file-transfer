const SerialPortLib = require("serialport");
const Transport = require("./transport");

class SerialPort extends Transport {
	constructor(options) {
		super();
		this.port = new SerialPortLib(options.path, {
			baudRate: options.baudRate || 9600,
			dataBits: 8,
			stopBits: 1,
			parity: "none",
		});

		this.port.on("data", this.onDataReceived.bind(this));
		this.port.on("error", this.onError.bind(this));
		this.port.on("close", this.onClose.bind(this));
	}

	isOpen() {
		return this.port.isOpen;
	}

	close() {
		return new Promise((resolve, reject) => {
			this.port.close((err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	}

	send(data) {
		return new Promise((resolve, reject) => {
			this.port.write(data, (err) => {
				if (err) {
					return reject(err);
				}

				this.port.drain(resolve); // Ensure all data is sent before resolving
			});
		});
	}
}

module.exports = SerialPort;
