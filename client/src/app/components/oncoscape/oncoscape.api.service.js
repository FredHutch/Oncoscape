(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', osApi);

    /** @ngInject */
    function osApi(osHttp, $http, signals, $location, $q, jStat, $, $window, _, moment) {

        // Events
        var onDataSource = new signals.Signal();
        var onResize = new signals.Signal();
        var onNavChange = new signals.Signal();
        var onCohortToolInfo = new signals.Signal();
        var onCohortChange = new signals.Signal();
        var onCohortsChange = new signals.Signal();
        var onGenesetToolInfo = new signals.Signal();
        var onGenesetChange = new signals.Signal();
        var onGenesetsChange = new signals.Signal();
        var onPatientColorChange = new signals.Signal();

        // Resize
        angular.element($window).bind('resize', _.debounce(onResize.dispatch, 900));

        // Layout Metrics
        var getLayout = function() {
            var rt = angular.element(".tray-right").attr("locked");
            if (angular.isUndefined(rt)) rt = "true";
            return {
                left: (angular.element('#collectionpanel-lock').attr("locked") == "true") ? 300 : 0,
                right: (rt === "true") ? 300 : 0
            };
        };
        var setBusy = function(value) {
            if (value) {
                angular.element(".loader-modal").show();
            } else {
                angular.element(".loader-modal").hide();
            }
        };


        // Factories
        var statsFactory = (function(jStat) {

            var km = (function(jStat) {

                var pluck,
                    uniq,
                    sortBy,
                    groupBy,
                    last,
                    find;

                function multiply(a, b) {
                    var r = jStat.multiply(a, b);
                    return r.length ? r : [
                        [r]
                    ];
                }

                function transpose(a) {
                    var r = jStat.transpose(a);
                    return r[0].length ? r : [r];
                }

                function timeTable(tte, ev) {
                    var exits = sortBy(tte.map(function(x, i) { return { tte: x, ev: ev[i] }; }), 'tte'), // sort and collate
                        uexits = uniq(pluck(exits, 'tte'), true), // unique tte
                        gexits = groupBy(exits, function(x) { return x.tte; }); // group by common time of exit
                    return uexits.reduce(function(a, tte) { // compute d_i, n_i for times t_i (including censor times)
                        var group = gexits[tte],
                            l = last(a) || { n: exits.length, e: 0 },
                            events = group.filter(function(x) { return x.ev; });

                        a.push({
                            n: l.n - l.e, // at risk
                            e: group.length, // number exiting
                            d: events.length, // number events (death)
                            t: group[0].tte // time
                        });
                        return a;
                    }, []);
                }

                function compute(tte, ev) {
                    var dini = timeTable(tte, ev);
                    return dini.reduce(function(a, dn) { // survival at each t_i (including censor times)
                        var l = last(a) || { s: 1 };
                        if (dn.d) { // there were events at this t_i
                            a.push({ t: dn.t, e: true, s: l.s * (1 - dn.d / dn.n), n: dn.n, d: dn.d, rate: dn.d / dn.n });
                        } else { // only censors
                            a.push({ t: dn.t, e: false, s: l.s, n: dn.n, d: dn.d, rate: null });
                        }
                        return a;
                    }, []);
                }

                function expectedObservedEventNumber(si, tte, ev) {
                    var data = timeTable(tte, ev),
                        expectedNumber,
                        observedNumber,
                        dataByTimeTable = [];

                    si = si.filter(function(item) { return item.e; });

                    expectedNumber = si.reduce(function(memo, item) {
                        var pointerInData = find(data, function(x) { return (x.t >= item.t); });

                        if (pointerInData) {
                            var expected = pointerInData.n * item.rate;
                            dataByTimeTable.push(pointerInData);
                            return memo + expected;
                        } else {
                            return memo;
                        }

                    }, 0);

                    observedNumber = ev.filter(function(x) { return x; }).length;

                    return {
                        expected: expectedNumber,
                        observed: observedNumber,
                        dataByTimeTable: dataByTimeTable,
                        timeNumber: dataByTimeTable.length
                    };
                }

                function covariance(allGroupsRes, OETable) {
                    var vv = jStat.zeros(OETable.length),
                        i, j, //groups
                        t, //timeIndex
                        N, //total number of samples
                        Ki, Kj, // at risk number from each group
                        n; //total observed

                    for (i = 0; i < OETable.length; i++) {
                        for (j = i; j < OETable.length; j++) {
                            for (t = 0; t < allGroupsRes.length; t++) {
                                N = allGroupsRes[t].n;
                                n = allGroupsRes[t].d;
                                if (t < OETable[i].timeNumber && t < OETable[j].timeNumber) {
                                    Ki = OETable[i].dataByTimeTable[t].n;
                                    Kj = OETable[j].dataByTimeTable[t].n;
                                    // when N==1: only 1 subject, no variance
                                    if (i !== j && N !== 1) {
                                        vv[i][j] -= n * Ki * Kj * (N - n) / (N * N * (N - 1));
                                        vv[j][i] = vv[i][j];
                                    } else if (N !== 1) { // i==j
                                        vv[i][i] += n * Ki * (N - Ki) * (N - n) / (N * N * (N - 1));
                                    }
                                }
                            }
                        }
                    }
                    return vv;
                }

                // This might be the mis-named.
                function solve(a, b) {
                    var bT = transpose(b),
                        aInv = jStat.inv(a);
                    return multiply(multiply(b, aInv), bT);
                }

                function allGroupsKm(groups) {
                    var tte = [].concat.apply([], pluck(groups, 'tte')),
                        ev = [].concat.apply([], pluck(groups, 'ev'));
                    return compute(tte, ev).filter(function(t) { return t.e; });
                }

                // allGroupsRes: km of all groups combined?
                // groupedDataTable: [{tte, ev}, ...]
                function logranktest(groupedDataTable) {
                    var allGroupsRes = allGroupsKm(groupedDataTable),
                        pValue = 1,
                        KMStats,
                        dof, // degree of freedom
                        OETable,
                        OMinusEVector, // O-E
                        vv; //covariant matrix

                    // Table of observed and expected events, for each group.
                    OETable = groupedDataTable
                        .map(function(v) { return expectedObservedEventNumber(allGroupsRes, v.tte, v.ev); })
                        .filter(function(r) { return r.expected; });

                    // Find O-E and covariance, and drop one dimension from each
                    OMinusEVector = OETable.map(function(r) { return r.observed - r.expected; }).slice(1);
                    vv = covariance(allGroupsRes, OETable).slice(1).map(function(r) { return r.slice(1); }); // drop 1st row & 1st column

                    dof = OETable.length - 1;

                    if (dof > 0) {
                        KMStats = solve(vv, [OMinusEVector])[0][0];
                        pValue = 1 - jStat.chisquare.cdf(KMStats, dof);
                    }

                    return {
                        dof: dof,
                        KMStats: KMStats,
                        pValue: pValue
                    };
                }

                var exports = {
                    init: function(obj) {
                        pluck = obj.pluck;
                        uniq = obj.uniq;
                        sortBy = obj.sortBy;
                        groupBy = obj.groupBy;
                        last = obj.last;
                        find = obj.find;
                        return exports; // return the module for convenience of the caller
                    },
                    compute: compute,
                    expectedObservedEventNumber: expectedObservedEventNumber,
                    logranktest: logranktest
                };
                return exports;
            })(jStat).init(_);

            function getNumericStats(patients, attribute) {
                var len = patients.length;
                var bin =
                    (len < 2) ? 1 :
                    (len < 6) ? 2 :
                    (len < 9) ? 3 :
                    (len < 18) ? 6 :
                    (len < 36) ? 8 :
                    10;

                var props = patients.map(function(pd) {
                    return pd[attribute];
                });

                var data = {
                    type: "numeric",
                    min: jStat.min(props),
                    max: jStat.max(props),
                    range: jStat.range(props),
                    sd: jStat.stdev(props),
                    count: 0,
                    hist: jStat.histogram(props, bin),
                    histRange: [],
                    bins: bin
                };

                data.histRange = [jStat.min(data.hist), jStat.max(data.hist)];
                data.count = data.hist.reduce(function(p, c) { p += c; return p; }, 0);

                bin = Math.round(data.range / bin);
                data.hist = data.hist.map(function(pt) {
                    var rv = {
                        label: this.start + "-" + (this.start + this.bin),
                        value: pt
                    };
                    this.start += this.bin;
                    return rv;
                }, {
                    bin: bin,
                    start: data.min
                });
                return data;
            }

            function getFactorStats(patients, attribute) {

                var props = patients.map(function(pd) {
                    return pd[attribute];
                });
                var factors = props
                    .reduce(function(prev, curr) {
                        prev[curr] = (prev.hasOwnProperty(curr)) ? prev[curr] + 1 : 1;
                        return prev;
                    }, {});

                factors = Object.keys(factors).map(function(key) {
                    return {
                        label: key,
                        value: this.factors[key]
                    };
                }, {
                    factors: factors
                });

                var values = factors.map(function(v) {
                    return v.value;
                });
                var data = {
                    type: "factor",
                    min: jStat.min(values),
                    max: jStat.max(values),
                    range: jStat.range(values),
                    sd: jStat.stdev(values),
                    count: 0,
                    hist: factors,
                    histRange: [],
                    bins: factors.length
                };
                data.histRange = [data.min, data.max];
                data.count = data.hist.reduce(function(p, c) { p += c.value; return p; }, 0);
                return data;
            }

            var createHistogram = function(ids, data) {

                // Transform Ids Into Clinical Records + Remove Nulls
                var clinical = ids.map(function(v) {
                    var patient = this[v];
                    if (patient === null) return null;
                    return patient.clinical;
                }, data.patientMap).filter(function(v) { return v != null; })

                return {
                    total: Object.keys(data.patientMap).length,
                    selected: clinical.length,
                    features: [{
                            label: "Age At Diagnosis",
                            data: getNumericStats(clinical, "age_at_diagnosis"),
                            prop: "age_at_diagnosis",
                            type: "numeric"
                        },
                        //{label: "Death", data:getNumericStats(data,"days_to_death"), prop:"days_to_death" , type:"numeric"},
                        {
                            label: "Gender",
                            data: getFactorStats(clinical, "gender"),
                            prop: "gender",
                            type: "factor"
                        }, {
                            label: "Race",
                            data: getFactorStats(clinical, "race"),
                            prop: "race",
                            type: "factor"
                        }, {
                            label: "Ethnicity",
                            data: getFactorStats(clinical, "ethnicity"),
                            prop: "ethnicity",
                            type: "factor"
                        }, {
                            label: "Vital",
                            data: getFactorStats(clinical, "status_vital"),
                            prop: "status_vital",
                            type: "factor"
                        }, {
                            label: "Disease Status",
                            data: getFactorStats(clinical, "last_known_disease_status"),
                            prop: "last_known_disease_status",
                            type: "factor"
                        }
                    ]
                };
            };

            var createSurvival = function(ids, data, cohortAll) {

                // Transform Ids Into Survival Records + Remove Nulls
                var survival = ids.map(function(v) {
                        var patient = this[v];
                        if (patient === null) return null;
                        return patient.survival;
                    }, data.patientMap)
                    .filter(function(v) { return angular.isDefined(v); });

                if (survival.length == 0) return null;

                /*
                Transform Survival Records Into KM Data The Result Is A Value Object Containing The Following
                t = time in days
                c = array of censored patient ids
                d = array of dead patient ids
                n = numer of patients remaining
                s = survival rate
                p = previous survival rate
                */
                var te = survival.reduce(function(p, c) {
                    p.tte.push(c.tte);
                    p.ev.push(c.ev);
                    return p;
                }, { tte: [], ev: [] });

                var compute = km.compute(te.tte, te.ev)
                    .map(function(r) { return _.omit(r, ['rate', 'e', 'n', 'd']); })
                compute.forEach(function(c) {
                    var cd = this.survival.reduce(function(p, c) {
                        if (p.time == c.tte) p[c.ev ? "d" : "c"].push(c.pid);
                        return p;
                    }, { c: [], d: [], time: c.t });
                    c.c = cd.c;
                    c.d = cd.d;
                }, { survival: survival });


                var lrt = (cohortAll === null) ? { "KMStats": "NA", "pValue": "NA", dof: "NA" } :
                    km.logranktest([te, cohortAll.survival.data]);

                var rv = {
                    data: te,
                    compute: compute,
                    logrank: lrt
                };

                var firstEvent = rv.compute[0];
                if (firstEvent.s !== 1 || firstEvent.t !== 0) {
                    rv.compute.unshift({ c: [], d: [], s: 1, t: firstEvent.t });
                    rv.compute.unshift({ c: [], d: [], s: 1, t: 0 });
                }

                return rv;
            };

            return {
                km: km,
                createHistogram: createHistogram,
                createSurvival: createSurvival
            };
        })(jStat);


        // Properties
        var _dataSources; // All Data Sources
        var _dataSource; // Selected Data Source
        var _toolsAll; // List of All Tools
        var _tools; // List of Tools For DataSource
        var _data = null; // This is the clinical and sample to patient mapping data.
        var _hugoMap = null; // Hugo Gene sybol map to alias
        var _cohortAll; // Precalculated Cohort of All Patients / Samples
        var _cohorts = null; // Collection of Cohorts
        var _cohort = null; // Selected Cohorts
        var _genesetAll; // Precalculated Geneset of All Symbols
        var _genesets = null; // Collection of Genesets
        var _geneset = null; // Selected Genesets
        var _patientColor;
        var _cohortToolInfo = { 'numSamples': 500, 'numPatients': 500 };
        var _cohortDatasetInfo = { 'numSamples': 0, 'numPatients': 0 };
        var _genesetToolInfo = { 'numGenes': 0, 'numSymbols': 0 };
     //   var _genesetDatasetInfo = { 'numGenes': 0, 'numSymbols': 0, 'url': '', 'desc':''  };

        var getTools = function() { return _tools; };
        var getCohorts = function() { return _cohorts; };
        var getCohort = function() { return _cohort; };
        var getCohortToolInfo = function() { return _cohortToolInfo; };
        var getCohortDatasetInfo = function() { return _cohortDatasetInfo; };
        var getGenesets = function() { return _genesets; };
        var getGeneset = function() { return _geneset; };
        var getGenesetToolInfo = function() { return _genesetToolInfo; };
    //    var getGenesetDatasetInfo = function() { return _genesetDatasetInfo; };
        var getData = function() { return _data; };
        var getPatientColor = function() { return _patientColor; };
        var getDataSources = function() { return _dataSources; };
        var getDataSource = function() { return _dataSource; };
        var setPatientColor = function(patientColor) {
            _patientColor = patientColor;
            onPatientColorChange.dispatch(patientColor);
        };
        var setCohortToolInfo = function(cohortToolData) {
            _cohortToolInfo = cohortToolData;
            onCohortToolInfo.dispatch(_cohortToolInfo);
        };
        var setGenesetToolInfo = function(genesetToolData) {
            _genesetToolInfo = genesetToolData;
            onGenesetToolInfo.dispatch(_genesetToolInfo);
        };
        var setDataSource = function(value) {

            return new Promise(function(resolveDataSource) {

                // Set Data Source Object Using String or Object
                if (angular.isObject(value)) {
                    if (_dataSource === value) {
                        resolveDataSource();
                        return;
                    }
                    _dataSource = value;
                } else if (angular.isString(value)) {
                    if (_dataSource.dataset === value) {
                        resolveDataSource();
                        return;
                    }
                    _dataSource = _dataSources.filter(function(v) {
                        return v.dataset == this.key;
                    }, {
                        key: value
                    })[0];
                }

                // Update What Tools Are Availible Based On Data Sources
                _tools = _toolsAll.filter(function(item) {
                    return (_dataSource.tools.indexOf(item.route) !== -1);
                }).sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });


                // Load Sample Maps
                Promise.all([query(_dataSource.dataset +"_samplemap"), query(_dataSource.dataset + "_ptdashboard")]).then(function(responses) {
                    var data = {};

                    // Map of Samples To Patients
                    data.sampleMap = responses[0].data[0];

                    // Map of Patients To Samples + Clinical Using Samples Ids
                    data.patientMap = Object.keys(data.sampleMap).reduce(function(p, c) {
                        var patient = data.sampleMap[c];
                        var sample = c;
                        if (p.hasOwnProperty(patient)) {
                            p[patient].samples.push(sample);
                        } else {
                            p[patient] = { samples: [sample] };
                        }
                        return p;
                    }, {});
                    responses[1].data.reduce(function(p, c) {
                        if (p.hasOwnProperty(c.patient_ID)) {
                            p[c.patient_ID].clinical = c;
                        } else {
                            p[c.patient_ID] = { clinical: c, samples: [] };
                        }
                        return p;
                    }, data.patientMap);

                    _cohortDatasetInfo.numSamples = Object.keys(data.sampleMap).length;
                    _cohortDatasetInfo.numPatients = Object.keys(data.patientMap).length;

                    // Survival Data
                    responses[1].data.map(function(v) {

                        // No Status - Exclude
                        if (!v.hasOwnProperty("status_vital")) return null;
                        if (v.status_vital === null) return null;

                        // Get Time - Or Exclude
                        var status = v.status_vital.toString().trim().toUpperCase();
                        var time;
                        if (status == "ALIVE") { // Alive = Sensor 2
                            if (!v.hasOwnProperty("days_to_last_follow_up")) return null;
                            time = parseInt(v.days_to_last_follow_up);
                            if (time < 0) time = 0;
                            if (isNaN(time)) return null;
                            return { pid: v.patient_ID, ev: false, tte: time };
                        }
                        if (status == "DEAD") { // Dead = Sensor 1
                            if (!v.hasOwnProperty("days_to_death")) return null;
                            time = parseInt(v.days_to_death);
                            if (time < 0) time = 0;
                            if (isNaN(time)) return null;
                            return { pid: v.patient_ID, ev: true, tte: time };
                        }
                        return null;
                    }).reduce(function(p, c) {
                        if (c !== null) {
                            p[c.pid].survival = c;
                        }
                        return p;
                    }, data.patientMap);

                    _data = data;
                    _cohortAll = {
                        color: '#039BE5',
                        patientIds: [],
                        sampleIds: [],
                        name: 'All Patients + Samples',
                        histogram: statsFactory.createHistogram(Object.keys(data.patientMap), data),
                        survival: statsFactory.createSurvival(Object.keys(data.patientMap), data, null),
                        numPatients: Object.keys(_data.patientMap).length,
                        numSamples: Object.keys(_data.sampleMap).length,
                        numClinical: Object.keys(_data.patientMap).reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                        show: true,
                        type: 'ALL'
                    };

                    _cohorts = localStorage.getItem(_dataSource.dataset + 'Cohorts');

                    if (_cohorts !== null) {
                        _cohorts = angular.fromJson(_cohorts);
                        setCohort(_cohorts[0]);
                    } else {
                        _cohorts = [_cohortAll];
                        setCohort(_cohortAll);
                    }

                    // Let everyone know what happened
                    onCohortsChange.dispatch(_cohorts);
                    onCohortChange.dispatch(_cohort);
                    onDataSource.dispatch(_dataSource);

                    // Resolve The Promise
                    resolveDataSource();
                });
            });
        };

        var createWithSampleIds = function(name, sampleIds, data) {
            if (sampleIds.length === 0) return _cohortAll;
            var patientIds = sampleIds
                .map(function(v) { return this.hasOwnProperty(v) ? this[v] : null; }, data.sampleMap)
                .filter(function(v) { return (v !== null); }) // Remove Null
                .filter(function(item, i, ar) { return ar.indexOf(item) === i; }); // Remove Dups

            return create(name, patientIds, sampleIds);
        };

        var createWithPatientIds = function(name, patientIds, data) {

            if (patientIds.length === 0) return _cohortAll;
            var sampleIds = [].concat
                .apply([], patientIds
                    .map(function(v) { return this.hasOwnProperty(v) ? this[v].samples : null; }, data.patientMap))
                .filter(function(item, i, ar) { return ar.indexOf(item) === i; });

            return create(name, patientIds, sampleIds);
        };

        var createWithHugoIds = function(name, hugoIds) {

            if (hugoIds.length === 0) return _genesetAll;
            var geneIds = hugoIds;
            var result = {
                symbols: hugoIds,
                genes: geneIds,
                name: name,
                url:"",
                desc:"Created from Geneset Menu"
            };
            return loadGeneset(result);
        };

        var create = function(name, patientIds, sampleIds) {
            var survival = statsFactory.createSurvival(patientIds, _data, _cohortAll);
            var rv = {
                uuid: Math.random().toString().substr(2),
                color: '#000',
                patientIds: patientIds,
                sampleIds: sampleIds,
                name: name,
                histogram: statsFactory.createHistogram(patientIds, _data),
                survival: (survival === null) ? _cohortAll.survival : survival,
                numPatients: patientIds.length,
                numSamples: sampleIds.length,
                numClinical: patientIds.reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                show: true,
                type: 'UNSAVED'
            };
            return rv;
        };

        var loadGeneset = function(result) {
            var rv = {
                uuid: Math.random().toString().substr(2),
                color: '#000',
                hugoIds: result.genes,
                geneIds: result.genes,
                name: result.name,
                url:result.url,
                desc:result.desc,
                show: false,
                disable: false,
                type: result.type
            };
            return rv;
        };

        var setCohort = function(cohort, name, type) {
            // Create Cohort If Array Passed
            if (angular.isArray(cohort)) {
                name += "  (" + moment().format('hh:mm:ss') + ")";
                cohort = (type == "PATIENT") ? createWithPatientIds(name, cohort, _data) : createWithSampleIds(name, cohort, _data);
                cohort.type = (cohort.patientIds.length === 0) ? "ALL" : "UNSAVED";
                if (cohort.type != "ALL") {
                    var usedColors = _cohorts.map(function(v) { return v.color; });
                    var availColors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });
                    cohort.color = availColors[0];
                }
            }
            //if (_cohort === cohort) return;
            _cohort = cohort;
            onCohortChange.dispatch(_cohort);
        };

        var setGeneset = function(geneset, name, type) {
            // Create Cohort If Array Passed
            if (angular.isArray(geneset)) {
                //name += "  (" + moment().format('hh:mm:ss') + ")";
                geneset = (type == "SYMBOL") ? createWithHugoIds(name, geneset, _hugoMap) : createWithHugoIds(name, geneset, _hugoMap);
                geneset.type = (geneset.hugoIds.length === 0) ? "ALL" : "UNSAVED";
                // if (geneset.type != "ALL") {
                //     var usedColors = _genesets.map(function(v) { return v.color; });
                //     var availColors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });
                //     geneset.color = availColors[0];
                // }
            }
            //if (_cohort === cohort) return;
            _geneset = geneset;
            onGenesetChange.dispatch(_geneset);
        };

        var saveCohort = function() {
            _cohort.type = "SAVED";
            _cohorts.push(_cohort);
            localStorage.setItem(_dataSource.dataset + 'Cohorts', angular.toJson(_cohorts));

        };
        var saveGeneset = function() {
            _geneset.type = "SAVED";
            _genesets.push(_geneset);
            localStorage.setItem( 'GeneSets', angular.toJson(_genesets.filter(function(d){return d.type == "SAVED"})));
            onGenesetsChange.dispatch(_genesets);

        };
        var deleteCohort = function(cohort) {
            _cohorts.splice(_cohorts.indexOf(cohort), 1);
            localStorage.setItem(_dataSource.dataset + 'Cohorts', angular.toJson(_cohorts));
            setCohort([], "", "PATIENT");
        };
        var deleteGeneset = function(geneset) {
            _genesets.splice(_genesets.indexOf(geneset), 1);
            localStorage.setItem('GeneSets', angular.toJson(_genesets.filter(function(d){return d.type == "SAVED"})));
            setGeneset([], "", "SYMBOL");
            onGenesetsChange.dispatch(_genesets);
        };
        var toggleGenesetDisable = function(geneset) {
            _genesets[_genesets.indexOf(geneset)].disable = ! _genesets[_genesets.indexOf(geneset)].disable
            onGenesetsChange.dispatch(_genesets);
        };

        // Converts Sample Ids To A List of Sample Ids
        var importIds = function(ids, name) {
            var sampleIds = _.union.apply(null, ids
                .map(function(id) { // Convert All Ids to Patient Ids
                    id = id.toUpperCase().trim(); // Clean input
                    return _data.sampleMap.hasOwnProperty(id) ? _data.sampleMap[id] : id;
                })
                .filter(function(id) { // Remove Invalid Patient Ids
                    return _data.patientMap.hasOwnProperty(id);
                })
                .map(function(id) { // Convert Patient Ids To Sample Arrays
                    return _data.patientMap[id].samples;
                })); // Union Merges Arrays + Removes Dups

            setCohort(sampleIds, name, "SAMPLE");
            saveCohort();
        };

        // Adds gene Ids to geneset and stores in localStorage
        var importGeneIds = function(ids, name) {

            //  var geneIds = _.union.apply(null, ids
            //     .map(function(id) { // Convert All Ids to Patient Ids
            //         id = id.trim(); // Clean input
            //         return _data.hugoMap.hasOwnProperty(id) ? _data.hugoMap[id] : id;
            //     })
            //      .filter(function(id) { // Remove Invalid HUGO Ids
            //          return _hugoMap.hasOwnProperty(id);
            //      })
            //); // Union Merges Arrays + Removes Dups
            var geneIds = ids;

            setGeneset(geneIds, name, "SYMBOL");
            saveGeneset();
        };

        // Initialize (Load Tools Raw Data + DataSources)
        var initialized = false;

        function init() {
            if (initialized) return new Promise(function(resolve) { resolve(_dataSources); });
            initialized = true;
            return Promise.all([
                new Promise(function(resolve, reject) {
                    query("lookup_oncoscape_tools").then(function(response) {
                        _toolsAll = response.data;
                        resolve();
                    }, reject);
                }),
                new Promise(function(resolve, reject) {
                    query("lookup_oncoscape_datasources", {
                        beta: false
                    }).then(function(response) {
                        _dataSource = { dataset: '' };
                        _dataSources = response.data
                            .filter(function(d) {
                                return angular.isDefined(d.img);
                            })
                            .map(function(d) {
                                d.name = d.name.trim();
                                return d;
                            })
                            .sort(function(a, b) {
                                return (a.img < b.img) ? -1 :
                                    (a.img > b.img) ? 1 :
                                    (a.dataset < b.dataset) ? -1 :
                                    (a.dataset > b.dataset) ? 1 :
                                    0;
                            });
                        resolve();
                    }, reject);
                }),
                new Promise(function(resolve, reject) {
                    query("lookup_genesets", {
  //                      $fields: ['name', 'genes']
                    }).then(function(response) {
                        var result = response.data;
                        _genesets = result.map(function(d){
                            d.type = "IMPORT"
                            return loadGeneset(d); });

                        _genesetAll = {
                                color: '#039BE5',
                                hugoIds: [],
                                geneIds: [],
                                name: 'All Genes',
                                url: '',
                                desc: "All available molecular markers will be used in analysis.",
                                // histogram: statsFactory.createHistogram(Object.keys(data.patientMap), data),
                                // survival: statsFactory.createSurvival(Object.keys(data.patientMap), data, null),
                                // numPatients: Object.keys(_data.patientMap).length,
                                // numSamples: Object.keys(_data.sampleMap).length,
                                // numClinical: Object.keys(_data.patientMap).reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                                show: true,
                                disable: false,
                                type: 'ALLGENES'
                        };

                        _genesets.unshift(_genesetAll);
                        _geneset = _genesets[0];

                        var localGenesets = localStorage.getItem('GeneSets');

                        if (localGenesets !== null) {

                            var localGenesetsArray = angular.fromJson(localGenesets)
                            if(localGenesetsArray.length != 0){
                                _genesets.concat(localGenesetsArray);
                //                setGeneset(_genesets[0]);
                            } else {
                  //              setGeneset(_genesetAll);
                            }
                        }

                        onGenesetsChange.dispatch(_genesets);
                        onGenesetChange.dispatch(_geneset);

                            resolve();
                        }, reject);

                    })//,

                // new Promise(function(resolve, reject) {
                //     query("lookup_oncoscape_genes", {
                //     }).then(function(response) {
                //         _hugoMap = response.data

                //     resolve();
                //     }, reject);
                // })
            ]);
        }

        // Query Api
        var queryString = function(table, query) {
            return osHttp.queryString({
                table: table,
                query: query
            });
        };
        var query = function(table, query) {
            return osHttp.query({
                table: table,
                query: query
            });
        };

        return {

            // Constants
            ALL: "All Patients",
            ALLGENES: "All Genes",
            SAMPLE: "SAMPLE",
            PATIENT: "PATIENT",
            SYMBOL: "SYMBOL",

            // Init
            init: init,

            // RPC
            query: query,
            queryString: queryString,

            // Data Sources
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,

            // Patient Colors
            setPatientColor: setPatientColor,
            getPatientColor: getPatientColor,

            // Tools + Layouts
            getTools: getTools,
            getLayout: getLayout,

            // Cohort Tool Info
            setCohortToolInfo: setCohortToolInfo,
            getCohortToolInfo: getCohortToolInfo,
            getCohortDatasetInfo: getCohortDatasetInfo,


            // Cohort Management
            getCohorts: getCohorts,
            getCohort: getCohort,
            setCohort: setCohort,
            saveCohort: saveCohort,
            deleteCohort: deleteCohort,
            importIds: importIds,
            importGeneIds: importGeneIds,

            // Geneset Tool Info
            setGenesetToolInfo: setGenesetToolInfo,
            getGenesetToolInfo: getGenesetToolInfo,
            //getGenesetDatasetInfo: getGenesetDatasetInfo,


            // Geneset Management
            getGenesets: getGenesets,
            getGeneset: getGeneset,
            setGeneset: setGeneset,
            saveGeneset: saveGeneset,
            deleteGeneset: deleteGeneset,
            toggleGenesetDisable: toggleGenesetDisable,

            // Signals
            onPatientColorChange: onPatientColorChange,
            onCohortToolInfo: onCohortToolInfo,
            onGenesetToolInfo: onGenesetToolInfo,
            onNavChange: onNavChange,
            onDataSource: onDataSource,
            onResize: onResize,
            onCohortChange: onCohortChange,
            onCohortsChange: onCohortsChange,
            onGenesetChange: onGenesetChange,
            onGenesetsChange: onGenesetsChange,

            // Random
            setBusy: setBusy,
            km: statsFactory.km,

            getData: getData

        };
    }
})();
