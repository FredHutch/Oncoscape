(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTools', tools);

    /** @ngInject */
    function tools() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tools/tools.html',
            controller: ToolsController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolsController(osApi, $state) {

            var vm = this;
            //osApi.query("lookup_oncoscape_tools",{beta:false}).then(function(response){
            osApi.query("lookup_oncoscape_tools",{beta:false}).then(function(response){                
                vm.tools = response.data;
            });

            vm.explore = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
            };
        }
    }

})();
