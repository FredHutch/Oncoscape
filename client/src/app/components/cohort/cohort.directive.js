(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osCohort', cohort);

    /** @ngInject */
    function cohort() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/cohort/cohort.html',
            replace: true
        };

        return directive;

        /** @ngInject */
        function CohortController(osApi) {
            var vm = this;
            vm.cohorts;
            vm.cohort;
           
        }
    }
})();
