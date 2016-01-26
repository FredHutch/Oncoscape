#pragma once

/*
 * These wrappers only wrap into a trivial list. More complicated objects should either
 * map to a similar
 */

namespace Rcpp {

	// Bar
	template<> SEXP wrap(const Bar &bar) {
		Rcpp::List list;

		list["name"] = bar.name;
		list["foo"] = bar.foo;

		return Rcpp::wrap(list);
	}
	template<> Bar as(SEXP sexp) {
		Rcpp::List list = Rcpp::as<Rcpp::List>(sexp);

		return Bar(
			Rcpp::as<std::string>(list["name"]),
			Rcpp::as<Foo>(list["foo"])
		);
	}
}

