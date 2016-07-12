(function() {
    //'use strict';

    angular
        .module('oncoscape')
        .directive('osSummary', markers);

    /** @ngInject */
    function markers() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/summary/summary.html',
            scope: {},
            controller: SummaryController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SummaryController(osApi, osHistory, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {

        }
    }
})();

