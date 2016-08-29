// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.

var util = require('util');

var assert = require('assert-plus');

var helpers = require('./helpers');


///--- API

function PresenceFilter(options) {
  if (typeof (options) === 'object') {
    assert.string(options.attribute, 'options.attribute');
    this.attribute = options.attribute;
  }


  var self = this;
  this.__defineGetter__('type', function () { return 'present'; });
  this.__defineGetter__('json', function () {
    return {
      type: 'PresenceMatch',
      attribute: self.attribute
    };
  });
}
util.inherits(PresenceFilter, helpers.Filter);


PresenceFilter.prototype.toString = function () {
  return '(' + helpers.escape(this.attribute) + '=*)';
};


PresenceFilter.prototype.matches = function (target, strictAttrCase) {
  assert.object(target, 'target');

  var value = helpers.getAttrValue(target, this.attribute, strictAttrCase);

  return (value !== undefined && value !== null);
};


///--- Exports

module.exports = PresenceFilter;
