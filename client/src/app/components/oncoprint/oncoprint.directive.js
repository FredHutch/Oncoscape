(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osOncoprint', oncoprint);

    /** @ngInject */
    function oncoprint() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/oncoprint/oncoprint.html',
            controller: OncoprintController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function OncoprintController(osApi, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // View Model
            var vm = this;
            osApi.setBusy(false);
        }
    }
})();
