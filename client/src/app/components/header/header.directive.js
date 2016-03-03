(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeader', header);

    /** @ngInject */
    function header() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/header/header.html',
            scope: {

            },
            controller: HeaderController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeaderController() {
            //var vm = this;
        }
    }

})();
