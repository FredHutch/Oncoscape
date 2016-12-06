(function () {
  'use strict';

  angular
    .module('oncoscape')
    .service('osCohortService', osCohortService);

  /** @ngInject */
  function osCohortService(osApi, moment, signals, $q, localStorage) {

    // Messages
    var onCohortChange = new signals.Signal();
    var onCohortsChange = new signals.Signal();
    var onPatientColorChange = new signals.Signal();

    // Cohorts
    var _cohorts = [];
    var getCohorts = function () {
      return _cohorts;
    };

    // Cohort
    var _cohort = null;
    var saveCohort = function () {
      _cohorts.push(getCohort());
      onCohortsChange.dispatch(getCohorts());
      // Save To Local Storage
    }
    var deleteCohort = function (cohort) {
      _cohorts = _cohorts.splice(_cohorts.indexOf(cohort), 1);
      onCohortsChange.dispatch(getCohorts());
      // Save To Local Storage
    }
    var getCohort = function () {
      return _cohort;
    }
    var setCohort = function (ids, name, type) {
      _cohort = cohortFactory[(type == "PATIENT") ? "createWithPatientIds" : "createWithSampleIds"](name, ids);
      onCohortChange.dispatch(getCohort());
    }



    // Stats Factory
    var statsFactory = (function () {
      var createHistogram = function (cohort) {
        return {};
      };
      var createSurvival = function (cohort) {
        return {};
      };
      return {
        createHistogram: createHistogram,
        createSurvival: createSurvival
      };
    })();



    // Cohort Factory
    var cohortFactory = (function (osApi, statsFactory, onCohortsChange, onCohortChange) {

      // Patient + Sample Data
      var data = {
        patient: [],
        patientMap: {},
        sampleMap: {}
      }

      // Monitor Data Source
      osApi.onDataSource.add(function (d) {
        $q.all([
          osApi.query(d.clinical.samplemap),
          osApi.query(d.clinical.patient)
        ]).then(function (responses) {
          data.patient = responses[1].data;
          data.sampleMap = responses[0].data[0];
          data.patientMap = Object.keys(data.sampleMap).reduce(function (p, c) {
            var patient = data.sampleMap[c];
            var sample = c;
            if (p.hasOwnProperty(patient)) p[patient].push(sample);
            else p[patient] = [sample];
            return p;
          }, {});

          // Load Cohorts
          var cohorts = [];
          onCohortsChange.dispatch(cohorts);
          onCohortChange.dispatch(cohorts[0]);
        });
      });

      var createWithSampleIds = function (name, sampleIds) {
          debugger;
        var patientIds = [];
        return create(name, patientIds, sampleIds);
      };

      var createWithPatientIds = function (name, patientIds) {
          
        var ids = patientIds.reduce(function(p,c){
            var samples = p.map[c];
            if (samples==null){
                p.e.push(c);
            }else{
                p.p.push(c);
                p.s.concat(samples);
            }
            return p;
        }, {p:[],s:[], e:[], map:data.patientMap} );

        debugger;
        return create(name, ids.p, ids.s, ids.e);

      };

      var create = function (name, patientIds, sampleIds, errorIds) {

        var cohort = {
          name: name,
          patientIds: patientIds,
          sampleIds: sampleIds,
          errorIds: errorIds,
          stats: {}
        };

        cohort.stats.survival = statsFactory.createSurvival(cohort);
        cohort.stats.histogram = statsFactory.createHistogram(cohort);

        return cohort;
      }


      return {
        createWithSampleIds: createWithSampleIds,
        createWithPatientIds: createWithPatientIds
      };


    })(osApi, statsFactory, onCohortsChange, onCohortChange);




    var api = {
      SAMPLE: "SAMPLE",
      PATIENT: "PATIENT",

      onPatientColorChange: onPatientColorChange,
      onCohortChange: onCohortChange,
      onCohortsChange: onCohortsChange,

      setCohort: setCohort,
      getCohort: getCohort,
      getCohorts: getCohorts,
      saveCohort: saveCohort,
      deleteCohort: deleteCohort
    };

    return api;
  }
})();
