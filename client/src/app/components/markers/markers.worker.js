    // Load Data Function (URL, CallBack)
    var load = function(t, e) {
        function a() {
            n.readyState < 4 || 200 === n.status && 4 === n.readyState && e(n)
        }
        var n;
        if ("undefined" != typeof XMLHttpRequest) n = new XMLHttpRequest;
        else
            for (var X = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"], M = 0, o = X.length; o > M; M++) 
            try {
                n = new ActiveXObject(X[M]);
            } catch (e) {}
        n.onreadystatechange = a, n.open("GET", t, !0), n.setRequestHeader('apikey','password'), n.send("")
    };

    var request = function(object, data, format) {
        return new Promise(function(resolve) {
            if (data != null) {
                resolve(data);
                return;
            }
            var query = "http://dev.oncoscape.sttrcancer.io/api/" + object.table;
            //var query = "/api/" + object.table;
            if (object.query) query += "/" + encodeURIComponent(JSON.stringify(object.query));
            load(query, function(response) {
                resolve(format(JSON.parse(response.responseText)));
            });
        });
    };


var state = {
    options: {
        patients: {
            data: "",
            layout: ""
        },
        edges: {
            layout: ""
        },
        genes: {
            layout: ""
        }
    },
    patientData: [],
    genes: [],
    patients: [],
    edges: [],
    edgePatients: [],
    edgeGenes: [],
    degrees: null
};

// Load Data
var data = (function() {

    var getRangeFn = function(data) {
        var range = data
            .map(function(p) {
                return parseInt(p[Object.keys(p)[0]]);
            });

        var min = Math.min.apply(null, range);
        var max = Math.max.apply(null, range)
        return function(value, low, high) {
            value = parseInt(value);
            return Math.round(((value - min) / (max - min)) * (high - low) + low);
        }
    };

    var clean = function(state) {
        // Remove Edges That Don't Have Patients || Genes Assiciated
        //		console.log("EDGES PRE CLEAN: "+state.edges.length);
        state.edges = state.edges
            .filter(function(item) { // Remove Edges w/ Invalid Gene
                for (var i = 0; i < this.length; i++) {
                    if (item.data.source == this[i].data.id) return true;
                }
                return false;
            }, state.genes)
            .filter(function(item) { // Remove Edges w/ Invalid Gene
                for (var i = 0; i < this.length; i++) {
                    if (item.data.target == this[i].data.id) return true;
                }
                return false;
            }, state.patients);
        //		console.log("EDGES POST CLEAN: "+state.edges.length);


        // Size Nodes :: Eliminate Duplicate Functions
        var rFn = getRangeFn(state.edgePatients);
        var patientEdgeDegrees = state.edgePatients
            .map(function(obj) {
                var key = Object.keys(obj)[0];
                var val = this.fn(obj[key], 400, 1200);
                return {
                    'id': key,
                    'val': val
                };
            }, {
                fn: rFn
            })
            .reduce(function(previousValue, currentValue) {
                previousValue[currentValue.id] = {
                    'weight': currentValue.val
                };
                return previousValue;
            }, {});


        rFn = getRangeFn(state.edgeGenes);
        var geneEdgeDegrees = state.edgeGenes
            .map(function(obj) {
                var key = Object.keys(obj)[0];
                var val = this.fn(obj[key], 50, 1500);
                return {
                    'id': key,
                    'val': val
                };
            }, {
                fn: rFn
            })
            .reduce(function(previousValue, currentValue) {
                previousValue[currentValue.id] = {
                    'weight': currentValue.val
                };
                return previousValue;
            }, {});


        return {
            patientEdgeDegrees: patientEdgeDegrees,
            geneEdgeDegrees: geneEdgeDegrees
        };

    };

    var formatPatientLayout = function(data) {
        if (state.patients.length == 0) return;
        if (data.length == 1) {

            var annotations = data[0].annotation;
            if (annotations){


                var text = annotations
                    .filter(function(item){ return item.type=="text"; })
                    .map(function(item){
                        return {
                            group: "nodes",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            position: {x:item.x-4000, y:item.y},
                            'text-rotation': item.rotation,
                            data: {
                                id: "annotation"+item.text.replace(/[^\w\s!?]/g,''),
                                color: "rgb(0, 255, 255)",
                                display: "element",
                                nodeType: "annotation-text",
                                sizeEle: 800,
                                weight: 800,
                                sizeLbl: 500,
                                degree: 1,
                                sizeBdr: 50,
                                'text-rotation': item.rotation,
                                label: item.text + " (" + item.dataValue + ")"
                            }
                        }
                    });


                var lines = annotations
                    .filter(function(item){ return item.type=="line"})
                    .map(function(line){

                        var id = "annotation-"+Math.random().toString().substring(2);
                        
                        var elements = [];
                        for (var i=0; i<line.points.length; i++){

                            var item = line.points[i];
                            
                            elements.push({

                                group: "nodes",
                                grabbable: false,
                                locked: true,
                                position: {x:item.x-4000, y:item.y},
                                selectable: false,
                                data:{
                                    display: "element",
                                    id: id + i.toString(),
                                    nodeType: "annotation-point",
                                    sizeEle: 100,
                                    sizeBdr: 1,
                                    sizeLbl: 0
                                }
                            });
                            if (i>0){
                                elements.push({
                                    
                                    group: "edges",
                                    grabbable: false,
                                    locked: true,
                                    position: line.points[i],
                                    selectable: false,
                                    data: {
                                        display: "element",
                                        id: id,
                                        nodeType: "annotation-line",
                                        source: id + i.toString(),
                                        target: id + (i-1).toString(),
                                        sizeEle: 50,
                                        sizeBdr: 1,
                                        sizeLbl: 0,
                                        'color': "#000000"
                                    }
                                })
                            }
                        }
                        return elements;

                    });



                data[0].annotation = text.concat( [].concat.apply( [], lines ) );
                
            }
            
            send("patients_layout", data[0]);
        }
    };

    var formatEdgePatients = function(data) {
        return data;
    };
    var formatEdgeGenes = function(data) {
        return data;
    };
    var formatPatientData = function(data) {
        return data;
    };

    var formatGeneNodes = function(data) {
        data = data[0].data;
        return Object.keys(data)
            .filter(function(key) {
                // Remove Genes That Are Not Positioned On Chromosome
                var value = this[key];
                return (value.x != 0 & value.y != 0)
            }, data)
            .map(function(key) {
                return {
                    group: "nodes",
                    grabbable: false,
                    locked: true,
                    selectable: true,
                    position: this[key],
                    data: {
                        sizeBdr: 1,
                        colorBdr: '#FFF',
                        color: "#0096d5",
                        id: key,
                        display: "element",
                        nodeType: "gene",
                        degree: 1,
                        sizeEle: 200,
                        weight: 200,
                        sizeLbl: 10,
                        subType: "unassigned"
                    }
                };
            }, data)
    };

    var formatEdgeNodes = function(data) {
        return data.map(function(item) {
            return {
                group: "edges",
                grabbable: false,
                locked: true,
                data: {
                    color: "#FF0000",
                    id: "mp_" + item.g + "_" + item.p + "_" + item.m,
                    display: "element",
                    edgeType: "cn",
                    sizeEle: 1,
                    sizeBdr: 0,
                    cn: parseInt(item.m),
                    source: item.g,
                    target: item.p
                }
            };
        });
    };

    var formatPatientNodes = function(data) {

        data = data[0].data;
        return Object.keys(data)
            .map(function(key) {
                var value = this[key];
                var data = {
                    color: "#1396DE",
                    id: key,
                    display: "element",
                    nodeType: "patient",
                    degree: 1,
                    sizeBdr: 30,
                    sizeEle: 800,
                    weight: 800,
                    sizeLbl: 50,
                    subType: "unassigned"
                };
                var node = {
                    group: "nodes",
                    grabbable: true,
                    locked: false,
                    selectable: true,
                    position: value,
                    data: data
                };
                node.position.x -= 4000;
                return node;
            }, data);
    };

    var update = function(options, state) {

        return new Promise(function(resolve) {

            // What Changed?
            var update = {
                patientData: (state.options.patients.data != options.patients.data),
                patientLayout: (state.options.patients.layout != options.patients.layout),
                edges: (state.options.edges.layout.name != options.edges.layout.name),
                genes: (state.options.genes.layout != options.genes.layout)
            };



            // Nothing? Return
            if (!update.patientData && !update.patientLayout && !update.patients && !update.edges && !update.genes) {
                resolve({
                    state: state,
                    update: update
                });
                return;
            }


            // Fetch New Stuff
            var promises = [

                request({
                    table: options.patients.data,
                    query:{
                        $fields: ['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'status_vital']
                    }
                }, !update.patientData ? state.patientData : null, formatPatientData),

                request({
                    table: 'render_patient',
                    query: {
                        dataset: options.dataset,
                        name: options.patients.layout
                        //type: 'Cluster'
                    }
                }, !update.patientData ? state.patients : null, formatPatientNodes),

                request({
                    table: 'render_patient',
                    query: {
                        dataset: options.dataset,
                        name: options.patients.layout
                        //type: 'Cluster'
                    }
                }, !update.patientLayout ? state.patients : null, formatPatientLayout),

                request({
                    table: 'render_chromosome',
                    query: {
                        name: options.genes.layout
                    }
                }, !update.genes ? state.genes : null, formatGeneNodes),

                request({
                    table: options.edges.layout.edges
                }, !update.edges ? state.edges : null, formatEdgeNodes),

                request({
                    table: options.edges.geneWeights
                }, !update.edges ? state.edgeGenes : null, formatEdgeGenes),

                request({
                    table: options.edges.patientWeights
                }, !update.edges ? state.edgePatients : null, formatEdgePatients)

            ];

            Promise.all(promises).then(function(data) {

                // Reorient patient data to use PIDs as keys
                if (update.patientData) {
                    var patientInfo = data[0].reduce(function(prev, curr) {

                        // Generate Html Representation of Data					
                        prev.data[curr.patient_ID] = curr;
                        prev.html[curr.patient_ID] = Object.keys(curr).sort()
                            .reduce(function(prev, curr) {
                                if (curr != "patient_ID") {
                                    prev.html += "<li class='markers-legend'><span class='markers-legend-key'>" + curr.replace(/_/g, " ") + ":</span>"+ prev.obj[curr] + "</li>";
                                }
                                return prev;
                            }, {
                                obj: curr,
                                html: ""
                            }).html;
                        return prev;

                    }, {
                        data: {},
                        html: {}
                    });
                    send("patients_html", patientInfo.html)
                    state.patientData = patientInfo.data;
                    state.patients = data[1];
                }

                state.patientLayout = data[2];
                state.genes = data[3];
                state.edges = data[4];
                state.edgeGenes = data[5];
                state.edgePatients = data[6];
                state.options = options;
                state.degrees = (update.edges || update.genes) ? clean(state) : null;
                resolve({
                    state: state,
                    update: update
                });
            });
        });
    };
    return {
        update: update
    };
})();

// Send Command
var send = function(cmd, data) {
    self.postMessage({
        cmd: cmd,
        data: data
    });
}


var filter = (function() {
    var filterEdgesByPatients = function(options, edges) {
        if (options.patients.selected.length > 0) {
            return edges.filter(function(edge) {
                var id = edge.data.target;
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == id) return true;
                }
                return false;
            }, options.patients.selected);
        }
        return edges;
    };

    var filterEdgesByGenes = function(options, edges) {
        if (options.genes.selected.length > 0) {
            return edges.filter(function(edge) {
                var id = edge.data.source;
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == id) return true;
                }
                return false;
            }, options.genes.selected);
        }
        return edges;
    };

    var filterEdgesByColor = function(options, edges) {
        return edges.filter(function(edge) {
            for (var i = 0; i < this.length; i++) {
                if (edge.data.cn == this[i].id) {
                    edge.data.color = this[i].color;
                    return true;
                }
            }
            return false;
        }, options.edges.colors);
    };

    return {
        edges: {
            byColor: filterEdgesByColor,
            byGenes: filterEdgesByGenes,
            byPatients: filterEdgesByPatients
        }
    }
})();


