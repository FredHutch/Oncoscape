(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $exceptionHandler, osApi) { //, $log

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
        var off = $rootScope.$on('$stateChangeStart', function(event, toState) {

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

        $rootScope.$on('$destroy', off)
    }
})();