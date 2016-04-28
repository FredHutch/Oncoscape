(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $exceptionHandler, osApi, $log) {
        //$log.log("  ___  _ __   ___ ___  ___  ___ __ _ _ __   ___ \n / _ \\| '_ \\ / __/ _ \\/ __|/ __/ _` | '_ \\ / _ \\\n| (_) | | | | (_| (_) \\__ \\ (_| (_| | |_) |  __/\n \\___/|_| |_|\\___\\___/|___/\\___\\__,_| .__/ \\___|\n                                    |_|         ");

        // Route Errors To Angular
        $window.onerror = function handleGlobalError( message, fileName, lineNumber, columnNumber, error ) {
            if ( ! error ) {
                error = new Error( message );
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = ( columnNumber || 0 );
            }
            $exceptionHandler( error );
        }
        
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