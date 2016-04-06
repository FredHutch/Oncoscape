(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLegend', legend);

    /** @ngInject */
    function legend() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/legend/legend.html',
            scope: {},
            controller: LegendController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LegendController() {

            var vm = this;
            

        }
    }

})();