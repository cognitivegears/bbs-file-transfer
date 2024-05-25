/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const FileTransfer = require('./fileTransfer');
const {calculateChecksum} = require('../utils/checksum');
const {
	SOH,
	EOT,
	ACK,
	NAK,
	CAN,
	TIMEOUT,
} = require('../utils/commonConstants');
const {PACKET_SIZE, RETRY_LIMIT, DATA_OFFSET, PACKET_HEADER_SIZE, PADDING_BYTE} = require('../utils/xmodemConstants');
const ChecksumError = require('../errors/checksumError');

class XModem extends FileTransfer {
	constructor(transport, logger = console) {
		super(transport, logger);
		this.packetSize = PACKET_SIZE;
	}

	async startTransfer(fileBuffer) {
		try {
			await this.transport.send(Buffer.from([NAK]));
			await this.sendFileInChunks(fileBuffer);
			await this.transport.send(Buffer.from([EOT]));
			const finalAck = await this.waitForAck();
			if (!finalAck) {
				throw new Error('Final ACK not received');
			}
		} catch (error) {
			this.handleError(error);
		}
	}

	async sendFileInChunks(fileBuffer) {
		let packetNumber = 1;
		let offset = 0;

		while (offset < fileBuffer.length) {
			const dataBlock = fileBuffer.slice(offset, offset + this.packetSize);
			await this.trySendPacket(packetNumber, dataBlock);
			packetNumber = (packetNumber + 1) % 256;
			offset += this.packetSize;
		}
	}

	trySendPacket(packetNumber, data) {
		const packet = this.createPacket(packetNumber, data);
		return new Promise((resolve, reject) => {
			const attemptSend = retries => {
				this.transport.send(packet)
					.then(() => this.waitForAck())
					.then(ack => {
						if (ack) {
							resolve();
						} else if (retries > 0) {
							attemptSend(retries - 1);
						} else {
							reject(new Error('Failed to send packet after multiple attempts'));
						}
					})
					.catch(reject);
			};

			attemptSend(RETRY_LIMIT);
		});
	}

	createPacket(packetNumber, data) {
		const packet = Buffer.alloc(this.packetSize + PACKET_HEADER_SIZE);
		packet[0] = SOH;
		packet[1] = packetNumber;
		packet[2] = 255 - packetNumber;
		data.copy(packet, DATA_OFFSET);
		if (data.length < this.packetSize) {
			packet.fill(PADDING_BYTE, DATA_OFFSET + data.length);
		}

		const checksum = calculateChecksum(data);
		packet[this.packetSize + DATA_OFFSET] = checksum;
		return packet;
	}

	async waitForAck() {
		return new Promise(resolve => {
			const onDataReceived = data => {
				if (data[0] === ACK) {
					this.transport.removeListener('data', onDataReceived);
					resolve(true);
				} else if (data[0] === NAK) {
					this.transport.removeListener('data', onDataReceived);
					resolve(false);
				}
			};

			this.transport.on('data', onDataReceived);
			setTimeout(() => {
				this.transport.removeListener('data', onDataReceived);
				resolve(false);
			}, TIMEOUT);
		});
	}

	async receiveFile() {
		return new Promise((resolve, reject) => {
			let receivedBuffer = Buffer.alloc(0);
			let expectedPacketNumber = 1;

			const onDataReceived = async data => {
				try {
					if (!Buffer.isBuffer(data) || data.length < PACKET_HEADER_SIZE) {
						throw new Error('Invalid data received');
					}

					if (data[0] === SOH) {
						receivedBuffer = await this.handleSohPacket(data, expectedPacketNumber, receivedBuffer);
						expectedPacketNumber = (expectedPacketNumber + 1) % 256;
					} else if (data[0] === EOT) {
						await this.transport.send(Buffer.from([ACK]));
						this.transport.removeListener('data', onDataReceived);
						resolve(receivedBuffer);
					} else if (data[0] === CAN) {
						this.transport.removeListener('data', onDataReceived);
						reject(new Error('Transfer cancelled.'));
					} else {
						this.logger.error('Unexpected data received.');
						await this.transport.send(Buffer.from([NAK]));
					}
				} catch (error) {
					this.handleError(error);
				}
			};

			this.transport.on('data', onDataReceived);
			this.transport.send(Buffer.from([NAK]))
				.catch(error => {
					this.handleError(error);
					reject(error);
				});
		});
	}

	async handleSohPacket(data, expectedPacketNumber, receivedBuffer) {
		const packetNumber = data[1];
		const packetNumberComplement = data[2];

		if (packetNumber !== (255 - packetNumberComplement)) {
			this.logger.error('Packet number and its complement do not match.');
			await this.transport.send(Buffer.from([NAK]));
			return receivedBuffer;
		}

		if (packetNumber === expectedPacketNumber) {
			const packetData = data.slice(DATA_OFFSET, DATA_OFFSET + this.packetSize);
			const checksum = data[DATA_OFFSET + this.packetSize];
			const calculatedChecksum = calculateChecksum(packetData);

			if (checksum === calculatedChecksum) {
				receivedBuffer = Buffer.concat([receivedBuffer, packetData]);
				await this.transport.send(Buffer.from([ACK]));
			} else {
				await this.transport.send(Buffer.from([NAK]));
				throw new ChecksumError('Checksum mismatch.');
			}
		} else if (packetNumber === (expectedPacketNumber - 1)) {
			await this.transport.send(Buffer.from([ACK]));
		} else {
			this.logger.error('Unexpected packet number.');
			await this.transport.send(Buffer.from([NAK]));
		}

		return receivedBuffer;
	}

	handleError(error) {
		this.logger.error('Handling error:', error.message);
		if (error.message.includes('Final ACK not received')) {
			this.logger.error('Transfer failed: Final ACK not received. Aborting transfer.');
		} else if (error.message.includes('Failed to send packet')) {
			this.logger.error('Transfer failed: Unable to send packet after multiple attempts.');
		} else if (error instanceof ChecksumError) {
			this.logger.error('Transfer failed: Checksum error.');
		} else {
			this.logger.error('Transfer failed: An unknown error occurred.');
		}

		this.abortTransfer();
	}

	async abortTransfer() {
		try {
			await this.transport.send(Buffer.from([CAN, CAN]));
			this.logger.info('Transfer aborted successfully.');
		} catch (err) {
			this.logger.error('Failed to send abort signal:', err.message);
		}
	}
}

module.exports = XModem;
