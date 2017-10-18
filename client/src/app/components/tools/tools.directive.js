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
            vm.tools = osApi.getTools();
            vm.explore = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().dataset
                });
            };
            osApi.setBusy(false);
        }
    }
})();