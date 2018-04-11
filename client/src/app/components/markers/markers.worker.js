/* jshint ignore:start */
/* global ActiveXObject:false, JSON:false  */
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
    n.onreadystatechange = a, n.open("GET", t, !0), n.setRequestHeader('apikey', 'password'), n.send("")
};

var request = function(object, data, format) {
    return new Promise(function(resolve) {
        if (data != null) {
            resolve(data);
            return;
        }
        //var query = "/api/" + object.table;
        query = "https://dev.oncoscape.sttrcancer.io/api/" + object.table;
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




    function convertRange(value, r1, r2) {
        return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
    }

    var clean = function(state) {

        // Remove Edges That Don't Have Patients || Genes Assiciated
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

        // Size Nodes :: Eliminate Duplicate Functions
        var domain = Object.keys(state.edgePatients).reduce(function(p, c) {
            var v = state.edgePatients[c];
            p[0] = Math.min(p[0], v);
            p[1] = Math.max(p[0], v);
            return p;
        }, [Infinity, -Infinity]);

        var patientEdgeDegrees = Object.keys(state.edgePatients)
            .map(function(key) {
                var val = convertRange(state.edgePatients[key], domain, [20, 150]);
                return {
                    'id': key,
                    'val': state.edgePatients[key]
                };
            })
            .reduce(function(previousValue, currentValue) {
                previousValue[currentValue.id] = {
                    'weight': currentValue.val
                };
                return previousValue;
            }, {});


        domain = Object.keys(state.edgeGenes).reduce(function(p, c) {
            var v = state.edgeGenes[c];
            p[0] = Math.min(p[0], v);
            p[1] = Math.max(p[0], v);
            return p;
        }, [Infinity, -Infinity]);

        var geneEdgeDegrees = Object.keys(state.edgeGenes)
            .map(function(key) {
                var val = convertRange(state.edgeGenes[key], domain, [20, 150]);
                return {
                    'id': key,
                    'val': val
                };
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

        // if (state.patients.length == 0) return data;
        // if (data.length == 1) {

        // var annotations = data[0].annotation;
        // if (annotations) {

        //     var text = annotations
        //         .filter(function(item) { return item.type == "text"; })
        //         .map(function(item) {
        //             return {
        //                 group: "nodes",
        //                 grabbable: false,
        //                 locked: true,
        //                 selectable: false,
        //                 position: { x: item.x - 4600, y: item.y },
        //                 'text-rotation': item.rotation,
        //                 data: {
        //                     id: "annotation" + item.text.replace(/[^\w\s!?]/g, ''),
        //                     color: "rgb(0, 255, 255)",
        //                     display: "element",
        //                     nodeType: "annotation-text",
        //                     sizeEle: 800,
        //                     weight: 800,
        //                     sizeLbl: 500,
        //                     degree: 1,
        //                     sizeBdr: 50,
        //                     'text-rotation': item.rotation,
        //                     label: item.text + " (" + item.dataValue + ")"
        //                 }
        //             }
        //         });


        //     var lines = annotations
        //         .filter(function(item) { return item.type == "line" })
        //         .map(function(line) {

        //             var id = "annotation-" + Math.random().toString().substring(2);

        //             var elements = [];
        //             for (var i = 0; i < line.points.length; i++) {

        //                 var item = line.points[i];

        //                 elements.push({

        //                     group: "nodes",
        //                     grabbable: false,
        //                     locked: true,
        //                     position: { x: item.x - 4000, y: item.y },
        //                     selectable: false,
        //                     data: {
        //                         display: "element",
        //                         id: id + i.toString(),
        //                         nodeType: "annotation-point",
        //                         sizeEle: 100,
        //                         sizeBdr: 1,
        //                         sizeLbl: 0
        //                     }
        //                 });
        //                 if (i > 0) {
        //                     elements.push({
        //                         group: "edges",
        //                         grabbable: false,
        //                         locked: true,
        //                         position: line.points[i],
        //                         selectable: false,
        //                         data: {
        //                             display: "element",
        //                             id: id,
        //                             nodeType: "annotation-line",
        //                             source: id + i.toString(),
        //                             target: id + (i - 1).toString(),
        //                             sizeEle: 50,
        //                             sizeBdr: 1,
        //                             sizeLbl: 0,
        //                             'color': "#000000"
        //                         }
        //                     })
        //                 }
        //             }
        //             return elements;

        //         });
        //     data[0].annotation = text.concat([].concat.apply([], lines));
        // }


        var rv = data[0].scores.reduce(function(p, c) {
            p[c.id] = { x: c.d[0] - 4000, y: c.d[1] };
            return p;
        }, {});
        send("patients_layout", rv);

    };

    var formatEdgePatients = function(data) {
        return data[0].d.reduce(function(p, c) { p[c.p] = c.w; return p; }, {});
    };
    var formatEdgeGenes = function(data) {
        return data[0].d.reduce(function(p, c) { p[c.g] = c.w; return p; }, {});
    };
    var formatPatientData = function(data) {
        return data;
    };

    var formatGeneNodes = function(data) {
        data = data[0].data;
        return Object.keys(data)
            .map(function(key) {
                return {
                    group: "nodes",
                    grabbable: true,
                    locked: false,
                    selectable: true,
                    position: this[key],
                    data: {
                        sizeBdr: 1,
                        colorBdr: '#FFF',
                        color: "#039BE5",
                        id: key,
                        display: "element",
                        nodeType: "gene",
                        degree: 1,
                        sizeEle: 200,
                        weight: 200,
                        sizeLbl: 10,
                        subType: "unassigned",
                        position: {}
                    }
                };
            }, data)
    };

    var createEdgeNode = function(g, p, m) {
        return {
            group: "edges",
            grabbable: false,
            locked: true,
            data: {
                color: "#FF0000",
                id: "mp_" + g + "_" + p + "_" + m,
                display: "element",
                edgeType: "cn",
                sizeEle: 1,
                sizeBdr: 0,
                cn: parseInt(m),
                source: g,
                target: p
            }
        };
    }
    var mutationMap = {
        "deletion": -2,
        "loss": -1,
        "mutation": 0,
        "gain": 1,
        "amplification": 2
    }
    var formatEdgeNodes = function(data) {
        return [].concat.apply(this, data.map(function(alteration) {
            return alteration.d.map(function(edge) {
                return createEdgeNode(edge.g, edge.p, mutationMap[alteration.alteration]);
            });
        }));
    };

    var formatPatientNodes = function(data) {
        var rv = data[0].scores.map(function(v) {
            var position = { x: v.d[0] - 4000, y: v.d[1] };
            var data = {
                color: "#039BE5",
                id: v.id,
                display: "element",
                nodeType: "patient",
                degree: 1,
                sizeBdr: 30,
                sizeEle: 800,
                weight: 800,
                sizeLbl: 50,
                subType: "unassigned",
                position: { x: position.x, y: position.y }
            };
            var node = {
                group: "nodes",
                grabbable: true,
                locked: false,
                selectable: true,
                position: position,
                data: data
            };
            return node;
        });

        return rv;
    };

    var distributePoints = function(pts, spread) {


        // Pt Objects
        var ptObjs = pts.sort(function(a, b) { return a - b; }).map(function(c, i) {
            return {
                o: c, // Original value
                v: c, // Currenct Value
                s: 1, // State [0=confirmed, 1=unconfirmed]
                i: i, // Index
                ip: (i + 1 === pts.length) ? null : i + 1, // Index Plus 1 or Null 
                im: (i === 0) ? null : i - 1 // Index Minus 1 or Null
            };
        });

        var unconfirmed = true;
        while (unconfirmed) {

            // Get unconfirmed
            var unconfirmedPts = ptObjs.filter(function(p) { return p.s && p.ip !== null && p.im !== null; });
            if (unconfirmedPts.length === 0) {
                unconfirmed = false;
                break;
            }
            var center = unconfirmedPts[0],
                left = ptObjs[center.im],
                right = ptObjs[center.ip],
                c2l = Math.abs(center.v - left.v),
                c2r = Math.abs(right.v - center.v);

            if (c2l < spread) {
                left.v -= spread - c2l;
                left.s = 1;
            }
            if (c2r < spread) {
                right.v += spread - c2r;
                right.s = 1;
            }
            center.s = 0;
        }
        return ptObjs.map(function(v) { return { o: v.o, v: v.v }; })
    }


    var update = function(options, state) {

        return new Promise(function(resolve) {

            // What Changed?
            var update = {
                patientData: (state.options.patients.data != options.patients.data),
                patientLayout: (state.options.patients.layout.name != options.patients.layout.name),
                edges: (state.options.edges.layout.geneset != options.edges.layout.geneset),
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
                    query: {
                        $fields: ['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'status_vital']
                    }
                }, !update.patientData ? state.patientData : null, formatPatientData),

                request({
                    table: options.dataset + "_cluster",
                    query: {
                        source: options.patients.layout.source,
                        geneset: options.patients.layout.geneset,
                        dataType: options.patients.layout.dataType,
                        input: options.patients.layout.input
                    }
                }, !update.patientData ? state.patients : null, formatPatientNodes),

                request({
                    table: options.dataset + "_cluster",
                    query: {
                        source: options.patients.layout.source,
                        geneset: options.patients.layout.geneset,
                        dataType: options.patients.layout.dataType,
                        input: options.patients.layout.input
                    }
                }, !update.patientLayout ? state.patients : null, formatPatientLayout),

                request({
                    table: 'hg19_geneset',
                    query: {
                        name: options.genes.layout
                    }
                }, !update.genes ? state.genes : null, formatGeneNodes),

                request({
                    table: options.dataset + "_network",
                    query: {
                        geneset: options.genes.layout,
                        dataType: 'edges',
                        default: true
                    }
                }, !update.genes ? state.edges : null, formatEdgeNodes),

                request({
                    table: options.dataset + "_network",
                    query: {
                        geneset: options.genes.layout,
                        dataType: 'genedegree',
                        default: true
                    }
                }, !update.genes ? state.edgeGenes : null, formatEdgeGenes),

                request({
                    table: options.dataset + "_network",
                    query: {
                        geneset: options.genes.layout,
                        dataType: 'ptdegree',
                        default: true
                    }
                }, !update.genes ? state.edgePatients : null, formatEdgePatients)
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
                                    prev.html += "<li class='markers-legend'><span class='markers-legend-key'>" + curr.replace(/_/g, " ") + ":</span>" + prev.obj[curr] + "</li>";
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

                var g = data[3].sort(function(a, b) {
                    var rv = (a.position.x - b.position.x);
                    return (rv == 0) ? (a.position.y - b.position.y) : rv;
                });


                g.forEach(function(c) {
                    var jitter = 10 * (this.isPositive ? -1 : 1);
                    if (c.position.x != this.xPos) {
                        this.chromosome += 1;
                        this.xPos = c.position.x;
                    }
                    c.position.x += jitter;
                    c.position.jitter = jitter;
                    c.data.position.x = c.position.x;
                    c.data.position.y = c.position.y;
                    c.position.jitter = c.position.jitter;

                    c.data.halign = (jitter < 0) ? "left" : "right";
                    c.data.padding = (jitter < 0) ? "-5" : "5";
                    c.data.chrome = this.chromosome;
                    this.isPositive = !this.isPositive;
                }, { isPositive: false, chromosome: 0, xPos: 0 });


                for (var i = 1; i < 24; i++) {
                    var dist, pts = g.reduce(function(p, c) {
                        if (c.data.chrome === i) {
                            p[c.data.halign].push(c);
                        }
                        return p;
                    }, { left: [], right: [] });

                    dist = distributePoints(pts.left.map(function(v) { return v.position.y; }), 30).map(function(v) { return v.v; });
                    pts.left.forEach(function(c, i) { c.position.y = dist[i]; });

                    dist = distributePoints(pts.right.map(function(v) { return v.position.y; }), 30).map(function(v) { return v.v; });
                    pts.right.forEach(function(c, i) { c.position.y = dist[i]; });
                }


                state.genes = g;
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
        var edges;
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
                edges = state.edges;
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
                edges = state.edges;
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
                edges = state.edges;
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