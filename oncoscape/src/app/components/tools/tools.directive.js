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
                {name:'Markers + Patients', route:'markers', img:'markers.png'},
                {name:'Pathways', route:'pathways', img:'pathways.png'},
                {name:'Partial Least Squares Regression (PLSR)', route:'plsr', img:'plsr.png'},
                {name:'Principal Components Analysis (PCA)', route:'pca', img:'pca.png'},
                {name:'Patient History', route:'history', img:'history.png'},
                {name:'MetaData', route:'metadata', img:'MetaData.png'}
            ];
            vm.explore = function(tool, datasource){
                $state.go(tool, {datasource:datasource});
            };
        }
    }

})();
