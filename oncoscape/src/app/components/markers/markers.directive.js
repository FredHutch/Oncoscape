(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMarkers', markers);

    /** @ngInject */
    function markers() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/markers/markers.html',
            scope: {},
            controller: MarkersController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MarkersController(osApi, $state, $timeout, $scope, $stateParams) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            
        }
    }
})();
