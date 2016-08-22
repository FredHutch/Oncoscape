// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function NotFilter(options) {
  if (typeof (options) === 'object') {
    assert.object(options.filter, 'options.filter');
  } else {
    options = {};
  }

  this.filter = options.filter || {};

  var self = this;
  this.__defineGetter__('type', function () { return 'not'; });
  this.__defineGetter__('json', function () {
    return {
      type: 'Not',
      filter: self.filter
    };
  });
}
util.inherits(NotFilter, helpers.Filter);


NotFilter.prototype.addFilter = function (filter) {
  assert.object(filter, 'filter');
  this.filter = filter;
};


NotFilter.prototype.toString = function () {
  return '(!' + this.filter.toString() + ')';
};


NotFilter.prototype.matches = function (target, strictAttrCase) {
  return !this.filter.matches(target, strictAttrCase);
};


///--- Exports

module.exports = NotFilter;
