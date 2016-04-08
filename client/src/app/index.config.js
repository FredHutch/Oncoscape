(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(config);

    /** @ngInject */
    function config($logProvider, $provide) {
        // Enable log
        $logProvider.debugEnabled(true);
    }
})();
