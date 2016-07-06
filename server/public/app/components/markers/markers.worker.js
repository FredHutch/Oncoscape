
// State
var state = {
	options: {
		patients:{
			data: "",
			layout: ""
		},
		edges:{
			layout: ""
		},
		genes:{
			layout: ""
		}

	},
	patientData: [],
	patientColors: [],
	genes: [],
	patients: [],
	edges: []
};


// Load Data
var data = (function(){

	var clean = function(state){
		// Remove Edges That Don't Have Patients || Genes Assiciated
		console.log("EDGES PRE CLEAN: "+state.edges.length);
		state.edges = state.edges
			.filter(function(item){  // Remove Edges w/ Invalid Gene
				for (var i=0;i<this.length; i++){ if (item.data.source==this[i].data.id) return true; }
				return false;
			}, state.genes)
			.filter(function(item){  // Remove Edges w/ Invalid Gene
				for (var i=0;i<this.length; i++){ if (item.data.target==this[i].data.id) return true; }
				return false;
			}, state.patients);
		console.log("EDGES POST CLEAN: "+state.edges.length);			
	};

	var formatPatientLayout = function(data){
		if (state.patients.length==0) return;
		if (data.length==1){
			send("patients_layout",data[0].data);
		};
	};

	var formatPatientColor = function(data){
		var degMap = {};
		var legend = [];
		if (data.length==1){
			data[0].data.forEach(function(color){
				var colorName  = color.name;
				var colorValue = color.color;
				legend.push({name:colorName, color:colorValue});
				color.values.forEach(function(patient){
					this.degmap[patient+"-01"] = {'color':this.color}
				}, {degmap:this, color:colorValue});
			}, degMap);
			send("patients_legend", legend);
			send("patients_update",degMap);
		}else{
			if (state.patients.length>0){
				state.patients.forEach(function(f){ this[f.data.id]= {'color':'#1396DE'} }, degMap)
				
				send("patients_update",degMap);
				send("patients_legend", [{name:'Patient', color:'#1396DE'}]);
			}
		}
	};


	var formatPatientData = function(data){
		return data;
	};

	var formatGeneNodes = function(data){

		var data = data[0].data;
		return Object.keys(data)
			.filter(function(key){
				// Remove Genes That Are Not Positioned On Chromosome
				var value = this[key];
				return (value.x!=0 & value.y!=0)
			},data)
			.map(function(key){
				return {
                    group: "nodes",
                    grabbable: false,
                    locked: true,
                    selectable: true,
                    position: this[key],
                    data: {
                        color: "rgb(0, 255, 255)",
                        id: key,
                        display: "element",
                        nodeType: "gene",
                        degree: 1,
                        sizeBdr: 50,
                        sizeEle: 50,
                        sizeLbl: 50,
                        subType: "unassigned"
                    }
            	};
			},data)
	};

	var formatEdgeNodes = function(data){
		return data.map(function(item) {
        	return edge = {
	            group: "edges",
	            grabbable: false,
	            locked: true,
	            data: {
	                color: "#FF0000",
	                id: "mp_" + item.g + "_" + item.p +"_"+item.m,
	                display: "element",
	                edgeType: "cn",
	                sizeEle: 50,
	                cn: parseInt(item.m),
	                source: item.g,
	                target: item.p
	            }
	        };
	    });
	};

	var formatPatientNodes = function(data){

	 	var data = data[0].data;
	 	send("patients_legend", [{name:'Patient', color:'#1396DE'}]);
		return Object.keys(data)
			.map(function(key){ 
				var value = this[key];
				var data = {
	                color: "#1396DE",
	                id: key,
	                display: "element",
	                nodeType: "patient",
	                degree: 1,
	                sizeBdr: 50,
	                sizeEle: 50,
	                sizeLbl: 50,
	                subType: "unassigned",
				};
				var node = {
	                group: "nodes",
	                grabbable: true,
	                locked: false,
	                selectable: true,
	                position: value,
	                data: data
				};
				node.position.x -= 40000;
				return node;
			}, data);


	
	};


	// Load Data Function (URL, CallBack)
	var load = function(t, e) {
	    function a() {
	        n.readyState < 4 || 200 === n.status && 4 === n.readyState && e(n)
	    }
	    var n;
	    if ("undefined" != typeof XMLHttpRequest) n = new XMLHttpRequest;
	    else
	        for (var X = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"], M = 0, o = X.length; o > M; M++) try {
	            n = new ActiveXObject(X[M]);
	            break
	        } catch (p) {}
	    n.onreadystatechange = a, n.open("GET", t, !0), n.send("")
	};

	var request = function(object, data, format){
		return new Promise(function(resolve, reject) {
			if (data!=null) { resolve(data); return; }
	    	var query = "http://localhost:80/api/" + object.table;
	    	if (object.query) query += "/?q=" + encodeURIComponent(JSON.stringify(object.query));
	    	console.log(query);
	    	load(query, function(response){
	    		resolve(format(JSON.parse(response.responseText)));
	    	});
	    });
	};

	var update = function(options, state){
		return new Promise(function(resolve, reject) {

			// What Changed?
			var update = {
				patientData: (state.options.patients.data!=options.patients.data),
				patientColor: (state.options.patients.color!=options.patients.color),
				patientLayout: (state.options.patients.layout!=options.patients.layout),
				edges: (state.options.edges.layout.name!=options.edges.layout.name),
				genes: (state.options.genes.layout!=options.genes.layout)
			};
			
			// Nothing? Return
			if (!update.patientData && !update.patientColor && !update.patientLayout && !update.patients && !update.edges && !update.genes){
				resolve({state:state, update:update});
				return;
			}
			
			// Fetch New Stuff
			var promises = [

				request( { table: options.patients.data },
					!update.patientData ? state.patientData : null, formatPatientData ),

				request( { table: 'render_patient', query: { name:options.patients.layout } },
					!update.patientData ? state.patients : null, formatPatientNodes ),

				request( { table: 'render_patient', query: { name:options.patients.layout } },
					!update.patientLayout ? state.patients : null, formatPatientLayout ),



				request( { table: 'render_patient', query:{  name:options.patients.color } },
					!update.patientColor ? state.patientColor : null, formatPatientColor ),
				
				
				request( { table: 'render_chromosome', query: { name: options.genes.layout } },
				 	!update.genes ? state.genes : null, formatGeneNodes ),

				request( { table: options.edges.layout.edges},		
					!update.edges ? state.edges : null, formatEdgeNodes )
			];

			Promise.all(promises).then(function(data){

				state.patientData = data[0];
				state.patients = data[1];
				state.patientLayout = data[2];
				state.patientColor = data[3];
				state.genes = data[4];
				state.edges = data[5];
				state.options = options;
				if (update.edges) clean(state);
				resolve({state:state, update:update});
			});
		});
	};
	return { update: update };
})();

