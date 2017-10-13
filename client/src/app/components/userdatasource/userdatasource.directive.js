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
        function UserdatasourceController(osApi, $state, osAuth, $scope) {
            var vm = this;
            vm.user = osAuth.getUser()
            vm.projects = osAuth.getDatasets()
            vm.apis = [
                {   name: "file", 
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
                $state.go(tool, { datasource: datasource.disease });
            };
            
            vm.showDatasourceOption = function(source){
                if(source == "TCGA")
                    $state.go("datasource");
                if(source == "file")
                    var win = window.open("/upload/",'_blank');
                    win.focus();
            }
           

            var loadUserData = function(user) {

                if(angular.isUndefined(user)) return;

                vm.user = user
             
                osApi.query("Accounts_Users", {
                    Gmail: user.email,
                }).then(function(response) {
                    var acct = response.data[0]
                    
                    if(angular.isUndefined(acct) ) return
                    
                    osApi.query("Accounts_Permissions", {
                        User: acct._id,
                    }).then(function(resp) {
                        var permissions = resp.data
                        osApi.query("Accounts_Projects", {
                            _id: {$in: _.pluck(permissions,"Project")}
                        }).then(function(r) {
                            vm.projects = r.data
                            osAuth.setDatasets(vm.projects)
                        })
                    })
                })
                  
             
             vm.datasets = osApi.getDataSources();
             
             
            };
    
            osAuth.onLogin.add(loadUserData); 

            osApi.setBusy(false);
            
           
        }
    }
})();