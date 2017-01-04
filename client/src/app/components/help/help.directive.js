(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHelp', help);

    /** @ngInject */
    function help() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/help/help.html',
            controller: HelpController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HelpController() {

        }
    }
})();