// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function AndFilter(options) {
  if (typeof (options) === 'object') {
    assert.arrayOfObject(options.filters, 'options.filters');
  } else {
    options = {};
  }

  this.__defineGetter__('type', function () { return 'and'; });
  this.filters = options.filters ? options.filters.slice() : [];

  var self = this;
  this.__defineGetter__('json', function () {
    return {
      type: 'And',
      filters: self.filters
    };
  });
}
util.inherits(AndFilter, helpers.Filter);


AndFilter.prototype.toString = function () {
  var str = '(&';
  this.filters.forEach(function (f) {
    str += f.toString();
  });
  str += ')';

  return str;
};


AndFilter.prototype.matches = function (target, strictAttrCase) {
  assert.object(target, 'target');

  if (this.filters.length === 0) {
    /* true per RFC4526 */
    return true;
  }

  for (var i = 0; i < this.filters.length; i++) {
    if (!this.filters[i].matches(target, strictAttrCase))
      return false;
  }

  return true;
};


AndFilter.prototype.addFilter = function (filter) {
  assert.object(filter, 'filter');

  this.filters.push(filter);
};


///--- Exports

module.exports = AndFilter;
