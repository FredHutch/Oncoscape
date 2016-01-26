#pragma once

/*
 * Foo objects are wrapped into a trivial list. More complicated objects should either
 * map to a similar native R type or possibly create their own S4 definitions.
 */

namespace Rcpp {
	// Foo
	template<> SEXP wrap(const Foo &foo) {
		Rcpp::List list;

		list["name"] = foo.name;
		list["a"] = foo.a;
		list["b"] = foo.b;

		return Rcpp::wrap(list);
	}
	template<> Foo as(SEXP sexp) {
		Rcpp::List list = Rcpp::as<Rcpp::List>(sexp);

		return Foo(
			Rcpp::as<std::string>(list["name"]),
			Rcpp::as<int>(list["a"]),
			Rcpp::as<int>(list["b"])
		);
	}
}

