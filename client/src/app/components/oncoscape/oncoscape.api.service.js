(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', osApi);

    /** @ngInject */
    function osApi(osHttp, $http, signals, $location, $q) {

        // Events
        var onDataSource = new signals.Signal();
        var onResize = new signals.Signal();

        // Layout Metrics
        var getLayout = function() {
            return {
                left: (angular.element('#cohortmenu-lock').attr("locked") == "true") ? 300 : 0,
                right: (angular.element(".tray-right").attr("locked") === "true") ? 300 : 0
            };
        };
        var setBusy = function(value) {
            if (value) {
                angular.element(".loader-modal").show();
            } else {
                angular.element(".loader-modal").hide();
            }
        };

        // DataSources
        var _dataSources;
        var _dataSource;
        var getDataSources = function() {
            return _dataSources;
        };
        var getDataSource = function() {
            return _dataSource;
        };
        var setDataSource = function(value) {
            if (angular.isObject(value)) {
                if (_dataSource != value) {
                    _dataSource = value;
                    onDataSource.dispatch(_dataSource);
                }
            } else if (angular.isString(value)) {
                if (_dataSource.disease != value) {
                    if (_dataSource != value) {
                        _dataSource = _dataSources.filter(function(v) {
                            return v.disease == this.key
                        }, {
                            key: value
                        })[0]
                        onDataSource.dispatch(_dataSource);
                    }
                }
            }
        };

        // Initialize
        function init() {
            return $q(function(resolve, reject) {
                //query("lookup_oncoscape_datasources",{beta:false}).then(function(response){ 
                query("lookup_oncoscape_datasources").then(function(response) {
                    _dataSources = response.data
                        .filter(function(d) {
                            return angular.isDefined(d.img)
                        })
                        .map(function(d) {
                            d.name = d.name.trim();
                            return d;
                        })
                        .sort(function(a, b) {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                        });
                    resolve(_dataSources);
                });
            });
        };

        // Query Api
        var queryString = function(table, query) {
            return osHttp.queryString({
                table: table,
                query: query
            });
        };
        var query = function(table, query) {
            return osHttp.query({
                table: table,
                query: query
            });
        };

        return {
            init: init,
            query: query,
            queryString: queryString,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,
            getLayout: getLayout,
            onDataSource: onDataSource,
            onResize: onResize,
            setBusy: setBusy
        }
    }
})();
