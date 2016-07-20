(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCohortMenu', cohortMenu);

    /** @ngInject */
    function cohortMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/cohortmenu/cohortmenu.html',
            controller: CohortMenuController,
            controllerAs: 'vm',
            scope:{
                datasource: '@',
                change: '&'
            },
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortMenuController(osApi, $state) {

            var vm = this;
      
            var tabPatients = $('#cohort-tab-patients');
            var tabGenes    = $('#cohort-tab-genes');

            var mouseOver = function(){
                angular.element(".tool-menu")
                    .removeClass("tray-collapsed-left");
            }

            var mouseOut = function(){
                // angular.element(".tool-menu")
                //     .addClass("tray-collapsed-left");
            }

            var elTray = angular.element(".tool-menu");
                elTray
                    .bind("mouseover", mouseOver)
                    .bind("mouseout", mouseOut);
            

            vm.showPatientHistory = function(){
                tabPatients.addClass("active");
                tabGenes.removeClass("active");
            };
            
            vm.showGeneHistory = function(){
                console.log("!!!!");
                tabGenes.addClass("active");
                tabPatients.removeClass("active");
            };
            
        }
    }

})();
