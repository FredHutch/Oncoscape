/*
*   Oncoscape R Process
*
*   This simple process utilizes RInside and RStats to marshall requests from the socket into the 
*	existing R Libraries.
*	Today the currancy of these transactions is the Chinook Messaging structure
*
*/
var rstats  = require('./rstats/build/Release/R.node');
// node-gyp configure build https://github.com/ijsf/node-Rstats/tree/0918c18a9b6a865aced557ce2d9c1d26ea155126
var r = new rstats.session();
r.parseEvalQ("library('OncoDev15')");
r.parseEvalQ("o15 <- OncoDev15('DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAlusc;TCGAluad;TCGAlung;TCGAhnsc;TCGAcoadread')");
process.on('message', function(message) {
	process.send(
		r.parseEval("exeCmd(o15, '"+message+"')")
	);
 });
process.on('exit', function(code,signal) {
	console.warn('child is exiting with code: '+ code +' and signal: '+signal)
});
