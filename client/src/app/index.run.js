(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $timeout, $exceptionHandler, osApi, osAuth) { //, $log

        // Force Cohort Menu & Header To Hide On Page Refresh.  Not applying in chrome.
        // $timeout(function() {
        // angular.element("#cohortMenu").css({ "display": "none" });
        // angular.element("#header").css({ display: "none" });
        // }, 200);

        // Route Errors To Angular
        $window.onerror = function handleGlobalError(message, fileName, lineNumber, columnNumber, error) {
            if (!error) {
                error = new Error(message);
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = (columnNumber || 0);
            }
            $exceptionHandler(error);
        };

        // Actions To Take On State Change
        /* This all needs to be moved into the router */
        var off = $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

            // Hide Busy Cursor
            osApi.setBusy(false);

            // // Route unauthenticated users to landing page
            // if (toState.authenticate && !osAuth.isAuthenticated()) {
            //     $state.transitionTo("landing");
            //     event.preventDefault();
            //     return;
            // }

            // //Redirect If Unable To Resolve Data Source
            // if (toState.datasource && (angular.isUndefined(toParams.datasource) || toParams.datasource === "")) {
            //     $state.transitionTo("datasource");
            //     event.preventDefault();
            //     return;
            // } else {
            //     osApi.setDataSource(toParams.datasource);
            // }
        });


        $rootScope.$on('$destroy', off)
    }
})();