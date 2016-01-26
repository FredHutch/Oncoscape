// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// More elaborate examples for exposing functions using C++11
//
// Copyright (C) 2014 Christian Authmann

#include <iostream>

#include <RcppCommon.h>

#if !defined(RCPP_USING_CXX11)
int main(int argc, char *argv[]) {
    std::cout << "This example requires a c++11 compatible compiler. Upgrade your compiler and/or add the -std=c++11 compiler option.\n";
    exit(0);
}
#elif RCPP_VERSION < Rcpp_Version(0,11,3)
int main(int argc, char *argv[]) {
    std::cout << "This example requires Rcpp 0.11.3 or later. Upgrade Rcpp and recompile this example.\n";
    exit(0);
}
#else

#include <memory>

/*
 * We have a simple data type with two values.
 *
 * Just to make it less simple (and more educational), this class is not copyable,
 * preventing it from being used as a function parameter or return type.
 */
class Foo {
    public:
        Foo(int a, int b) : a(a), b(b) {
        }
        ~Foo() {
        }

    private:
        Foo(const Foo &f) : a(f.a), b(f.b) {
            throw "Cannot copy construct Foo";
        }

        Foo &operator=(const Foo &f) {
            throw "Cannot copy assign Foo";
        }

    public:
        int a, b;
};


/*
 * We define converters between Foo and R objects, see
 * http://cran.r-project.org/web/packages/Rcpp/vignettes/Rcpp-extending.pdf
 *
 * These template declarations must be after RcppCommon.h and before Rcpp.h
 * The implementation can follow later, when all of Rcpp/Rinside is available.
 *
 * Since Foo is not copyable, we need a workaround. Instead of passing Foo
 * directly, we pass C++11's std::unique_ptr<Foo> - which is movable.
 * Note that the older std::auto_ptr does not work.
 */
namespace Rcpp {
    template<> SEXP wrap(const Foo &f);
    template<> SEXP wrap(const std::unique_ptr<Foo> &f);
    template<> std::unique_ptr<Foo> as(SEXP sexp);
}

#include <Rcpp.h>
#include <RInside.h>


/*
 * After including Rcpp/Rinside, we can implement the converters.
 */

// An implementation for unique_ptr
template<> SEXP Rcpp::wrap(const std::unique_ptr<Foo> &f) {
    return Rcpp::wrap(*f);
}

// And an implementation for a non-wrapped object
template<> SEXP Rcpp::wrap(const Foo &f) {
    Rcpp::List list;

    list["a"] = f.a;
    list["b"] = f.b;

    return Rcpp::wrap(list);
}

// Converting the R object back to a C++ object will always return a unique_ptr
template<> std::unique_ptr<Foo> Rcpp::as(SEXP sexp) {
    Rcpp::List list = Rcpp::as<Rcpp::List>(sexp);
    int a = list["a"];
    int b = list["b"];

    // With c++14, we'd use std::make_unique<Foo>(a, b) here
    return std::unique_ptr<Foo>(new Foo(a, b));
}


// C++ functions we wish to expose to R
std::unique_ptr<Foo> swapFoo(std::unique_ptr<Foo> input) {
    return std::unique_ptr<Foo>(new Foo(input->b, input->a));
}

std::unique_ptr<Foo> addFoo(std::unique_ptr<Foo> foo1, std::unique_ptr<Foo> foo2) {
    return std::unique_ptr<Foo>(new Foo(foo1->a + foo2->a, foo1->b + foo2->b));
}

/*
 * Let's also assume that we have some kind of data source. We want R scripts to be able
 * to query the database without actually exposing the database class.
 */
class FooDatabase {
    public:
        FooDatabase(int database_id) : database_id(database_id) {
        }
        // R scripts will want to call this..
        std::unique_ptr<Foo> queryFoo(int id) {
            return std::unique_ptr<Foo>(new Foo(database_id, id));
        }
        // ..but really should not be allowed call this.
        void destroyDatabase() {
            throw "boom!";
        }
    private:
        int database_id;
};


int main(int argc, char *argv[]) {
    // create an embedded R instance
    RInside R(argc, argv);

    // expose the "swapFoo" and "addFoo" functions in the global environment
    R["swapFoo"] = Rcpp::InternalFunction( &swapFoo );
    R["addFoo"] = Rcpp::InternalFunction( &addFoo );

    // We can also expose C++11's std::function, for example to grant access to these three "databases"
    FooDatabase db1(1), db2(2), db3(3);

    // All data from DB1 can be queried
    std::function< std::unique_ptr<Foo>(int) > queryDB1 = std::bind(&FooDatabase::queryFoo, std::ref(db1), std::placeholders::_1);
    R["queryDB1"] = Rcpp::InternalFunction( queryDB1 );

    // DB2 shall only be queried with id=42
    std::function< std::unique_ptr<Foo>() > queryDB2 = std::bind(&FooDatabase::queryFoo, std::ref(db2), 42);
    R["queryDB2"] = Rcpp::InternalFunction( queryDB2 );

    // For DB3, let's do some more complicated permission checks. That's a good excuse to use a lambda.
    std::function< std::unique_ptr<Foo>(int) > queryDB3 =
        [&db3] (int id) -> std::unique_ptr<Foo> {
            if (id < 0 || id > 20)
                throw "id out of allowed range";
            return db3.queryFoo(id);
        };
    R["queryDB3"] = Rcpp::InternalFunction( queryDB3 );


    std::unique_ptr<Foo> result = R.parseEvalNT(
        "foo1 = queryDB1(20);"
        //"print(foo1);" // a=1, b=20
        "foo2 = queryDB2();"
        //"print(foo2);" // a=2, b=42
        "foo3 = queryDB3(10);"
        //"print(foo3);" // a=3, b=10

        "foo1 = swapFoo(foo1);"
        //"print(foo1);" // a=20, b=1
        "foo = addFoo(foo1, addFoo(foo2, foo3));"
        //"print(foo);"  // a=25, b=53

        "foo;" // return the object
    );

    std::cout << "    Got result a=" << result->a << ", b=" << result->b << std::endl;
    std::cout << "    Expected   a=25, b=53" << std::endl;
}

#endif
