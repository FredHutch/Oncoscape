/*
 * Copyright (c) 2014 Christian Authmann
 */

#include "datatypes/foo.h"
#include "datatypes/bar.h"
#include "common/constants.h"
#include "common/binarystream.h"
#include "client/rinsideclient.h"

#include <limits>
#include <memory>
#include <sstream>
#include <fstream>
#include <string>
#include <mutex>
#include <functional>
#include <cmath>

/*
 * The following examples often talk about "serializable types". These are any
 * user-defined objects with a TYPEID, serialize() and deserialize() methods
 * (in this example: Foo and Bar) as well as std::string, most arithmetic types
 * and vectors of these.
 *
 * See common/typeid.h for a list.
 */

static void test_setting_getting() {
	auto stream = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R(stream);

	/*
	 * We can set variables in the R environment to any object we like, provided
	 * that the object is of a serializable type.
	 * We can get them accordingly.
	 */
	Foo foo("testfoo", 42, 43);
	printf("setting Foo(%s, %d, %d) in the R environment\n", foo.name.c_str(), foo.a, foo.b);
	R.setValue("foo", foo);

	auto foo2 = R.getValue<Foo>("foo");
	printf("got Foo(%s, %d, %d) via getValue\n", foo2.name.c_str(), foo2.a, foo2.b);

	auto foo3 = R.parseEval<Foo>("foo");
	printf("got Foo(%s, %d, %d) via parseEval\n", foo3.name.c_str(), foo3.a, foo3.b);

	try {
		auto foo = R.getValue<Foo>("IDoNotExist");
	}
	catch (const std::runtime_error &e) {
		printf("Getting a nonexistent variable failed with message:\n%s\n", e.what());
	}

	try {
		auto bar = R.getValue<Bar>("foo");
	}
	catch (const std::runtime_error &e) {
		printf("Getting foo as an object of class Bar failed with message:\n%s\n", e.what());
	}
}


static void test_callbacks() {
	// We initialize a new connection. The server will spawn a new process with a clean environment.
	auto stream = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R(stream);

	/*
	 * We can provide C++ functions to the R environment. Parameters and return value
	 * must be of a serializable type.
	 *
	 * This has a bit of an overhead, since each time a function is called, the parameters
	 * are sent over the network from R to C++, then the function is executed, and the
	 * result is sent back from C++ to R.
	 * You will want to avoid sending large objects, and you will want to avoid calling
	 * remote functions hundreds of times per second.
	 */
	std::function<Foo(const std::string &)> loadFoo =
		[] (const std::string &name) -> Foo {
		return Foo(name, name.length(), 1);
	};
	R.setCallback("loadFoo", loadFoo);

	std::function<Foo(const Foo &)> swapFoo =
		[] (const Foo &foo) -> Foo {
		return Foo(foo.name, foo.b, foo.a);
	};
	R.setCallback("swapFoo", swapFoo);

	std::function<Bar(int)> loadBar =
		[] (int id) -> Bar {
		std::string foo_name = std::string("foo_") + std::to_string(id);
		return Bar(foo_name, Foo(foo_name, foo_name.length(), id));
	};
	R.setCallback("loadBar", loadBar);

	std::function<std::vector<float>(float, float, const std::vector<int> &)> calibrate =
		[] (float offset, float scale, const std::vector<int> &in) -> std::vector<float> {
		std::vector<float> out;
		out.reserve(in.size());
		for ( auto &v : in )
			out.push_back(offset + (float) v * scale);
		return out;
	};
	R.setCallback("calibrate", calibrate);

	auto foo = R.parseEval<Foo>("foo = loadFoo('loaded')");
	printf("got Foo(%s, %d, %d) via loadFoo()\n", foo.name.c_str(), foo.a, foo.b);

	auto foo2 = R.parseEval<Foo>("swapFoo(foo)");
	printf("got Foo(%s, %d, %d) after swapFoo()\n", foo2.name.c_str(), foo2.a, foo2.b);

	auto bar = R.parseEval<Bar>("loadBar(42)");
	printf("got Bar(%s, Foo(%s, %d, %d))\n", bar.name.c_str(), bar.foo.name.c_str(), bar.foo.a, bar.foo.b);

	auto vec = R.parseEval<std::vector<float>>("calibrate(1.0, 0.3, c(1,2,3,4,5))");
	printf("Got c(");
	for (auto &v : vec)
		printf("%.2f, ", v);
	printf(") from calibrate()\n");

	try {
		auto foo3 = R.parseEval<Foo>("loadFoo()");
		printf("got Foo(%s, %d, %d) via loadFoo()\n", foo3.name.c_str(), foo3.a, foo3.b);
	}
	catch (const std::runtime_error &e) {
		printf("Calling loadFoo() with wrong parameters failed with message:\n%s\n", e.what());
	}
	catch (...) {
		printf("Calling loadFoo() with wrong parameters lead to an unrecoverable error, ending test\n");
		return;
	}

	// Passing incompatible parameters results in recoverable errors, so we can keep using the connection
	auto x = R.parseEval<int>("x = 42;");
	printf("Got x = %d\n", x);
}


