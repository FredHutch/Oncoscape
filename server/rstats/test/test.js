'use strict';

var rstats = require("../lib/index.js");
var chai = require("chai");
var expect = chai.expect;

describe("rstats", function(){
  it("exports a function called session", function tests() {
    expect(rstats.session).to.be.a("function");
  });
});

describe("session", function(){

  it("exports the functions parseEval, parseEvalQ, parseEvalQNT, assign and get", function tests() {
    var R = new rstats.session();

    expect(R).to.have.property('parseEval').that.is.a('function');
    expect(R).to.have.property('parseEvalQ').that.is.a('function');
    expect(R).to.have.property('parseEvalQNT').that.is.a('function');
    expect(R).to.have.property('assign').that.is.a('function');
    expect(R).to.have.property('get').that.is.a('function');

  });

});
