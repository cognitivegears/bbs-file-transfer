const VolumeDriverBuffer = require('./volumeDriver/VolumeDriverBuffer');
const VolumeDriverFile = require('./volumeDriver/VolumeDriverFile');

/**
 * Creates a buffer driver synchronously.
 *
 * @param {string} path - The path to the buffer driver. Kept for API consistency, unused.
 * @param {object} opts - Options for the buffer driver. Must include the buffer option.
 * @return {VolumeDriverBuffer} A new instance of the VolumeDriverBuffer.
 */
exports.createBufferDriverSync = function (path, opts = {}) {
	return new VolumeDriverBuffer(path, opts);
};

/**
 * Creates a file driver synchronously.
 *
 * @param {string} path - The path to the file.
 * @param {Object} opts - Optional arguments.
 * @return {VolumeDriverFile} - The created VolumeDriverFile instance.
 */
exports.createFileDriverSync = function (path, opts = {}) {
	return new VolumeDriverFile(path, opts);
};
