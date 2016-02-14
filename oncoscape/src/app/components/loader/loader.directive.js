(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLoader', login);

    /** @ngInject */
    function login() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/loader/loader.html',
            replace: true
        };

        return directive;
    }

})();
