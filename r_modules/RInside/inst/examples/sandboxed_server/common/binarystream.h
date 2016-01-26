/*
 * Copyright (c) 2014 Christian Authmann
 */

#pragma once

#include "typeid.h"

#include <unistd.h>
#include <string>
#include <vector>
#include <type_traits>
#include <utility>
#include <exception>

/*
 * This is a stream class for IPC, meant to allow serialization of objects.
 *
 * We could use the POSIX socket API directly, but we choose to use a simple
 * wrapper for convenience and error handling via exceptions.
 *
 * We are not using std::iostream for several reasons.
 * First, the default overloads are meant for human-readable display, not
 * for efficient binary serialization.
 * Second, they're not reversible:
 *   out << 2 << 7 << 42
 * will result in a stream "2742", which cannot be correctly deserialized using
 *   in >> a >> b >> c
 *
 * Instead, we're opting for a very simple binary stream implementation
 * providing nothing but read() and write() functions, including some
 * overloads.
 *
 * - Primitive types are serialized as their binary representation.
 *   Do not attempt to communicate between machines of different word size
 *   or endianess!
 * - some native types (std::string, ...) have their own serialization functions
 * - other classes must implement serialize() and deserialize() methods
 *   (See foo.h for an example)
 *
 * Note that this is not meant as a lesson in good IPC or serialization design,
 * it's just a simple helper class to keep the rest of the code more readable.
 */

class BinaryStream {
	public:
		BinaryStream(int read_fd, int write_fd);
		~BinaryStream();
		void close();

		BinaryStream(const BinaryStream &) = delete;
		BinaryStream &operator=(const BinaryStream &) = delete;
		BinaryStream(BinaryStream &&);
		BinaryStream &operator=(BinaryStream &&);

		static BinaryStream connectToUnixSocket(const char *);

		void write(const char *buffer, size_t len);
		template<typename T> void write(const T& t);
		template<typename T> void write(T& t);

		size_t read(char *buffer, size_t len);
		template<typename T> typename std::enable_if< std::is_arithmetic<T>::value, size_t>::type
			read(T *t) { return read((char *) t, sizeof(T)); }
		template<typename T>
			T read();

		class stream_exception : std::exception {
		};

	private:
		bool is_eof;
		int read_fd, write_fd;
};

/*
 * Declare functions for serialization/deserialization of important native classes
 */
namespace serialization {
	template <typename T>
	struct serializer { };

	template <>
	struct serializer<std::string> {
		static void serialize(BinaryStream &, const std::string &);
		static std::string deserialize(BinaryStream &);
	};

	template <typename T>
	struct serializer<std::vector<T>> {
		static void serialize(BinaryStream &, const std::vector<T> &);
		static std::vector<T> deserialize(BinaryStream &);
	};
}


/*
 * Figure out if a class has serialize and deserialize methods
 */
namespace binary_stream_helpers {
	/*
	 * For void_t, see the CppCon2014 talk by Walter E. Brown: "Modern Template Metaprogramming: A Compendium", Part II
	 */
	template<typename...>
		struct void_t_struct { using type = void; };
	template<typename... C>
		using void_t = typename void_t_struct<C...>::type;

	/*
	 * Figuring out whether a class has serialize() and deserialize() members
	 */
	template <typename T>
	using serialize_member_t = decltype(  std::declval<T&>().serialize( std::declval<BinaryStream&>() )  );

	template <typename T>
	using deserialize_member_t = decltype(  T::deserialize( std::declval<BinaryStream&>() )  );

	template<typename T, typename = void>
	struct has_serialization_members_cv : std::false_type { };

	template<typename T>
	struct has_serialization_members_cv<T, void_t< serialize_member_t<T>, deserialize_member_t<T> > >
		: std::integral_constant<bool, std::is_same<serialize_member_t<T>,void>::value && std::is_same<deserialize_member_t<T>, T>::value > { };

	template<typename T>
	struct has_serialization_members : has_serialization_members_cv< typename std::decay<T>::type > { };

	/*
	 * Templates for serialization
	 */
	// Arithmetic types: serialize the binary representation
	template <typename T>
	typename std::enable_if< std::is_arithmetic<T>::value >::type stream_write(BinaryStream &stream, T& t) {
		stream.write((const char *) &t, sizeof(T));
	}

	// User-defined types: call .serialize()
	template <typename T>
	typename std::enable_if< has_typeid<T>::value && std::is_class<T>::value && has_serialization_members<T>::value >::type stream_write(BinaryStream &stream, T& t) {
		t.serialize(stream);
	}

	// Other classes: hopefully there's a function in the serialization namespace
	template <typename T>
	typename std::enable_if< has_typeid<T>::value && std::is_class<T>::value && !has_serialization_members<T>::value >::type stream_write(BinaryStream &stream, T &t) {
		serialization::serializer< typename std::decay<T>::type >::serialize(stream, t);
	}


	/*
	 * Typed template for deserialization
	 */
	// Arithmetic types: deserialize the binary representation
	template <typename T>
	typename std::enable_if< std::is_arithmetic<T>::value, T >::type stream_read(BinaryStream &stream) {
		T value;
		stream.read(&value);
		return value;
	}

	// User-defined types: call ::deserialize()
	template <typename T>
	typename std::enable_if< has_typeid<T>::value && std::is_class<T>::value && has_serialization_members<T>::value, T >::type stream_read(BinaryStream &stream) {
		return T::deserialize(stream);
	}

	// Other classes: hopefully there's a function in the serialization namespace
	template <typename T>
	typename std::enable_if< has_typeid<T>::value && std::is_class<T>::value && !has_serialization_members<T>::value, T >::type stream_read(BinaryStream &stream) {
		return serialization::serializer< typename std::decay<T>::type >::deserialize(stream);
	}
}


template<typename T> void BinaryStream::write(const T& t) {
	binary_stream_helpers::stream_write<const T>(*this, t);
}
template<typename T> void BinaryStream::write(T& t) {
	binary_stream_helpers::stream_write<T>(*this, t);
}

template<typename T> T BinaryStream::read() {
	return binary_stream_helpers::stream_read<T>(*this);
}
