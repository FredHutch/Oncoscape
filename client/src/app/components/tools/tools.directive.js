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
            osApi.query("lookup_oncoscape_tools").then(function(response) {
                var tools = osApi.getDataSource().tools;
                vm.tools = response.data.filter(function(item) {
                    return (tools.indexOf(item.route) != -1);
                }).sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
            });

            vm.explore = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
            };
        }
    }

})();