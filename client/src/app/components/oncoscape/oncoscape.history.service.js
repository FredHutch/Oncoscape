(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osHistory', osHistory);

    /** @ngInject */
    function osHistory(moment, signals, osSound, _) {

        var _geneSelections = [{ids:[], tool:'Application', desc:'Load'}];
        var _geneIndex = 0;
        var _patientSelections = [{ids:[], tool:'Application', desc:'Load'}];
        var _patientIndex = 0;
        var _onPatientAdd = new signals.Signal();
        var _onPatientSelectionChange = new signals.Signal();
        var _onGeneAdd = new signals.Signal();
        var _onGeneSelectionChange = new signals.Signal();
       
        /* Gene */
        var setGeneSelection = function(selection){
            var index = _geneSelections.indexOf(selection);
            if (index>=0){
                _geneIndex = index
                _onGeneSelectionChange.dispatch(getGeneSelection())
            }
        };
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
            if (ids.length==getGeneSelection().ids.length){
                if (_.difference(ids, getGeneSelection().ids).length==0) return;
            }
            var m = moment();
            _geneSelections.push({tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")});
            _geneIndex += _geneSelections.length-1;
            _onGeneAdd.dispatch(getGeneSelection())
        };
        var getGeneSelectionLast = function(){
            _geneIndex -= 1;
            if (_geneIndex<0) { 
                osSound.beep();
                _geneIndex = 0; return; }
            var selection = getGeneSelection();
            _onGeneSelectionChange.dispatch(selection);
            return selection;
        };
        var getGeneSelectionNext = function(){
            _geneIndex += 1;
            if (_geneIndex==_geneSelections.length) { 
                osSound.beep();
                _geneIndex = _geneSelections.length-1; return; }
            var selection = getGeneSelection();
            _onGeneSelectionChange.dispatch(selection);
            return selection;
        };

        /* Patient */
        var setPatientSelection = function(selection){
            var index = _patientSelections.indexOf(selection);
            if (index>=0){
                _patientIndex = index
                _onPatientSelectionChange.dispatch(getPatientSelection())
            }
        };
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
            if (ids.length==getPatientSelection().ids.length){
                if (_.difference(ids, getPatientSelection().ids).length==0) return;
            }
            var m = moment();
            _patientSelections.push({tool:tool, desc:desc, ids:ids, date:m.unix(), time:m.format("H:mm")});
            _patientIndex = _patientSelections.length-1;
            _onPatientAdd.dispatch(getPatientSelection());
        };
        var getPatientSelectionLast = function(){
            _patientIndex -= 1;
            if (_patientIndex<0) { 
                osSound.beep();
                _patientIndex = 0; return; }
            var selection = getPatientSelection();
            _onPatientSelectionChange.dispatch(selection);
            return selection;
        };
        var getPatientSelectionSecondLast = function(){
            /*
            var i = _patientSelections.indexOf(_patientSelection) - 2;
            if (i<1){
                osSound.beep();
                return null;
            } 
            _patientSelection = _patientSelections[i];
            return _patientSelection;
            */
        };
        var getPatientSelectionNext = function(){
            _patientIndex += 1;
            if (_patientIndex==_patientSelections.length) { 
                osSound.beep();
                _patientIndex = _patientSelections.length-1; return; }
            var selection = getPatientSelection();
            _onPatientSelectionChange.dispatch(selection);
            return selection;
        };


        var removeListeners = function(){
          
        };
        var clear = function(){
           
        };


        var api = {
            onPatientAdd: _onPatientAdd,
            onPatientSelectionChange: _onPatientSelectionChange,
            onGeneAdd: _onGeneAdd,
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
            getPatientSelectionNext: getPatientSelectionNext,
            getPatientSelectionLast: getPatientSelectionLast,
            getPatientSelectionSecondLast: getPatientSelectionSecondLast,
            
            removeListeners: removeListeners,
            clear: clear
        };
        return api;
    }
})();