// Send Command
var send = function(cmd, data) {
    self.postMessage({
        cmd: cmd,
        data: data
    });
}


var filter = (function(){
    	var filterEdgesByPatients = function(options, edges){
    		if (options.patients.selected.length>0){
    			return edges.filter(function(edge){
    					var id = edge.data.target;
    					for (var i=0; i<this.length; i++){
    						if (this[i]==id) return true;
    					}
    					return false;
    			},options.patients.selected);
    		}
    		return edges;
    	};

    	var filterEdgesByGenes = function(options, edges){
    		if (options.genes.selected.length>0){
    			return edges.filter(function(edge){
    					var id = edge.data.source;
    					for (var i=0; i<this.length; i++){
    						if (this[i]==id) return true;
    					}
    					return false;
    			},options.genes.selected);
    		}
    		return edges;
    	};

    	var filterEdgesByColor = function(options, edges){
    		return edges.filter(function(edge){
    			for (var i=0; i<this.length; i++){
    				if (edge.data.cn==this[i].id){
    					edge.data.color = this[i].color;
    					return true;
    				}
    			}
    			return false;
    		}, options.edges.colors);
    	};
    	return {
    		edges:{
    			byColor:filterEdgesByColor,
    			byGenes:filterEdgesByGenes,
    			byPatients:filterEdgesByPatients
    		}
    	}
})();


// Data Load Commands
var process = function(options, run){
	
	data.update(options, state).then(function(response){
		var state = response.state;
		var update = response.update;
		_options = options;
		switch(run){
			case "sequential":
				if (update.genes){
					send("genes_delete");
					send("genes_insert", state.genes);
				}
                if (update.patientData){
                	send("patients_delete");
                	send("patients_insert", state.patients);
                }
                if (update.edges){
                	send("edges_delete");
                }
				break;
			case "sequential-showselectededges":
				var edges = state.edges;
				edges = filter.edges.byPatients(options, edges);
				edges = filter.edges.byGenes(options, edges);
				var ids = edges.map( function(edge){ return edge.data.id } );
				send("edges_delete", ids);
				edges = filter.edges.byColor(options, edges);
				console.log("EDGES Displayed: "+edges.length);			
				send("edges_insert", edges);
				break;
			case "adhoc":
				var edges = state.edges;
				edges = filter.edges.byColor(options, edges);
				edges = filter.edges.byPatients(options, edges);
				edges = filter.edges.byGenes(options, edges);
				send("edges_insert", edges);
				break;
			case "set":
				var edges = state.edges;
				edges = filter.edges.byColor(options, edges);
				edges = filter.edges.byPatients(options, edges);
				edges = filter.edges.byGenes(options, edges);
				send("edges_insert", edges);
				break;
		}
	});
}

// Recieve Command
self.addEventListener('message', function(msg) {
    msg = msg.data;
    switch (msg.cmd) {
        case "setOptions":
        	var run = msg.data.mode.toLowerCase().replace(" ","") + ( (msg.data.cmd.length>0) ? "-"+msg.data.cmd.toLowerCase() : "" )
        	process(msg.data, run);
            break;
    }
}, false);