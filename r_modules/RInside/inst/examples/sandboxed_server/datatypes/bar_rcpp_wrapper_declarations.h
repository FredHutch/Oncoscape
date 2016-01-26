#pragma once


namespace Rcpp {

	// Bar
	template<> SEXP wrap(const Bar &bar);
	template<> Bar as(SEXP sexp);
}

