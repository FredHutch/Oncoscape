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
            vm.tools = [
                {name:'MetaData', route:'metadata'},
                {name:'Patient History', route:'history'},
                {name:'Markers + Patients', route:'markers'},
                {name:'Partial Least Squares Regression (PLSR)', route:'plsr'},
                {name:'Principal Components Analysis (PCA)', route:'pca'},
                {name:'GBM Pathways', route:'gbm'}
            ];
            vm.explore = function(tool, datasource){
                $state.go(tool, {datasource:datasource});
            };
        }
    }

})();
