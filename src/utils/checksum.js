/* eslint no-bitwise: "off" */

function calculateChecksum(data) {
	let checksum = 0;
	for (let i = 0; i < data.length; i++) {
		checksum = (checksum + data[i]) % 256;
	}

	return checksum;
}

function calculateCRC(data) {
	const CRC_POLY = 0x1021; // CRC-16-CCITT polynomial
	let crc = 0xffff; // Initial value

	for (let i = 0; i < data.length; i++) {
		crc ^= data[i] << 8;
		for (let j = 0; j < 8; j++) {
			if (crc & 0x8000) {
				crc = (crc << 1) ^ CRC_POLY;
			} else {
				crc <<= 1;
			}

			crc &= 0xffff; // Ensure CRC remains 16-bit
		}
	}

	return crc;
}

module.exports = {
	calculateChecksum,
	calculateCRC,
};
