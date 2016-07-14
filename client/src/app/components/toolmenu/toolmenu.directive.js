(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osToolMenu', toolmenu);

    /** @ngInject */
    function toolmenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/toolmenu/toolmenu.html',
            controller: ToolMenuController,
            controllerAs: 'vm',
            scope:{
                datasource: '@',
                change: '&'
            },
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolMenuController(osApi, $state) {

      
            var mouseOver = function(){
                angular.element(".tool-menu")
                    .removeClass("tray-collapsed-left");
            }

            var mouseOut = function(){
                angular.element(".tool-menu")
                    .addClass("tray-collapsed-left");
            }

            var elTray = angular.element(".tool-menu");
                elTray
                    .bind("mouseover", mouseOver)
                    .bind("mouseout", mouseOut);
            
            var vm = this;
            osApi.query("lookup_oncoscape_tools",{beta:false}).then(function(response){
                vm.tools = response.data;
            });

            vm.explore = function(tool) {
                vm.change();
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
            };
        }
    }

})();
