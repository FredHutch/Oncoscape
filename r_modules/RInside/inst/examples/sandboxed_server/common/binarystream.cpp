/*
 * Copyright (c) 2014 Christian Authmann
 */

#include "binarystream.h"

#include <sstream>
#include <cstring> // memset(), strerror()
#include <memory>
#include <stdexcept>

#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>


BinaryStream::BinaryStream(int read_fd, int write_fd) : is_eof(false), read_fd(read_fd), write_fd(write_fd) {
}

BinaryStream::~BinaryStream() {
	close();
}

void BinaryStream::close() {
	if (read_fd == write_fd)
		write_fd = -1;
	if (read_fd >= 0) {
		::close(read_fd);
		read_fd = -1;
	}
	if (write_fd >= 0) {
		::close(write_fd);
		write_fd = -1;
	}
	is_eof = true;
}

BinaryStream::BinaryStream(BinaryStream &&other) : is_eof(other.is_eof), read_fd(other.read_fd), write_fd(other.write_fd) {
	other.is_eof = true;
	other.read_fd = -1;
	other.write_fd = -1;
}

BinaryStream &BinaryStream::operator=(BinaryStream &&other) {
	std::swap(is_eof, other.is_eof);
	std::swap(read_fd, other.read_fd);
	std::swap(write_fd, other.write_fd);
	return *this;
}


BinaryStream BinaryStream::connectToUnixSocket(const char *server_path) {
	int new_fd = socket(AF_UNIX, SOCK_STREAM, 0);
	if (new_fd < 0)
		throw stream_exception();

	struct sockaddr_un server_addr;
	memset((void *) &server_addr, 0, sizeof(server_addr));

	server_addr.sun_family = AF_UNIX;
	strcpy(server_addr.sun_path, server_path);
	if (connect(new_fd, (sockaddr *) &server_addr, sizeof(server_addr)) == -1) {
		::close(new_fd);
		throw stream_exception();
	}

	return BinaryStream(new_fd, new_fd);
}


void BinaryStream::write(const char *buffer, size_t len) {
	if (write_fd < 0)
		throw stream_exception();

	//printf("Stream: writing %lu bytes\n", len);
	auto res = ::write(write_fd, buffer, len);
	if (res < 0 || (size_t) res != len) {
		// strerror(errno);
		throw stream_exception();
	}
}

size_t BinaryStream::read(char *buffer, size_t len) {
	if (read_fd < 0 || is_eof)
		throw stream_exception();

	//printf("Stream: reading %lu bytes\n", len);

	size_t remaining = len;
	size_t bytes_read = 0;
	while (remaining > 0) {
		auto r = ::read(read_fd, buffer, remaining);
		if (r == 0) {
			is_eof = true;
			throw stream_exception();
		}
		if (r < 0) {
			// strerror(errno);
			throw stream_exception();
		}
		bytes_read += r;
		buffer += r;
		remaining -= r;
	}
	if (bytes_read != len)
		throw stream_exception();

	return bytes_read;
}



namespace serialization {
	// Strings
	void serializer<std::string>::serialize(BinaryStream &stream, const std::string &string) {
		size_t len = string.size();
		if (len > (size_t) (1<<31))
			throw BinaryStream::stream_exception();
		stream.write(len);
		stream.write(string.data(), len);
	}

	std::string serializer<std::string>::deserialize(BinaryStream &stream) {
		auto len = stream.read<size_t>();
		if (len == 0)
			return "";

		if (len > (size_t) (1<<31))
			throw BinaryStream::stream_exception();

		std::unique_ptr<char[]> buffer( new char[len] );
		stream.read(buffer.get(), len);

		std::string string(buffer.get(), len);
		return string;
	}

	// Vectors
	template <typename T>
	void serializer<std::vector<T>>::serialize(BinaryStream &stream, const std::vector<T> &vec) {
		size_t size = vec.size();
		if (size > (size_t) (1<<31))
			throw BinaryStream::stream_exception();
		stream.write(size);
		for (size_t i=0;i<size;i++)
			stream.write(vec[i]);
	}
	template <typename T>
	std::vector<T> serializer<std::vector<T>>::deserialize(BinaryStream &stream) {
		std::vector<T> vec;
		auto size = stream.read<size_t>();
		if (size > (size_t) (1<<31))
			throw BinaryStream::stream_exception();
		vec.reserve(size);
		for (size_t i=0;i<size;i++)
			vec.push_back(stream.read<T>());
		return vec;
	};

	// Note: when adding more serializers, don't forget to add their declaration in binarystream.h!

	// Make sure to instantiate the vectors we need
	template struct serializer<std::vector<int8_t>>;
	template struct serializer<std::vector<uint8_t>>;
	template struct serializer<std::vector<int16_t>>;
	template struct serializer<std::vector<uint16_t>>;
	template struct serializer<std::vector<int32_t>>;
	template struct serializer<std::vector<uint32_t>>;
	template struct serializer<std::vector<int64_t>>;
	template struct serializer<std::vector<uint64_t>>;
	template struct serializer<std::vector<float>>;
	template struct serializer<std::vector<double>>;
	template struct serializer<std::vector<std::string>>;
}
