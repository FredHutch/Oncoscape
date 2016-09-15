(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCompare', header);

    /** @ngInject */
    function header() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/compare/compare.html',
            controller: CompareController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CompareController() {
            //var vm = this;
        }
    }

})();
