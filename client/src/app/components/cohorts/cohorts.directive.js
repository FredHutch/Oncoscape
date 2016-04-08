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
            controller: CohortController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortController(osApi) {
            var vm = this;
           
        }
    }
})();
