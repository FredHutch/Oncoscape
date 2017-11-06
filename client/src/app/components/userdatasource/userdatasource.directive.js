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
                $state.go(tool, { datasource: datasource.disease });
            };
            
            vm.showDatasourceOption = function(source){
                if(source == "TCGA")
                    $state.go("datasource");
                if(source == "New File"){
                   // $state.go("upload");
                    var win = window.open("/upload/");
                    win.focus();
                }
            }
           

            var loadUserData = function(user) {

                if(angular.isUndefined(user)) return;

                vm.user = user
             
                osApi.query("Accounts_Users", {
                    Gmail: user.email
                }).then(function(response) {
                    var acct = response.data[0]
                    
                    if(angular.isUndefined(acct) ) return
                    
                osApi.query("Accounts_Permissions", {
                //    User: "ObjectId('"+acct._id+"')"
                //osApi.query("permissions/"+acct._id, {
                }).then(function(resp) {
                        var permissions = resp.data.filter(function(p){return p.User == acct._id})
                        osApi.query("Accounts_Projects", {
                        }).then(function(r) {
                            r.data = r.data.filter(function(d){ return _.contains(_.pluck(permissions,"Project"), d._id) })
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