[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]

node-Rstats
===========

> An interface for node.js to statistical programming language R based on the fabulous Rcpp package

## Installation

Currently, `rstats` is ONLY supported for Unix operating systems.

Also, it is required that the R packages `RInside`, `Rcpp` and `RJSONIO` are installed inside R. Additionally, building the package using `node-gyp` requires

  * `python` (`v2.7`, `v3.x.x` is __*not*__ supported)
  * `make`
  * A C/C++ compiler toolchain, such as GCC

With these prerequisites satisfied, one can simply install `rstats` using npm

```bash
npm install rstats
```

## Getting Started

After installation, the package can be loaded as follows:

```javascript
var rstats  = require('rstats');
```

Once the package is loaded, we can create an R session by the command

```javascript
var R  = new rstats.session();
```
## Important Functions

### parseEvalQ

Evaluating R expressions is easy. We can use the *parseEvalQ* function as follows:

```javascript
R.parseEvalQ("cat('\n Hello World \n')");
```

### parseEval

To evaluate an R expression and directly capture its return value, one can use the *parseEval* function.

```javascript
var x = R.parseEval("c(1,2,3)");
```

The variable `x` is now equal to the array `[1,2,3]`.

### assign

Numeric values can be easily assigned to variables in the current R session:

```javascript
R.assign('x', 17);
R.assign('y', 3);

// calculate the sum of x+y and print the result
R.parseEvalQ("res = x + y; print(res);");
```

### get

To retrieve an object from the R session, we use the *get* command. For example, let us create a 2x2 matrix in R and retrieve it in JavaScript as a nested array:

```javascript
R.parseEvalQ("mat = matrix(1:4,ncol=2,nrow=2)");
var mat = R.get('mat');
```

Internally, the *get* function uses JSON in order to convert the R data types to JavaScript data types.

We can also run much more complicated calculations and expose the R objects to JavaScript. Consider a linear regression example:

```javascript
R.parseEvalQ('x = rnorm(100); y = 4x + rnorm(100); lm_fit = lm(y~x);');
var lm_fit = R.get('lm_fit');
var coefs = lm_fit.coefficients;
var residuals = lm_fit.residuals;
```

[npm-url]: https://npmjs.org/package/rstats
[npm-image]: https://badge.fury.io/js/rstats.svg
[travis-url]: https://travis-ci.org/Planeshifter/node-Rstats
[travis-image]: https://travis-ci.org/Planeshifter/node-Rstats.svg?branch=master
[daviddm-url]: https://david-dm.org/Planeshifter/node-Rstats.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/Planeshifter/node-Rstats

## Unit Tests

Run tests via the command `npm test`

---
## License

[GPL v2](http://www.gnu.org/licenses/gpl-2.0-standalone.html).

[npm-image]: https://badge.fury.io/js/rstats.svg
[npm-url]: http://badge.fury.io/js/rstats

[travis-image]: https://travis-ci.org/Planeshifter/node-Rstats.svg
[travis-url]: https://travis-ci.org/Planeshifter/node-Rstats

[coveralls-image]: https://img.shields.io/coveralls/Planeshifter/node-Rstats/master.svg
[coveralls-url]: https://coveralls.io/r/Planeshifter/node-Rstats?branch=master

[dependencies-image]: http://img.shields.io/david/Planeshifter/node-Rstats.svg
[dependencies-url]: https://david-dm.org/Planeshifter/node-Rstats
