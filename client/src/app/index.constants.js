/* global hello:false, jStat:false, TWEEN:false, d3:false, $:false, signals:false, cytoscape:false, document:false, moment:false, _:false, localStorage:false, saveAs:false, TextEncoder:false */

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .constant('jStat', jStat)
        .constant('TWEEN', TWEEN)
        .constant('moment', moment)
        .constant('d3', d3)
        .constant('cytoscape', cytoscape)
        .constant('signals', signals)
        .constant('$', $)
        .constant('auth', hello)
        .constant('localStorage', localStorage)
        .constant('saveAs', saveAs)
        .constant('TextEncoder', TextEncoder)
        .constant('hello', hello)
        .constant('_', _)
        .constant('ML',ML);

})();
