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
                caption: '@'
            },
            controller: TrayController,
            controllerAs: 'vm',
            bindToController: true,
            replace: true,
            transclude: true
        };

        return directive;

        /** @ngInject */
        function TrayController($timeout) {

            var vm = this;
            var elSidebar = angular.element(".tray");
            var elIcon = angular.element(".tray-sticky-icon");
            var sticky = true;

            vm.toggleSticky = function(){
                sticky = !sticky;
                elIcon
                    .addClass(sticky ? 'glyphicon-remove' : 'glyphicon-plus')
                    .removeClass(sticky ? 'glyphicon-plus' : 'glyphicon-remove');

                if (sticky) {
                    elSidebar
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed");
                        
                } else {
                    elSidebar
                        .addClass("tray-collapsed")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                        
                }
            };

            
            var mouseOver = function(){
                 elSidebar.removeClass("tray-collapsed");
            }
            var mouseOut = function(){
                elSidebar.addClass("tray-collapsed");
            }
        }
    }

})();


