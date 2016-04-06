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
            scope: {
                caption: '@'
            },
            controller: LegendController,
            controllerAs: 'vm',
            bindToController: true,
            replace: true,
            transclude: true
        };

        return directive;

        /** @ngInject */
        function LegendController() {

            var vm = this;

            var elSidebar = angular.element(".sidebar");

            elSidebar
                .bind("mouseover", (function(e){
                    elSidebar.removeClass("sidebar-collapsed");
                }))
                .bind("mouseout", (function(e){
                    elSidebar.addClass("sidebar-collapsed");
                }));



        }
    }

})();


