// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function ExtensibleFilter(options) {
  if (typeof (options) === 'object') {
    assert.optionalString(options.rule, 'options.rule');
    assert.optionalString(options.matchType, 'options.matchType');
    assert.optionalString(options.attribute, 'options.attribute');
    assert.optionalString(options.value, 'options.value');
  } else {
    options = {};
  }

  if (options.matchType !== undefined) {
    this.matchType = options.matchType;
  } else {
    this.matchType = options.attribute;
  }
  this.dnAttributes = options.dnAttributes || false;
  this.rule = options.rule;
  this.value = (options.value !== undefined) ? options.value : '';

  var self = this;
  this.__defineGetter__('type', function () { return 'ext'; });
  this.__defineGetter__('json', function () {
    return {
      type: 'ExtensibleMatch',
      matchRule: self.rule,
      matchType: self.matchType,
      matchValue: self.value,
      dnAttributes: self.dnAttributes
    };
  });
  this.__defineGetter__('matchingRule', function () {
    return self.rule;
  });
  this.__defineGetter__('matchValue', function () {
    return self.value;
  });
  this.__defineGetter__('attribute', function () {
    return this.matchType;
  });
  this.__defineSetter__('attribute', function (value) {
    this.matchType = value;
  });

}
util.inherits(ExtensibleFilter, helpers.Filter);


ExtensibleFilter.prototype.toString = function () {
  var str = '(';

  if (this.matchType)
    str += this.matchType;

  str += ':';

  if (this.dnAttributes)
    str += 'dn:';

  if (this.rule)
    str += this.rule + ':';

  return (str + '=' + this.value + ')');
};


ExtensibleFilter.prototype.matches = function () {
  // Consumers must implement this themselves
  throw new Error('ext match implementation missing');
};


///--- Exports

module.exports = ExtensibleFilter;
