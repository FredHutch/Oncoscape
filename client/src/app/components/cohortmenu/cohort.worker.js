var send = function(cmd, data) {
    self.postMessage( { cmd: cmd, data: data } );
};

var geneSets = [{
	id: 0,
	ids: [], 
	tool: 'Application', 
	desc: 'Load',
	date: new Date()
}];

var patientSets = [{
	id: 0,
	ids: [], 
	tool: 'Application', 
	desc: 'Load',
	date: new Date()
}];


function setDataset(){

}
function setGeneset(){

}

function getGenes(id){
	sendGenes(id);
}
function sendGenes(id){
	var genes = geneSets[id];
	send("loadGenes", genes);
}

function getPatients(id){
	sendPatients(id)
}
function sendPatients(id){
	var patients = patientSets[id];
	send("loadPatients", patients);
}

self.addEventListener('message', function(msg) {
    // msg = msg.data;
    // switch (msg.cmd) {
    //     case "setOptions":
    //         var run = msg.data.mode.toLowerCase().replace(" ", "") + ((msg.data.cmd.length > 0) ? "-" + msg.data.cmd.toLowerCase() : "")
    //         process(msg.data, run);
    //         break;
    // }
}, false);
