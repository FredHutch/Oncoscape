#pragma once
/*
 * These are just two example classes that will be communicated between program and rserver.
 *
 * See common/binarystream.h/.cpp for information about serialization,
 * see foo_rcpp_wrapper_*.h for code that converts these objects into R objects and back.
 */

#include "common/binarystream.h"
#include <string>
#include <cstdint>


/*
 * Foo just contains a name and two numbers.
 */
class Foo {
	public:
		Foo(const std::string &name, int32_t a, int32_t b);
		~Foo();

		std::string name;
		int32_t a, b;

		// These three are for IPC
		static const int32_t TYPEID = 1;
		void serialize(BinaryStream &stream) const;
		static Foo deserialize(BinaryStream &stream);
};
