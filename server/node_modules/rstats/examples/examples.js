var R = require('../build/Release/R');
var util = require('util');
var h = new R.session();

h.parseEvalQ("cat('\n Hello World \n')");

h.assign('X', 2483);

h.parseEvalQ('print(X)');

h.assign('Y',{firstName:"John", lastName:"Doe", age:50, eyeColor:"blue"});

h.parseEvalQ('print(paste(Y$firstName, Y$lastName,sep=" "))');

var res = h.get('Y');

h.parseEvalQ('mat = matrix(1:4,ncol=2,nrow=2)');
h.parseEvalQ('vec = c(3,2,4.2)');
res2 = h.get('vec');

h.parseEvalQ('x = rnorm(100); y = 4*x + rnorm(100); lm_fit = lm(y~x);');
var lm_fit = h.get('lm_fit');
var coefs = lm_fit.coefficients;
var residuals = lm_fit.residuals;

console.log( util.inspect( residuals ) );

try{
  h.get("Z");
} catch(e){
  console.log(e);
}

try{
  h.parseEvalQ("ARGH");
} catch(e) {
	console.log(e);
}

h.parseEvalQ("print(2+3)");


// test for RJSONIO toJSON precision issue
h.parseEvalQ("json = toJSON(1234687.796545568, digits=Inf)");
json  = h.get('json');
json = JSON.parse(json);
console.log(json);
