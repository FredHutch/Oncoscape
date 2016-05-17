(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osHistory', osHistory);

    /** @ngInject */
    function osHistory(moment, signals, osSound) {

        

        var _historyMax = 50;
        var _geneSelections = [];
        var _geneSelection = null;
        var _patientSelections = [];
        var _patientSelection = null;
        var _onPatientSelectionChange = new signals.Signal();
        var _onGeneSelectionChange = new signals.Signal();

        var clear = function(){
            _geneSelections = [];
            _geneSelection = null;
            _patientSelections = [];
            _patientSelection = null;
        }
       
       /* Gene */
        var getGeneSelections = function(){
            return _geneSelections;
        };
        var addGeneSelection = function(tool, desc, ids){
            var m = moment();
            var selection = {tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")};
            _geneSelection = selection;
            _geneSelections.unshift(selection);
            if (_geneSelections.length>_historyMax) _geneSelections.pop()
        };
        var setGeneSelection = function(selection){
            _geneSelection = selection;
            _onGeneSelectionChange.dispatch(selection);
        };
        var getGeneSelection = function(){
            return _geneSelection;
        };
        var getGeneSelectionLast = function(){
            var i = _geneSelections.indexOf(_geneSelection) - 1;
            if (i<0){
                osSound.beep();
                return null;
            } 
            _geneSelection = _geneSelections[i];
            return _geneSelection;
        };
        var getGeneSelectionNext = function(){
            var i = _geneSelections.indexOf(_geneSelection) + 1;
            if (i>=_geneSelections.length){
                osSound.beep();
                return null;
            } 
            _geneSelection = _geneSelections[i];
            return _geneSelection;
        };


        /* Patients */
        var getPatientSelections = function(){
            return _patientSelections;
        };
        var addPatientSelection = function(tool, desc, ids){
            var m = moment();
            var selection = {tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")};
            _patientSelection = selection;
            _patientSelections.unshift(selection);
            if (_patientSelections.length>_historyMax) _patientSelections.pop()
        };
        var setPatientSelection = function(selection){
            _patientSelection = selection;
            _onPatientSelectionChange.dispatch(selection);
        };
        var getPatientSelection = function(){
            return _patientSelection;
        };
        var getPatientSelectionLast = function(){
            var i = _patientSelections.indexOf(_patientSelection) - 1;
            if (i<0){
                osSound.beep();
                return null;
            } 
            _patientSelection = _patientSelections[i];
            return _patientSelection;
        };
        var getPatientSelectionSecondLast = function(){
            var i = _patientSelections.indexOf(_patientSelection) - 2;
            if (i<1){
                osSound.beep();
                return null;
            } 
            _patientSelection = _patientSelections[i];
            return _patientSelection;
        };
        var getPatientSelectionNext = function(){
            var i = _patientSelections.indexOf(_patientSelection) + 1;
            if (i>=_patientSelections.length){
                osSound.beep();
                return null;
            } 
            _patientSelection = _patientSelections[i];
            return _patientSelection;
        };

        angular.element(document).keypress(function(e) {
            var selection;
            if (!e.ctrlKey) return;
            switch (e.keyCode)
            {
                case 11:
                    selection = getGeneSelectionLast();
                    if (selection!=null) _onGeneSelectionChange.dispatch(selection);
                    break;
                case 12:
                    selection = getGeneSelectionNext();
                    if (selection!=null) _onGeneSelectionChange.dispatch(selection);
                    break;
                case 46:
                    selection = getPatientSelectionLast();
                    if (selection!=null) _onPatientSelectionChange.dispatch(selection);
                    break;
                case 44:
                    selection = getPatientSelectionNext();
                    if (selection!=null) _onPatientSelectionChange.dispatch(selection);
                    break;
            }
        });
        var removeListeners = function(){
          
        }

        var api = {
            
            onPatientSelectionChange: _onPatientSelectionChange,
            onGeneSelectionChange: _onGeneSelectionChange,

            addGeneSelection: addGeneSelection,
            setGeneSelection: setGeneSelection,
            getGeneSelection: getGeneSelection,
            getGeneSelections: getGeneSelections,
            getGeneSelectionLast: getGeneSelectionLast,
            getGeneSelectionNext: getGeneSelectionNext,

            addPatientSelection: addPatientSelection,
            setPatientSelection: setPatientSelection,
            getPatientSelection: getPatientSelection,
            getPatientSelections: getPatientSelections,
            getPatientSelectionLast: getPatientSelectionLast,
            getPatientSelectionNext: getPatientSelectionNext,
            getPatientSelectionSecondLast: getPatientSelectionSecondLast,
            
            removeListeners: removeListeners,
            clear: clear
        }
        return api;
    }
})();