static void test_console_output() {
	auto stream = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R(stream);

	/*
	 * It's probably useful to capture the output of R's console.
	 * So here's how you do it.
	 */
	R.parseEvalQ("print('Hello World')");
	auto output = R.getConsoleOutput();
	printf("Output of the R script:\n%s\n", output.c_str());
}


static void test_plot() {
	auto stream = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R(stream);

	/*
	 * According to a totally representative user survey, the main use of R is to draw fancy plots [citation needed].
	 *
	 * Of course, we can do that.
	 */
	R.initPlot(400,600);
	R.parseEvalQ("plot(c(0,0), type = 'n', xlim=c(0,1), ylim=c(-1,1), xlab = 'x', ylab = 'y', bty='n')");

	R.parseEvalQ("lines(c(0,0), c(-1,1), col='red', add=TRUE)");
	R.parseEvalQ("curve(-x, 0, 1, 200, col='blue', add=TRUE)");
	R.parseEvalQ("curve(0.5+sqrt(1-x^2)/2, 0, 1, 200, col='#00FF00', add=TRUE)");
	R.parseEvalQ("curve(0.5-sqrt(1-x^2)/2, 0, 1, 200, col='#33EE33', add=TRUE)");
	auto png = R.getPlot();
	printf("Got a png from the plot, saving to plot.png\n");

	std::fstream f("plot.png", std::fstream::out | std::fstream::binary | std::fstream::trunc);
	f << png;
	f.close();
}

static void test_multiple() {
	/*
	 * For our last trick, we'd like to show something that cannot be replicated using RInside directly:
	 * Handling multiple R environments at the same time.
	 */
	auto stream1 = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R1(stream1);

	auto stream2 = BinaryStream::connectToUnixSocket(ris_socket_address);
	RInsideClient R2(stream2);

	R1.setValue("id", 1);
	R2.setValue("id", 2);

	auto id1 = R1.getValue<int>("id");
	auto id2 = R2.getValue<int>("id");

	printf("id of environment 1 is: %d, id of environment 2 is: %d\n", id1, id2);
}


int main(void) {
	try {
		printf("==========================\nTesting setting and getting:\n==========================\n");
		test_setting_getting();
		printf("\n==========================\nTesting callbacks:\n==========================\n");
		test_callbacks();
		printf("\n==========================\nTesting console output:\n==========================\n");
		test_console_output();
		printf("\n==========================\nTesting plots:\n==========================\n");
		test_plot();
		printf("\n==========================\nTesting multiple environments:\n==========================\n");
		test_multiple();
	}
	catch (const BinaryStream::stream_exception &e) {
		printf("Error communicating with the server\nDid you start ./example_server?\n");
	}
}
