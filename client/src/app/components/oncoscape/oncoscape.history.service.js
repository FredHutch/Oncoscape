(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osHistory', osHistory);

    /** @ngInject */
    function osHistory(moment, signals, osSound) {

        

        var _historyMax = 50;
        var _geneSelections = [{ids:[], tool:'', desc:''}];
        var _geneIndex = 0;
        var _patientSelections = [{ids:[], tool:'', desc:''}];
        var _patientIndex = 0;
        var _onPatientSelectionChange = new signals.Signal();
        var _onGeneSelectionChange = new signals.Signal();
       
        /* Gene */
        var getGeneSelections = function(){
            return _geneSelections;
        };
        var getGeneSelection = function(){
            if (_geneIndex<0) _geneIndex = 0;
            if (_geneIndex>=_geneSelections.length) _geneIndex = _geneSelections.length-1;
            return _geneSelections[_geneIndex];
        };
        var addGeneSelection = function(tool, desc, ids){
            ids = ids.sort();
            if (_.difference(ids, getGeneSelection().ids).length==0) return;
            var m = moment();
            _geneSelections.push({tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")});
            _geneIndex += _geneSelections.length-1;
        }
        var getGeneSelectionLast = function(){
            _geneIndex -= 1;
            if (_geneIndex<0) { _geneIndex = 0; return; }
            var selection = getGeneSelection();
            _onGeneSelectionChange.dispatch(selection);
            return selection;
        }
        var getGeneSelectionNext = function(){
            _geneIndex += 1;
            if (_geneIndex==_geneSelections.length) { _geneIndex = _geneSelections.length-1; return; }
            var selection = getGeneSelection();
            _onGeneSelectionChange.dispatch(selection);
            return selection;
        }

        /* Patient */
        var getPatientSelections = function(){
            return _patientSelections;
        };
        var getPatientSelection = function(){
            if (_patientIndex<0) _patientIndex = 0;
            if (_patientIndex>=_patientSelections.length) _patientIndex = _patientSelections.length-1;
            return _patientSelections[_patientIndex];
        };
        var addPatientSelection = function(tool, desc, ids){
            ids = ids.sort();
            if (_.difference(ids, getPatientSelection().ids).length==0) return;
            var m = moment();
            _patientSelections.push({tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")});
            _patientIndex = _patientSelections.length-1;
        };
        var getPatientSelectionLast = function(){
            _patientIndex -= 1;
            if (_patientIndex<0) { _patientIndex = 0; return; }
            var selection = getPatientSelection();
            _onPatientSelectionChange.dispatch(selection);
            return selection;
        };
        var getPatientSelectionNext = function(){
            _patientIndex += 1;
            if (_patientIndex==_patientSelections.length) { _patientIndex = _patientSelections.length-1; return; }
            var selection = getPatientSelection();
            _onPatientSelectionChange.dispatch(selection);
            return selection;
        };

        // Keypress
        angular.element(document).keypress(function(e) {
            var selection;
            if (!e.ctrlKey) return;
            switch (e.keyCode)
            {
                case 11: getGeneSelectionLast(); break;
                case 12: getGeneSelectionNext(); break;
                case 46: getPatientSelectionNext(); break;
                case 44: getPatientSelectionLast(); break;
            }
        });

        var removeListeners = function(){
          
        };
        var clear = function(){
            _geneSelections = [];
            _geneSelection = null;
            _patientSelections = [];
            _patientSelection = null;
        }


        var api = {
            
            onPatientSelectionChange: _onPatientSelectionChange,
            onGeneSelectionChange: _onGeneSelectionChange,

            addGeneSelection: addGeneSelection,
            getGeneSelection: getGeneSelection,
            getGeneSelections: getGeneSelections,

            addPatientSelection: addPatientSelection,
            getPatientSelection: getPatientSelection,
            getPatientSelections: getPatientSelections,

            removeListeners: removeListeners,
            clear: clear
        };

        return api;
    }
})();