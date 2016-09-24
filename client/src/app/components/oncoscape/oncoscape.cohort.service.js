(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osCohortService', osCohortService);

    /** @ngInject */
    function osCohortService(osApi, moment, signals) {

        var onMessage = new signals.Signal();
        var onPatientsSelect = new signals.Signal();
        var onGenesSelect = new signals.Signal();
        var onCohortsChange = new signals.Signal();
        var onPatientColorChange = new signals.Signal();

        var worker = new Worker("app/components/oncoscape/oncoscape.cohort.service.worker.js");
        worker.addEventListener('message', function(msg) {
            if (msg.data.cmd == "filterPatients") {
                setPatientCohort(msg.data.data, "Filter")
            } else {
                onMessage.dispatch(msg);
            }
        }, false);

        var allGeneCohorts = [],
            activePatientCohort,
            activeGeneCohort;

        var allPatientCohorts = [];
        var colors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70'];
        osApi.onDataSource.add(function(datasource) {

            worker.postMessage({
                cmd: "setPatientDataSource",
                data: datasource.clinical.patient
            });

            allPatientCohorts = localStorage.getItem(osApi.getDataSource().disease + "PatientCohorts");
            allPatientCohorts = (allPatientCohorts == null) ? [] : JSON.parse(allPatientCohorts);
            for (var i = 0; i < allPatientCohorts.length; i++) {
                allPatientCohorts[i].color = colors[i];
            }
            onCohortsChange.dispatch(allPatientCohorts);
        });

        var _patientColor = {
            name: 'xxx',
            data: [{
                name: 'Patient',
                color: '#1396DE',
                show: true
            }]
        };

        var getPatientColor = function() {
            return _patientColor;
        }

        var setPatientColor = function(val) {
            _patientColor = val;
            onPatientColorChange.dispatch(_patientColor);
        }

        var getSurvivalData = function(cohorts, all, correlationId) {
            worker.postMessage({
                cmd: "getSurvivalData",
                data: {
                    cohorts: cohorts,
                    all: all,
                    correlationId: correlationId
                }
            });
        };

        var getPatientMetric = function() {
            if (!activePatientCohort.ids) return;
            worker.postMessage({
                cmd: "getPatientMetric",
                data: activePatientCohort.ids
            });
        };

        var getPatientCohorts = function() {
            return allPatientCohorts;
        };
        var getPatientCohort = function() {
            return activePatientCohort;
        };
        var addPatientCohort = function(disease) {
            if (allPatientCohorts.indexOf(activePatientCohort) != -1) return;
            activePatientCohort.color = colors[allPatientCohorts.length];
            allPatientCohorts.push(activePatientCohort);
            localStorage.setItem(osApi.getDataSource().disease + "PatientCohorts", JSON.stringify(allPatientCohorts));
        };

        var delPatientCohort = function(obj) {
            allPatientCohorts.splice(allPatientCohorts.indexOf(obj), 1);
            localStorage.setItem(osApi.getDataSource().disease + "PatientCohorts", JSON.stringify(allPatientCohorts));
        };

        var setPatientCohort = function(ids, name) {
            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
            activePatientCohort = (!angular.isArray(ids)) ? ids : {
                id: (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase(),
                ids: ids,
                name: name,
                time: new Date()
            };
            onPatientsSelect.dispatch(activePatientCohort);
        };
        var filterActivePatientCohort = function(bounds, prop, type) {
            worker.postMessage({
                cmd: "filterPatients",
                data: {
                    ids: activePatientCohort.ids,
                    type: type,
                    bounds: bounds,
                    prop: prop,
                }
            });
        }

        var getGeneMetric = function() {};
        var getGeneCohorts = function() {
            return allGeneCohorts;
        };
        var getGeneCohort = function() {
            return activeGeneCohort;
        };
        var addGeneCohort = function() {
            allGeneCohorts.push(activeGeneCohort);
        };
        var delGeneCohort = function(obj) {
            allGeneCohorts.splice(allGeneCohorts.indexOf(obj), 1);
        };
        var setGeneCohort = function(ids, name) {
            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
            activeGeneCohort = (!Array.isArray(ids)) ? ids : {
                id: (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase(),
                ids: ids,
                name: name,
                time: new Date()
            };
            onGenesSelect.dispatch(activeGeneCohort);
        };

        var api = {
            onMessage: onMessage,
            onPatientsSelect: onPatientsSelect,
            onCohortsChange: onCohortsChange,
            onPatientColorChange: onPatientColorChange,
            getPatientCohorts: getPatientCohorts,
            getPatientCohort: getPatientCohort,
            setPatientCohort: setPatientCohort,
            addPatientCohort: addPatientCohort,
            delPatientCohort: delPatientCohort,
            getPatientMetric: getPatientMetric,
            onGenesSelect: onGenesSelect,
            getGeneCohorts: getGeneCohorts,
            getGeneCohort: getGeneCohort,
            setGeneCohort: setGeneCohort,
            addGeneCohort: addGeneCohort,
            delGeneCohort: delGeneCohort,
            getGeneMetric: getGeneMetric,
            getSurvivalData: getSurvivalData,
            setPatientColor: setPatientColor,
            filterActivePatientCohort: filterActivePatientCohort
        };

        return api;
    }
})();
