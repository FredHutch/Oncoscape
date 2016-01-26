// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example showing how expose a C++ function with custom data types
// This is a continuation of rinside_sample9.cpp
//
// Copyright (C) 2014 Christian Authmann

#include <iostream>

/*
 * We have a simple data type with two values.
 */
class Foo {
    public:
        Foo(int a, int b) : a(a), b(b) {
        }
        ~Foo() {
        }

        // The compiler will add the default copy constructor, so this class is copyable.

        int a, b;
};


/*
 * We define converters between Foo and R objects, see
 * http://cran.r-project.org/web/packages/Rcpp/vignettes/Rcpp-extending.pdf
 */
#include <RcppCommon.h>
/*
 * These template declarations must be after RcppCommon.h and before Rcpp.h
 * The implementation can follow later, when all of Rcpp/Rinside is available.
 */
namespace Rcpp {
    template<> SEXP wrap(const Foo &f);
    template<> Foo as(SEXP sexp);
}

#include <Rcpp.h>
#include <RInside.h>


/*
 * After including Rcpp/Rinside, we can implement the converters.
 */
template<> SEXP Rcpp::wrap(const Foo &f) {
    Rcpp::List list;

    list["a"] = f.a;
    list["b"] = f.b;

    // Like all internal Rcpp datatypes, the List can be autoconverted to a SEXP, so we can just return it.
    // This is equivalent to: return Rcpp::wrap(list)
    return list;
}

template<> Foo Rcpp::as(SEXP sexp) {
    Rcpp::List list = Rcpp::as<Rcpp::List>(sexp);
    // Note: This does not work when compiled using clang with Rcpp 0.11.2 and older
    return Foo(
        list["a"],
        list["b"]
    );
}


// a c++ function we wish to expose to R
Foo swapFoo(Foo &input) {
    Foo result(input.b, input.a);
    return result;
}

int main(int argc, char *argv[]) {

    // create an embedded R instance
    RInside R(argc, argv);

    // expose the "swapFoo" function in the global environment
    R["swapFoo"] = Rcpp::InternalFunction( &swapFoo );

    // create a foo instance and expose it
    Foo f(0, 42);
    R["foo"] = f;

    // call it, getting another Foo object
    Foo result = R.parseEvalNT(
        //"print(foo);" // a=0, b=42
        "foo$a = 12;"
        //"print(foo);" // a=12, b=42
        "foo = swapFoo(foo);"
        //"print(foo);" // a=42, b=12

        "foo;" // return the object
    );

    std::cout << "    Got result a=" << result.a << ", b=" << result.b << std::endl;
    std::cout << "    Expected   a=42, b=12" << std::endl;

}