// Data Load Commands
var process = function(options, run) {
    var getEdgeCounts = function(edges) {
        var rv = {
            "cnG1": 0,
            "cnG2": 0,
            "cnL1": 0,
            "cnL2": 0,
            "m": 0,
            "total": 0
        };
        edges.forEach(function(edge) {
            switch (edge.data.cn) {
                case -2:
                    rv.cnL2 += 1;
                    break;
                case -1:
                    rv.cnL1 += 1;
                    break;
                case 0:
                    rv.m += 1;
                    break;
                case 1:
                    rv.cnG1 += 1;
                    break;
                case 2:
                    rv.cnG2 += 1;
                    break;
            }
            rv.total += 1;
        }, rv);
        return rv;
    };
    data.update(options, state).then(function(response) {
        var state = response.state;
        var update = response.update;
        var counts = "";
        _options = options;
        switch (run) {
            case "sequential":
                if (update.genes) {
                    send("genes_delete");
                    send("genes_insert", {
                        genes: state.genes,
                        degrees: state.degrees.geneEdgeDegrees
                    });
                }
                if (update.patientData) {
                    send("patients_delete");
                    send("patients_insert", {
                        patients: state.patients,
                        degrees: state.degrees.patientEdgeDegrees
                    });
                }
                if (update.edges) {
                    send("edges_delete");
                }
                break;
            case "sequential-showselectededges":
                var edges = state.edges;
                edges = filter.edges.byPatients(options, edges);
                edges = filter.edges.byGenes(options, edges);
                var ids = edges.map(function(edge) {
                    return edge.data.id
                });
                send("edges_delete", ids);
                edges = filter.edges.byColor(options, edges);
                counts = getEdgeCounts(edges);

                send("edges_insert", {
                    edges: edges,
                    counts: counts
                });
                break;
            case "adhoc":
                var edges = state.edges;
                edges = filter.edges.byColor(options, edges);
                edges = filter.edges.byPatients(options, edges);
                edges = filter.edges.byGenes(options, edges);
                counts = getEdgeCounts(edges);
                send("edges_insert", {
                    edges: edges,
                    counts: counts
                });
                break;
            case "set":
                var edges = state.edges;
                edges = filter.edges.byColor(options, edges);
                edges = filter.edges.byPatients(options, edges);
                edges = filter.edges.byGenes(options, edges);
                counts = getEdgeCounts(edges);
                send("edges_insert", {
                    edges: edges,
                    counts: counts
                });
                break;
        }
    });
}

// Recieve Command
self.addEventListener('message', function(msg) {
    
    msg = msg.data;
    switch (msg.cmd) {
        case "setOptions":
            var run = msg.data.mode.toLowerCase().replace(" ", "") + ((msg.data.cmd.length > 0) ? "-" + msg.data.cmd.toLowerCase() : "")
            process(msg.data, run);
            break;
    }
}, false);
