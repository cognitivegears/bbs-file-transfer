const fs = require('fs');
const _ = require('lodash');
const VolumeDriver = require('../VolumeDriver');

/**
 * File based volume driver.
 * @extends {VolumeDriver}
 * @class
 * @param {string} path - The path to the file.
 * @param {object} [opts={}] - Optional parameters.
 * @param {boolean} [opts.readOnly=false] - Flag to indicate if the file should be opened in read-only mode.
 * @param {number} [opts.partitionNumber=0] - The partition number.
 * @throws {Error} If the file does not exist.
 *
 * @example
 * const VolumeDriverFile = require('volume-driver-file');
 * const driver = new VolumeDriverFile('/path/to/file', {readOnly: false});
 * const buffer = Buffer.alloc(512);
 * driver.readSectors(0, buffer, () => {});
 * driver.writeSectors(0, buffer, () => {});
 * driver.close();
 */
class VolumeDriverFile extends VolumeDriver {
	/**
	 * Constructor for the class.
	 *
	 * @param {string} path - The path to the file.
	 * @param {object} [opts={}] - Optional parameters.
	 * @param {boolean} [opts.readOnly=false] - Flag to indicate if the file should be opened in read-only mode.
	 * @param {number} [opts.partitionNumber=0] - The partition number.
	 * @throws {Error} If the file does not exist.
	 */
	constructor(path, opts = {}) {
		super(path, opts);

		if (!fs.existsSync(path)) {
			throw new Error('File does not exist!');
		}

		this._fd = fs.openSync(path, opts.readOnly ? 'r' : 'r+');
		this._s = fs.fstatSync(this._fd);

		const partitionNumber = _.isNumber(opts.partitionNumber) ? opts.partitionNumber : 0;

		if (partitionNumber !== 0) {
			this._partitionLBAList = this.readPartitions();
		}

		this.partitionNumber = partitionNumber;
	}

	/**
	 * Reads sectors from a file.
	 *
	 * @param {number} i - the index of the sector to read
	 * @param {Buffer} dest - the buffer to store the sector data
	 * @param {function} cb - the callback function to be called with the results
	 * @return {void}
	 */
	readSectors(i, dest, cb) {
		this.checkSectorLength(dest);

		fs.read(this._fd, dest, 0, dest.length, this._partitionOffsetBytes + (i * this.sectorSize), (e, n, d) => {
			cb(e, d);
		});
	}

	/**
	 * Writes the specified data to the sectors starting at index i.
	 *
	 * @param {number} i - The starting index of the sectors to write to.
	 * @param {Buffer} data - The data to write to the sectors.
	 * @param {function} cb - The callback function to be called when the write operation is completed.
	 * @return {void}
	 */
	writeSectors(i, data, cb) {
		this.checkSectorLength(data);

		fs.write(this._fd, data, 0, data.length, this._partitionOffsetBytes + (i * this.sectorSize), e => {
			cb(e);
		});
	}

	/**
 	* Reads the partitions from the disk.
 	*
 	* @return {Array} An array of parsed partitions.
 	*/
	readPartitions() {
		if (this._s.size < 512) {
			return [];
		}

		const mbrBuffer = Buffer.alloc(512);
		fs.readSync(this._fd, mbrBuffer, 0, 512, 0);

		return this.parsePartitionsFromBuffer(mbrBuffer);
	}

	/**
	 * Returns the number of sectors.
	 *
	 * @return {number} The number of sectors.
	 */
	get numSectors() {
		return this._s.size / this.sectorSize;
	}
}

module.exports = VolumeDriverFile;

