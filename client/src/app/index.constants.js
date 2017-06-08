/* global hello:false, ML:false, jStat:false, TWEEN:false, d3:false, $:false, signals:false, cytoscape:false, document:false, moment:false, _:false, hello:false, localStorage:false, jStat:false, saveAs:false, TextEncoder:false */

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .constant('ML', ML)
        .constant('TWEEN', TWEEN)
        .constant('moment', moment)
        .constant('d3', d3)
        .constant('cytoscape', cytoscape)
        .constant('signals', signals)
        .constant('$', $)
        .constant('auth', hello)
        .constant('jStat', jStat)
        .constant('localStorage', localStorage)
        .constant('saveAs', saveAs)
        .constant('TextEncoder', TextEncoder)
        .constant('jStat', jStat)
        .constant('hello', hello)
        .constant('_', _);

})();