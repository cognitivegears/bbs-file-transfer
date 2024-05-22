const fs = require('fs');

/**
 *
 * @class
 *
 * @abstract
 *
 * VolumeDriver is an abstract class that serves as the base class for different types of volume drivers.
 *
 * It should not be instantiated directly. Instead, you should create instances of classes that extend VolumeDriver.
 *
 *
 *
 * @property {string} _path - The path to the file.
 *
 * @property {Object} opts - Optional parameters.
 *
 * @property {boolean} opts.readOnly - Whether the file is read-only.
 *
 * @property {number} _fileMode - The mode for file operations. It's determined by the read-only option.
 *
 *
 *
 * @method partitionOffsetBytes() - This method should be implemented in a subclass.
 *
 * @method partitionNumber() - This method should be implemented in a subclass.
 *
 * @method readOnly() - This method should be implemented in a subclass.
 *
 * @method checkSectorLength(dest) - This method should be implemented in a subclass.
 *
 * @method readSectors(_i, _dest, _cb) - This method should be implemented in a subclass.
 *
 * @method writeSectors(_i, _data, _cb) - This method should be implemented in a subclass.
 *
 * @method parsePartitionsFromBuffer(buffer) - This method should be implemented in a subclass.
 * @method readPartitions() - This method should be implemented in a subclass.
 * @method sectorSize() - This method should be implemented in a subclass.
 * @method numSectors() - This method should be implemented in a subclass.
 */
class VolumeDriver {
	/**
	 * Abstract constructor for the class. Should not be called directly.
	 *
	 * @param {_path} _path - The path to the file.
	 * @param {Object} opts - Optional parameters.
	 * @param {boolean} opts.readOnly - Whether the file is read-only.
	 * @return {void}
	 */
	constructor(_path, opts = {}) {
		if (new.target === VolumeDriver) {
			throw new TypeError('Cannot construct VolumeDriver instances directly');
		}

		let fileMode = fs.constants.R_OK;
		if (!opts.readOnly) {
			// eslint-disable-next-line no-bitwise
			fileMode |= fs.constants.W_OK;
		}

		this._readOnly = opts.readOnly;

		this._fileMode = fileMode;
	}

	/**
	 * Returns the offset bytes for the currently selected partition
	 *
	 * @return {any} The offset bytes used for reading / writing.
	 */
	get partitionOffsetBytes() {
		return this._partitionOffsetBytes;
	}

	/**
	 * Get the value of the partitionNumber property.
	 *
	 * @return {any} The current partitionNumber, or 0 if no partitions exist.
	 */
	get partitionNumber() {
		return this._partitionNumber;
	}

	/**
	 * Set the partition number and calculate the partition offset in bytes.
	 *
	 * @param {number} partitionNumber - The number of the partition to set, or 0 for no partitions.
	 * @throws {Error} If the partition number does not exist.
	 */
	set partitionNumber(partitionNumber) {
		if (partitionNumber === 0) {
			this._partitionNumber = 0;
			this._partitionOffsetBytes = 0;
			return;
		}

		if (partitionNumber < 1 || partitionNumber > this._partitionLBAList.length) {
			throw new Error('Partition ' + partitionNumber + ' does not exist!');
		}

		this._partitionNumber = partitionNumber;
		this._partitionOffsetBytes = this._partitionLBAList[this._partitionNumber - 1] * this.sectorSize;
	}

	/**
	 * Get the value of the readOnly property.
	 *
	 * @return {type} Whether the file should be treated as read-only.
	 */
	get readOnly() {
		return this._readOnly;
	}

	/**
	 * Checks if the length of a destination buffer is a multiple of the sector size.
	 *
	 * @param {any} dest - The destination buffer to check.
	 * @throws {Error} Throws an error if the buffer length is not a multiple of the sector size.
	 */
	checkSectorLength(dest) {
		if (dest.length % this.sectorSize) {
			throw Error('Unexpected buffer length!');
		}
	}

	/**
	 * Abstract method for reading sectors. Should not be called directly.
	 *
	 * @param {number} i - The index of the sector to read.
	 * @param {ArrayBuffer} dest - The destination array to copy the sector data to.
	 * @param {function} cb - The callback function to be called when the sector data has been copied.
	 * @return {undefined} This function does not return a value.
	 */
	readSectors(_i, _dest, _cb) {
		throw new Error('Abstract method \'readSectors\' must be implemented');
	}

	/**
	 * Abstract method for writing sectors. Should not be called directly.
	 *
	 * @param {number} i - The index of the sector to write to.
	 * @param {Buffer} data - The data to write to the sector.
	 * @param {Function} cb - The callback function to be called when the write operation is complete.
	 * @throws {Error} Cannot write to read-only volume!
	 */
	writeSectors(_i, _data, _cb) {
		throw new Error('Abstract method \'writeSectors\' must be implemented');
	}

	/**
	 * Parses partitions from a buffer. Reads a FAT16 MBR and returns an array of partition offsets.
	 *
	 * @param {Buffer} buffer - The buffer to parse partitions from.
	 * @return {Array} An array of partition offsets.
	 */
	parsePartitionsFromBuffer(buffer) {
		const partitionOffsets = [];
		for (let i = 446; i < 510; i += 16) {
			partitionOffsets.push(buffer.readInt32LE(i + 8));
		}

		return partitionOffsets;
	}

	/**
	 * Abstract method for reading partitions. Should not be called directly.
	 *
	 * @throws {Error} Abstract method 'readPartitions' must be implemented
	 */
	readPartitions() {
		throw new Error('Abstract method \'readPartitions\' must be implemented');
	}

	/**
	 * Get the sector size.
	 *
	 * @return {number} The sector size. Currently always returns 512.
	 */
	get sectorSize() {
		return 512;
	}

	/**
	 * Abstract method for getting the number of sectors. Should not be called directly.
	 *
	 * @return {Error} Abstract method 'numSectors' must be implemented
	 */
	get numSectors() {
		throw new Error('Abstract method \'numSectors\' must be implemented');
	}
}

module.exports = VolumeDriver;
