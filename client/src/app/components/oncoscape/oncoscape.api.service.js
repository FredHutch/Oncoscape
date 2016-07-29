(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osHttp, $http, signals, $location) {

        // Events
        var onDataSource = new signals.Signal();
        var onResize = new signals.Signal();

        var getLayout = function(){
            return {
                left:  (angular.element('#cohortmenu-lock').attr("locked")=="true") ? 300 : 0,
                right: (angular.element(".tray-right").attr("locked")==="true") ? 300 : 0
            };
        }


        // State
        var _dataSources;
        var _dataSource;
        function getDataSources(){
            return _dataSources;
        }
        function getDataSource(){ 
            return _dataSource; 
        }
        function setDataSource(value){
            
            if (angular.isObject(value)){
                if (_dataSource != value) onDataSource.dispatch(_dataSource);
                _dataSource = value;
            }else if (angular.isString(value){
                if (_dataSource.disease!=value){
                    if (_dataSource != value) onDataSource.dispatch(_dataSource);
                    console.log("DISEASE?");
                    _dataSource = _dataSources.filter(function(v){ v.disease==disease}, {key:value})[0]
                }
            }
        }

        query("lookup_oncoscape_datasources",{beta:false}).then(function(response){ 
            _dataSources = response.data; 
                            
        });
        
        /*** User Api ***/
        function userApi(){

            // Events
            var onLogin = new signals.Signal(); // Fired When Data Changes
            var onLogout = new signals.Signal(); // Fired When Selection changes
            var _user = {
                "name":"",
                "password":"",
                "domain":{"name":"Guest"},
                "authenticated":false,
                "token": null,
                "datasets": []
            };
            var _domains = [
                { "name": "Guest" },
                { "name": "FHCRC" },
                { "name": "UW" }
            ];
            var logout = function(){
                _user.name = "";
                _user.password = "";
                _user.domain = {"name":"Guest"};
                _user.authenticated = false;
                _user.token = null;
                _user.datasets = [];

                onLogout.dispatch();
            }
            var login = function(user){
                _user = user;
                var req = {
                    method: 'POST',
                    url: $location.protocol()+"://"+$location.host()+":"+ (($location.port()=="3000") ? 80 : $location.port()) +'/login',
                    data: {
                        username: _user.name,
                        password: _user.password,
                        domain: _user.domain.name
                    }
                };
                return $http(req).then(function(res) {
                    if (res.data.success) {
                        _user.authenticated = true;
                        _user.token = res.data.token;
                        _user.datasets = res.data.datasets;                        
                        onLogin.dispatch(_user);
                    } else {
                        _user.authenticated = false;
                        _user.token =null;
                    }
                });
            }
            return {
                getDomains: function(){ return _domains; },
                getUser: function() { return _user; },
                login: login,
                logout: logout,
                onLogin: onLogin,
                onLogout: onLogout
            }
        }
        var _userApi = userApi();
        function getUserApi() { return _userApi; }

        /*** UI Functions ***/
        function setBusy(value) {
            if (value) {
                angular.element(".loader-modal").show();
            } else {
                angular.element(".loader-modal").hide();
            }
        }
        
       
        function queryString(table, query){
            return osHttp.queryString({
                table: table,
                query: query
            });
        }
        function query(table, query){
            return osHttp.query({
                table: table,
                query: query
            });
        }

        return {

            // Mongo V
            query: query,
            queryString: queryString,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,
            getLayout: getLayout,
            onDataSource: onDataSource,
            onResize: onResize,
            getUserApi: getUserApi,
            setBusy: setBusy
        }
    }
})();