(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osFooter', footer);

    /** @ngInject */
    function footer() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/footer/footer.html',
            controller: FooterController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function FooterController() {
            //var vm = this;
        }
    }

})();
