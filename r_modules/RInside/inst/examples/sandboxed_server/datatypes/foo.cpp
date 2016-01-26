
#include "foo.h"

Foo::Foo(const std::string &name, int32_t a, int32_t b) : name(name), a(a), b(b) {

}

Foo::~Foo() {

}

void Foo::serialize(BinaryStream &stream) const {
	stream.write(name);
	stream.write(a);
	stream.write(b);
}


Foo Foo::deserialize(BinaryStream &stream) {
	auto name = stream.read<std::string>();
	auto a = stream.read<int32_t>();
	auto b = stream.read<int32_t>();
	return Foo(name, a, b);
}

