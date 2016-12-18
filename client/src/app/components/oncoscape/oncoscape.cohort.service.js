(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osCohortService', osCohortService);

    /** @ngInject */
    function osCohortService(osApi, moment, signals, $q, jStat, _, localStorage) {

        // There are three types of cohorts: ALL = All users, SAVED: Saved, UNSAVED

        // Messages
        var onCohortChange = new signals.Signal();
        var onCohortsChange = new signals.Signal();
        var onPatientColorChange = new signals.Signal();

        // Patient Color
        var _patientColor;
        var getPatientColor = function() { return _patientColor; };
        var setPatientColor = function(patientColor) {
            _patientColor = patientColor;
            onPatientColorChange.dispatch(patientColor);
        };

        // State Variables
        var _dataSource = null;
        var _data = null; // This is the clinical and sample to patient mapping data. 
        var _cohorts = null; // Collection of Cohorts
        var _cohort = null;

        // Accessors
        var getCohorts = function() { return _cohorts; };
        var getCohort = function() { return _cohort; };
        var getData = function() { return _data; };

        // Stats Factory
        var statsFactory = (function(jStat) {

            function getSurvivalSort(a, b) {
                // Sort By Time Then Censor (0=dead, 1=alive)
                return (a.time > b.time) ? 1 :
                    (a.time < b.time) ? -1 :
                    (a.censor > b.censor) ? 1 :
                    (a.censor < b.censor) ? -1 :
                    0;
            }

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
                            label: "Tumor",
                            data: getFactorStats(clinical, "status_tumor"),
                            prop: "Status_tumor",
                            type: "factor"
                        }
                    ]
                };
            };

            var createSurvival = function(ids, data) {

                // Transform Ids Into Survival Records + Remove Nulls
                var survival = ids.map(function(v) {
                        var patient = this[v];
                        if (patient === null) return null;
                        return patient.survival;
                    }, data.patientMap)
                    .filter(function(v) { return v !== undefined; })
                    .sort(getSurvivalSort);


                // Add 0,0 Point To Line
                //survival.unshift({ time: 0, censor: 1, pid: "" });

                // Build Object To Hold Stats
                var stat = {
                    total: survival.length,
                    alive: survival.reduce(function(p, c) { return p + c.censor; }, 0),
                    dead: survival.reduce(function(p, c) { return p + Math.abs(c.censor - 1); }, 0),
                    min: survival.reduce(function(p, c) { return Math.min(p, c.time); }, Infinity),
                    max: survival.reduce(function(p, c) { return Math.max(p, c.time); }, -Infinity),
                    data: survival
                };


                var timeMap = stat.data
                    .reduce(function(p, c) {
                        var isDead = (c.censor === 0);
                        if (isDead) p.dead += 1;
                        var time = (p.hasOwnProperty(c.time)) ? p[c.time] : { survivalFrom: p.survival, time: 0, dead: [], alive: [] };
                        time.time = c.time;
                        time.survivalTo = Math.round((1 - (p.dead / p.total)) * 100);
                        time[isDead ? "dead" : "alive"].push(c.pid);
                        p[time.time] = time;
                        p.survival = time.survivalTo;
                        return p;
                    }, { dead: 0, total: stat.total, survival: 100 });

                delete timeMap.survival;
                delete timeMap.total;
                delete timeMap.dead;
                stat.data = Object.keys(timeMap)
                    .map(function(key) { return this[key]; }, timeMap)
                    .reduce(function(p, c) {
                        if (c.dead.length > 0) p.lines.push(c);
                        if (c.alive.length > 0) p.ticks.push(c);
                        return p;
                    }, { ticks: [], lines: [] });


                return stat;
            };

            return {
                createHistogram: createHistogram,
                createSurvival: createSurvival
            };
        })(jStat);

        // Cohort Factory
        var cohortFactory = (function(osApi, statsFactory, data) {

            var _data = null;
            var cohortAll = null;

            // Set Data Create Internal Reference + Also Calc's Cohort All Group
            var setData = function(data) {
                _data = data;
                cohortAll = {
                    color: '#0b97d3',
                    patientIds: [],
                    sampleIds: [],
                    name: 'All Patients + Samples',
                    histogram: statsFactory.createHistogram(Object.keys(data.patientMap), data),
                    survival: statsFactory.createSurvival(Object.keys(data.patientMap), data),
                    show: true,
                    type: 'ALL'
                };
            };

            var createWithSampleIds = function(name, sampleIds, data) {

                if (sampleIds.length === 0) return cohortAll;
                var patientIds = sampleIds
                    .map(function(v) { return this.hasOwnProperty(v) ? this[v] : null; }, data.sampleMap)
                    .filter(function(v) { return (v !== null); }) // Remove Null
                    .filter(function(item, i, ar) { return ar.indexOf(item) === i; }); // Remove Dups

                return create(name, patientIds, sampleIds);
            };

            var createWithPatientIds = function(name, patientIds, data) {

                if (patientIds.length === 0) return cohortAll;
                var sampleIds = [].concat
                    .apply([], patientIds
                        .map(function(v) { return this.hasOwnProperty(v) ? this[v].samples : null; }, data.patientMap))
                    .filter(function(item, i, ar) { return ar.indexOf(item) === i; });

                return create(name, patientIds, sampleIds);
            };

            var create = function(name, patientIds, sampleIds) {
                return {
                    uuid: Math.random().toString().substr(2),
                    color: '#000',
                    patientIds: patientIds,
                    sampleIds: sampleIds,
                    name: name,
                    histogram: statsFactory.createHistogram(patientIds, _data),
                    survival: statsFactory.createSurvival(patientIds, _data),
                    show: true,
                    type: 'UNSAVED'
                };
            };

            return {
                setData: setData,
                createWithSampleIds: createWithSampleIds,
                createWithPatientIds: createWithPatientIds
            };

        })(osApi, statsFactory, _data);
        var colors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70'];
        var setCohort = function(cohort, name, type) {
            // Create Cohort If Array Passed
            if (angular.isArray(cohort)) {
                cohort = cohortFactory[(type == "PATIENT") ? "createWithPatientIds" : "createWithSampleIds"](name, cohort, _data);
                cohort.type = (cohort.patientIds.length === 0) ? "ALL" : "UNSAVED";
                if (cohort.type != "ALL") {
                    var usedColors = _cohorts.map(function(v) { return v.color; });
                    var availColors = colors.filter(function(v) { return (usedColors.indexOf(v) == -1); });
                    cohort.color = availColors[0];
                }
            }
            _cohort = cohort;
            onCohortChange.dispatch(_cohort);
        };

        // Loads Data Nessisary To Map Patients + Samples + Clinical Data To Derive Stats
        var loadData = function() {
            return new Promise(function(resolve) {
                if (_data !== null) resolve(_data);
                _dataSource = osApi.getDataSource();
                $q.all([
                    osApi.query(_dataSource.clinical.samplemap),
                    osApi.query(_dataSource.clinical.patient)
                ]).then(function(responses) {
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
                            return { pid: v.patient_ID, censor: 1, time: time };
                        }
                        if (status == "DEAD") { // Dead = Sensor 1
                            if (!v.hasOwnProperty("days_to_death")) return null;
                            time = parseInt(v.days_to_death);
                            if (time < 0) time = 0;
                            if (isNaN(time)) return null;
                            return { pid: v.patient_ID, censor: 0, time: time };
                        }
                        return null;
                    }).reduce(function(p, c) {
                        if (c !== null) {
                            p[c.pid].survival = c;
                        }
                        return p;
                    }, data.patientMap);
                    cohortFactory.setData(data);
                    _data = data;
                    resolve(_data);
                });
            });
        };

        var loadCohorts = function() {
            return new Promise(function(resolve) {
                loadData().then(function() {

                    // Try + Pull From Local Storage
                    _cohorts = localStorage.getItem(osApi.getDataSource().disease + 'Cohorts');

                    // If Successful Set Selected + Resolve
                    if (_cohorts !== null) {
                        _cohorts = angular.fromJson(_cohorts);
                        _cohort = _cohorts[0];
                    } else {
                        _cohorts = [cohortFactory.createWithPatientIds("ALL", [], _data)];
                        _cohort = _cohorts[0];
                        _cohort.type = "ALL";
                    }

                    onCohortsChange.dispatch(_cohorts);
                    onCohortChange.dispatch(_cohort);
                    resolve(_cohorts);
                });
            });
        };


        var saveCohort = function() {
            _cohort.type = "SAVED";
            _cohorts.push(_cohort);
            localStorage.setItem(osApi.getDataSource().disease + 'Cohorts', angular.toJson(_cohorts));
            // onCohortChange.dispatch(_cohort);

        }
        var deleteCohort = function(cohort) {
            _cohorts.splice(_cohorts.indexOf(cohort), 1);

            localStorage.setItem(osApi.getDataSource().disease + 'Cohorts', angular.toJson(_cohorts));
            setCohort([], "", "PATIENT");
            // If Curretn Cohort == Cohort -- .. 

        }


        var api = {
            ALL: "All Patients",
            SAMPLE: "SAMPLE",
            PATIENT: "PATIENT",

            onPatientColorChange: onPatientColorChange,
            setPatientColor: setPatientColor,
            getPatientColor: getPatientColor,

            onCohortChange: onCohortChange,
            onCohortsChange: onCohortsChange,

            loadCohorts: loadCohorts,
            getData: getData,
            getCohorts: getCohorts,
            getCohort: getCohort,
            setCohort: setCohort,
            saveCohort: saveCohort,
            deleteCohort: deleteCohort
        };

        return api;
    }
})();