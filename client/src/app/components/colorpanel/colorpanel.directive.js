(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osColorPanel', colorPanel);

    /** @ngInject */
    function colorPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/colorpanel/colorpanel.html',
            controller: ColorPanelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                close: "&"
            }
        };

        return directive;

        /** @ngInject */
        function ColorPanelController(osApi, osCohortService, d3) {

            // Properties
            var vm = this;
            vm.showPanelColorRna = false;

            var tbl = osApi.getDataSource().category.filter(function(v) {
                return v.type == 'color';
            })[0].collection;

            osApi.query(tbl, {
                type: 'color',
                dataset: osApi.getDataSource().disease,
                $fields: ['name', 'subtype']
            }).then(function(v) {

                var data = v.data.reduce(function(p, c) {
                    if (!p.hasOwnProperty(c.subtype)) p[c.subtype] = [];
                    p[c.subtype].push(c);
                    return p;
                }, {});

                vm.optPatientColors = Object.keys(data).map(function(key) {
                    return {
                        name: key,
                        values: this[key].sort(function(a, b) {
                            if (a.name > b.name) return 1;
                            if (a.name < b.name) return -1;
                            return 0;
                        })
                    };
                }, data);

            });

            vm.setColor = function(item) {

                if (item.name == "None") {
                    osCohortService.setPatientColor({
                        "dataset": osApi.getDataSource().disease,
                        "type": "color",
                        "name": "None",
                        "data": [],
                        show: true
                    })
                    return;
                }

                osApi.query(tbl, {
                    type: 'color',
                    dataset: osApi.getDataSource().disease,
                    name: item.name
                }).then(function(v) {
                    var data = v.data[0];
                    data.data = data.data.map(function(v) {
                        var name = v.name.toLowerCase().trim();
                        if (name == "" || name == "null" || name == "undefined") {
                            v.name = "Null";
                            v.color = "#DDDDDD";
                        }
                        v.id = "legend-" + v.color.substr(1);
                        return v;
                    }).sort(function(a, b) {
                        var aname = (isNaN(a.name)) ? a.name : parseInt(a.name);
                        var bname = (isNaN(b.name)) ? b.name : parseInt(b.name);
                        if (aname < bname) return -1;
                        if (aname > bname) return 1;
                        if (a.name == "Null") return 1;
                        if (b.name == "Null") return -1;
                        return 0;
                    })

                    // debugger;
                    osCohortService.setPatientColor(v.data[0]);
                    vm.close();
                });
            };

            vm.setGeneColor = function() {
                var genes = ("+" + vm.geneColor.replace(/\s/g, '').toUpperCase()).match(/[-+]\w*/gi).map(function(v) {
                    return {
                        op: v.substr(0, 1),
                        gene: v.substr(1)
                    };
                });
                osApi.query(osApi.getDataSource().rna, {
                    gene: {
                        '$in': genes.map(function(v) {
                            return v.gene;
                        })
                    }
                }).then(function(results) {
                    if (results.data.length > 0) {
                        var data;
                        if (results.data.length == 1)
                            data = results.data[0];
                        else {
                            data = {};
                            data.patients = results.data.reduce(function(p, c) {
                                var fn = p.lookup[c.gene];
                                for (var i = 0; i < p.pids.length; i++) {
                                    var pid = p.pids[i];
                                    var iv = p.output.hasOwnProperty(pid) ? p.output[pid] : 0;
                                    if (fn === "+") p.output[pid] = iv + c.patients[pid];
                                    if (fn === "-") p.output[pid] = iv - c.patients[pid];
                                }
                                return p;
                            }, {
                                pids: Object.keys(results.data[0].patients),
                                lookup: genes.reduce(function(p, c) {
                                    p[c.gene] = c.op;
                                    return p;
                                }, {}),
                                output: {}
                            }).output;

                            var range = Object.keys(data.patients).reduce(function(p, c) {
                                p.min = Math.min(p.min, p.values[c]);
                                p.max = Math.max(p.min, p.values[c]);
                                return p;
                            }, {
                                values: data.patients,
                                min: Infinity,
                                max: -Infinity
                            });
                            data.min = range.min;
                            data.max = range.max;
                        }

                        // Color Patients

                        var values = [{
                            name: 'Q1',
                            color: "#6a32b3"
                        }, {
                            name: 'Q2',
                            color: "#cd2c8e"
                        }, {
                            name: 'Q3',
                            color: "#e85434"
                        }, {
                            name: 'Q4',
                            color: "#a9a10a"
                        }];

                        var scale = d3.scaleQuantize()
                            .domain([data.min, data.max])
                            .range(values.map(function(f) {
                                return f.color;
                            }));

                        data = Object.keys(data.patients).map(function(id) {
                                return {
                                    id: id,
                                    color: this.scale(this.patients[id])
                                };
                            }, {
                                patients: data.patients,
                                scale: scale
                            })
                            .reduce(function(p, c) {
                                if (!p.hasOwnProperty(c.color)) p[c.color] = [];
                                p[c.color].push(c.id);
                                return p;
                            }, {});

                        data = Object.keys(data).map(function(key) {
                            return {
                                color: key,
                                name: this.names.filter(function(f) {
                                    return f.color == this.color
                                }, {
                                    color: key
                                })[0].name,
                                values: this.data[key]
                            };
                        }, {
                            data: data,
                            names: values
                        })

                        data = data.sort(function(a, b) {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                        });
                        data.push({
                            color: '#DDD',
                            name: 'Null',
                            values: []
                        })

                        var colors = {
                            dataset: osApi.getDataSource().disease,
                            type: 'color',
                            name: genes.reduce(function(p, c) {
                                p += c.op + c.gene + " ";
                                return p;
                            }, ""),
                            data: data
                        };
                        osCohortService.setPatientColor(colors);
                    }

                });

            }
        }
    }
})();
