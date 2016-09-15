(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTray', tray);

    /** @ngInject */
    function tray() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tray/tray.html',
            scope: {
                caption: '@',
                content: '@',
                change: '&'

            },
            controller: TrayController,
            controllerAs: 'vm',
            bindToController: true,
            replace: true,
            transclude: true
        };

        return directive;

        /** @ngInject */
        function TrayController(osApi, $timeout) {


            var vm = this;
            vm.trayClass = Math.random().toString(36).substring(3);
            vm.iconClass = Math.random().toString(36).substring(3);
            

            var isLocked = true;
            vm.toggle = function(){
                var elTray = angular.element("."+vm.trayClass);
                var elIcon = angular.element("."+vm.iconClass);

                isLocked = !isLocked;
                elIcon
                    .addClass(isLocked ? 'glyphicon-menu-hamburger' : 'glyphicon-remove')
                    .removeClass(isLocked ? 'glyphicon-remove' : 'glyphicon-menu-hamburger');

                elTray.attr("locked", isLocked ? "true" : "false");

                if (isLocked) {
                    elTray
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed");
                    $timeout(function(){
                        vm.change();
                    });
                        
                } else {
                    elTray
                        .addClass("tray-collapsed")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                    $timeout(function(){
                        vm.change();
                    });
                }

                osApi.onResize.dispatch();
            };

            

            var mouseOver = function(){
                angular.element("."+vm.trayClass)
                    .removeClass("tray-collapsed");
            }
            var mouseOut = function(){
                angular.element("."+vm.trayClass)
                    .addClass("tray-collapsed");
            }
        }
    }

})();


