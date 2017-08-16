(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCollectionPanel', collectionPanel);

    /** @ngInject */
    function collectionPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/collectionpanel/collectionpanel.html',
            controller: CollectionPanelController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CollectionPanelController(osApi, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
          

            // Tray Expand / Collapse
            var elTray = angular.element(".collection-panel");
            var isLocked = true;
            var mouseOver = function() { elTray.removeClass("tray-collapsed-left"); };
            var mouseOut = function() { elTray.addClass("tray-collapsed-left"); };
            vm.toggle = function() {
                isLocked = !isLocked;
                angular.element("#collectionpanel-lock")
                    .addClass(isLocked ? 'fa-lock' : 'fa-unlock-alt')
                    .removeClass(isLocked ? 'fa-unlock-alt' : 'fa-lock')
                    .attr("locked", isLocked ? "true" : "false");
                if (isLocked) {
                    elTray
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed-left");
                } else {
                    elTray
                        .addClass("tray-collapsed-left")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                }
                osApi.onResize.dispatch();
            };

            

        }
    }

})();