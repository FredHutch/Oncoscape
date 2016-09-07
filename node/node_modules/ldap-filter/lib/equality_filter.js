// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function EqualityFilter(options) {
  if (typeof (options) === 'object') {
    assert.string(options.attribute, 'options.attribute');
    this.attribute = options.attribute;
    // Prefer Buffers over strings to make filter cloning easier
    if (options.raw) {
      this.raw = options.raw;
    } else {
      this.raw = new Buffer(options.value);
    }
  } else {
    this.raw = new Buffer(0);
  }

  var self = this;
  this.__defineGetter__('type', function () { return 'equal'; });
  this.__defineGetter__('value', function () {
    return (Buffer.isBuffer(self.raw)) ? self.raw.toString() : self.raw;
  });
  this.__defineSetter__('value', function (data) {
    if (typeof (data) === 'string') {
      self.raw = new Buffer(data);
    } else if (Buffer.isBuffer(data)) {
      self.raw = new Buffer(data.length);
      data.copy(self.raw);
    } else {
      self.raw = data;
    }
  });
  this.__defineGetter__('json', function () {
    return {
      type: 'EqualityMatch',
      attribute: self.attribute,
      value: self.value
    };
  });
}
util.inherits(EqualityFilter, helpers.Filter);


EqualityFilter.prototype.toString = function () {
  return ('(' + helpers.escape(this.attribute) +
          '=' + helpers.escape(this.value) + ')');
};


EqualityFilter.prototype.matches = function (target, strictAttrCase) {
  assert.object(target, 'target');

  var tv = helpers.getAttrValue(target, this.attribute, strictAttrCase);
  var value = this.value;

  return helpers.testValues(function (v) {
    return value === v;
  }, tv);
};


///--- Exports

module.exports = EqualityFilter;
