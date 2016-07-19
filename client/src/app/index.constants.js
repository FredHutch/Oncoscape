/* global d3:false, $:false, signals:false, cytoscape:false, SockJS:false, document:false, moment:false, _:false, THREE:false */

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .constant('moment', moment)
        .constant('d3', d3)
        .constant('cytoscape', cytoscape)
        .constant('signals', signals)
        .constant('$', $)
        .constant('_', _);
    // Util Functions
    Number.prototype.map = function (in_min, in_max, out_min, out_max) {
        return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
    
})();