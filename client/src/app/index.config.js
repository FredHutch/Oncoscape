(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(config);

    /** @ngInject */
    function config($logProvider) {
        // Enable log
        $logProvider.debugEnabled(true);
    }
})();
