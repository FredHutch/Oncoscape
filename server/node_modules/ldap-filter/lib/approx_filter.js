// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function ApproximateFilter(options) {
  if (typeof (options) === 'object') {
    assert.string(options.attribute, 'options.attribute');
    assert.string(options.value, 'options.value');
    this.attribute = options.attribute;
    this.value = options.value;
  }

  var self = this;
  this.__defineGetter__('type', function () { return 'approx'; });
  this.__defineGetter__('json', function () {
    return {
      type: 'ApproximateMatch',
      attribute: self.attribute,
      value: self.value
    };
  });
}
util.inherits(ApproximateFilter, helpers.Filter);


ApproximateFilter.prototype.toString = function () {
  return ('(' + helpers.escape(this.attribute) +
          '~=' + helpers.escape(this.value) + ')');
};


ApproximateFilter.prototype.matches = function () {
  // Consumers must implement this themselves
  throw new Error('approx match implementation missing');
};


///--- Exports

module.exports = ApproximateFilter;
