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
        function HelpController(osApi, $state, $stateParams) {
            var vm = this;
           vm.videos = [
               {
                    name: 'Oncoscape + Github',
                    desc: 'Description Lorum Ipsum eos et sid al accusamus et iusto odio',
                    img: ''
               },
               {
                    name: 'Creating Cohorts',
                    desc: 'Description Lorum Ipsum eos et sid al accusamus et iusto odio',
                    img: ''
               },
               {
                    name: 'Patients + Markers',
                    desc: 'Description Lorum Ipsum eos et sid al accusamus et iusto odio',
                    img: ''
               },
               {
                    name: 'Timelines',
                    desc: 'Description Lorum Ipsum eos et sid al accusamus et iusto odio',
                    img: ''
               }
           ]
        }
    }

})();
