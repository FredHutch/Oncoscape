(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($log, $rootScope) {

        // Actions To Take On State Change
        $rootScope.$on('$stateChangeStart', function() {

            // Reset DataTable Custom Filters
            angular.element.fn.DataTable.ext.search = [];

        });

        $log.debug('runBlock end');
    }

})();
