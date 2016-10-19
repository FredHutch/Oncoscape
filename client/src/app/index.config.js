(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(config);

    /** @ngInject */
    function config($logProvider) {
        $logProvider.debugEnabled(false);
    }
    
})();
