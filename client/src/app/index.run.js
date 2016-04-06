(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $exceptionHandler, osApi) {


        // Actions To Take On State Change
        $rootScope.$on('$stateChangeStart', function(event, toState) {

            // Hide Busy Cursor
            osApi.setBusy(false);

            // Reset DataTable Custom Filters
            angular.element.fn.DataTable.ext.search = [];

            // Route unauthenticated users to landing page
            // if (toState.authenticate && !osApi.getUserApi().getUser().authenticated) {
            //      $state.transitionTo("landing");
            //      event.preventDefault();
            // }
        });
    }
})();