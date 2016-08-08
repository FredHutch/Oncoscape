(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osColorPanel', colorPanel);

    /** @ngInject */
    function colorPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/colorpanel/colorpanel.html',
            controller: ColorPanelController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ColorPanelController(osApi, osCohortService) {


            // Properties
            var vm = this;
            vm.showPanelColorRna = false;
            var table;

            osApi.query('render_patient', {
                type: 'color',
                dataset: osApi.getDataSource().disease,
                $fields: ['name']
            }).then(function(v){
              vm.optPatientColors = [
                  {name:'None'}
                ].concat(v.data);
            });

            vm.setColor = function(item){
              if (item.name=='RNA Expression') {
                vm.showPanelColorRna = true;
                return;
              }else{
                osCohortService.setPatientColor(
                  osApi.query('render_patient', {
                    type: 'color',
                    dataset: osApi.getDataSource().disease,
                    name: item.name
                  })
                );
              }
            };
            

        }
    }
})();
