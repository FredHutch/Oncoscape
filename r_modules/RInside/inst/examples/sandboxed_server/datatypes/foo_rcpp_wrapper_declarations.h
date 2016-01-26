#pragma once


namespace Rcpp {
	// Foo
	template<> SEXP wrap(const Foo &foo);
	template<> Foo as(SEXP sexp);
}

