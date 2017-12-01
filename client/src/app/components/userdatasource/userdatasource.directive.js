(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osUserdatasource', userdatasource);

    /** @ngInject */
    function userdatasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/userdatasource/userdatasource.html',
            controller: UserdatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function UserdatasourceController(osApi, $state, osAuth, _) {
            var vm = this;
            vm.user = osAuth.getUser()
            vm.projects = osAuth.getDatasets()
            vm.apis = [
                {   name: "New File", 
                    img:"imgThumb.png"
                },
                {   name: "TCGA", 
                    img:"tcga.png"
                }
            ]

            vm.login = function(){
                var networks = osAuth.getAuthSources();

                //login with google
                osAuth.login(networks[1]);
            }
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.dataset });
            };
            vm.refreshDatasets = function(){
                
                osAuth.refreshDatasets(vm.projects)
            }
            vm.showDatasourceOption = function(source){
                if(source == "TCGA")
                    $state.go("datasource");
                if(source == "New File"){
                   // $state.go("upload");
                    var win = window.open("/upload/");
                    win.focus();
                }
            }
            var updateUser = function(){
                vm.user = osAuth.getUser()
                vm.projects = osAuth.getDatasets()
            }


            osApi.setBusy(false);
            osAuth.onLogin.add(updateUser); 
           
        }
    }
})();