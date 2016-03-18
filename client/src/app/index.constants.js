/* global d3:false, $:false, signals:false, cytoscape:false, SockJS:false, document:false, moment:false */
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .constant('moment', moment)
        .constant('d3', d3)
        .constant('cytoscape', cytoscape)
        .constant('signals', signals)
        .constant('SockJS', SockJS)
        .constant('domain', document.domain)
        .constant('$', $);

})();