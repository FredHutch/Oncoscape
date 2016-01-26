#pragma once
/*
 * These are just two example classes that will be communicated between program and rserver.
 *
 * See binarystream.h/.cpp for information about serialization,
 * see bar_rcpp_wrapper_*.h for code that converts these objects into R objects and back.
 */

#include "common/binarystream.h"
#include <string>
#include <cstdint>

#include "foo.h"


/*
 * Bar contains a name and a Foo object, because recursive data structures are fun!
 */
class Bar {
	public:
		Bar(const std::string &name, const Foo &foo);
		~Bar();

		std::string name;
		Foo foo;

		// These three are for IPC
		static const int32_t TYPEID = 2;
		void serialize(BinaryStream &stream) const;
		static Bar deserialize(BinaryStream &stream);
};
