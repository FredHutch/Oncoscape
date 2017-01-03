(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($window, $exceptionHandler) { //, $log

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
    }
})();