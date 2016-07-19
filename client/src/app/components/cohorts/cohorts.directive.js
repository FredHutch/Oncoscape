(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCohorts', cohorts);

    /** @ngInject */
    function cohorts() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/cohorts/cohorts.html',
            controller: CohortsController,
            scope: {
                type: "@"
            },
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortsController(osHistory, $state, $timeout) {

            var vm = this;
            vm.selection;
            vm.selections;

            vm.close = function() {
                angular.element(".cohorts-" + vm.type).hide();
            }
            vm.setSelection = function(item) {
                osHistory["set" + vm.type + "Selection"](item);
            };
            var update = function() {
                $timeout(function() {
                    vm.selections = osHistory["get" + vm.type + "Selections"]();
                    vm.selection = osHistory["get" + vm.type + "Selection"]();

                });
            };

            osHistory["on" + vm.type + "Add"].add(function() {
                update(true)
            });
            osHistory["on" + vm.type + "SelectionChange"].add(function() {
                update(false)
            });

            var isDragable = false;
            var show = function() {
                angular.element(".cohorts-" + vm.type).show();
                if (isDragable) return;
                isDragable = true;
                angular.element(".cohorts-" + vm.type).draggable();

            }

            // Keypress
            angular.element(document).keypress(function(e) {
                if (!e.ctrlKey) return;
                if (vm.type == "Gene") {
                    switch (e.keyCode) {
                        case 12:
                            show();
                            break;
                        case 39:
                            osHistory.getGeneSelectionNext();
                            break;
                        case 59:
                            osHistory.getGeneSelectionLast();
                            break;
                    }
                } else {
                    switch (e.keyCode) {
                        case 16:
                            show();
                            break;
                        case 27:
                            osHistory.getPatientSelectionLast();
                            break;
                        case 29:
                            osHistory.getPatientSelectionNext();
                            break;
                    }
                }

            });
        }
    }
})();
