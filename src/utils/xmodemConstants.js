module.exports = {
	PACKET_SIZE: 128,
	RETRY_LIMIT: 10,
	DATA_OFFSET: 3, // Data offset in the packet
	PACKET_HEADER_SIZE: 5,
	PACKET_BYTE: 0x1A, // Padding byte for incomplete data
};
