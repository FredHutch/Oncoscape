#include "bar.h"

Bar::Bar(const std::string &name, const Foo &foo) : name(name), foo(foo) {

}
Bar::~Bar() {

}

void Bar::serialize(BinaryStream &stream) const {
	stream.write(name);
	stream.write(foo);
}

Bar Bar::deserialize(BinaryStream &stream) {
	auto name = stream.read<std::string>();
	auto foo = stream.read<Foo>();
	return Bar(name, foo);
}
