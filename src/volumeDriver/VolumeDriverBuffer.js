const _ = require('lodash');
const VolumeDriver = require('../VolumeDriver');

/**
 * @class
 * @extends {VolumeDriver}
 *
 * VolumeDriverBuffer is a class representing a volume driver buffer.
 * It extends from the VolumeDriver class, inheriting all its properties and methods.
 * In addition, it has its own properties and methods to handle buffer specific tasks.
 *
 * @param {string} path - The path of the instance. Kept for interface compatibility, unused.
 * @param {object} opts - Optional parameters for the instance.
 * @param {Buffer} opts.buffer - The buffer to be used.
 * @param {number} opts.partitionNumber - The partition number.
 * @throws {Error} If the buffer does not exist.
 * @throws {Error} If the buffer option is not a Buffer.
 * @example
 * const VolumeDriverBuffer = require('volume-driver-buffer');
 * const buffer = Buffer.alloc(512); // for a new volume, or pass in an existing buffer
 * const driver = new VolumeDriverBuffer('/path/to/buffer', {
 *   buffer: buffer
 * });
 *
 * driver.readSectors(0, buffer, () => {});
 * driver.writeSectors(0, buffer, () => {});
 */
class VolumeDriverBuffer extends VolumeDriver {
	/**
	 * Constructor function for creating a new instance of the class.
	 *
	 * @param {string} path - The path of the instance. Kept for API consistency, unused.
	 * @param {object} opts - Optional parameters for the instance.
	 * @param {Buffer} opts.buffer - The buffer to be used.
	 * @param {number} opts.partitionNumber - The partition number.
	 * @throws {Error} If the buffer does not exist.
	 * @throws {Error} If the buffer option is not a Buffer.
	 */
	constructor(path, opts = {}) {
		super(path, opts);

		if (opts.buffer === undefined) {
			throw new Error('Buffer does not exist!');
		}

		// Make sure opts.buffer is a Buffer
		if (!Buffer.isBuffer(opts.buffer)) {
			throw new Error('buffer option is not a Buffer!');
		}

		this._buffer = opts.buffer;

		const partitionNumber = _.isNumber(opts.partitionNumber) ? opts.partitionNumber : 0;

		if (partitionNumber !== 0) {
			this._partitionLBAList = this.readPartitions();
		}

		this.partitionNumber = partitionNumber;
	}

	/**
	 * Reads sectors from the buffer and copies them to the destination array.
	 *
	 * @param {number} i - The index of the sector to read.
	 * @param {ArrayBuffer} dest - The destination array to copy the sector data to.
	 * @param {function} cb - The callback function to be called when the sector data has been copied.
	 * @return {undefined} This function does not return a value.
	 */
	readSectors(i, dest, cb) {
		this.checkSectorLength(dest);

		const data = this._buffer.slice(this._partitionOffsetBytes + (i * this.sectorSize), this._partitionOffsetBytes + ((i + 1) * this.sectorSize));
		dest.set(data);
		cb(null, data);
	}

	/**
	 * Writes the given data to the specified sector in the volume.
	 *
	 * @param {number} i - The index of the sector to write to.
	 * @param {Buffer} data - The data to write to the sector.
	 * @param {Function} cb - The callback function to be called when the write operation is complete.
	 * @throws {Error} Cannot write to read-only volume!
	 */
	writeSectors(i, data, cb) {
		if (this.readOnly) {
			throw new Error('Cannot write to read-only volume!');
		}

		this.checkSectorLength(data);

		// Copy the data Buffer into the correct location in the buffer
		data.copy(this._buffer, this._partitionOffsetBytes + (i * this.sectorSize), 0, data.length);
		cb(null);
	}

	/**
	 * Reads the partitions from the buffer.
	 *
	 * @return {Array} An array of parsed partitions.
	 */
	readPartitions() {
		// Check to make sure that the buffer length is at least 512 bytes
		if (this._buffer.length < 512) {
			return [];
		}

		const mbrBuffer = Buffer.alloc(512);

		// Copy the first 512 bytes of the buffer into mbrBuffer
		this._buffer.copy(mbrBuffer, 0, 0, 512);

		return this.parsePartitionsFromBuffer(mbrBuffer);
	}

	/**
	 * Return the buffer size divided by the sector size.
	 *
	 * @return {number} The number of sectors.
	 */
	get numSectors() {
		// Return the buffer size devided by the sector size
		return this._buffer.length / this.sectorSize;
	}
}

module.exports = VolumeDriverBuffer;
