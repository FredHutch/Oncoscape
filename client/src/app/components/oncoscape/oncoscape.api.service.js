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
            var rt = angular.element(".tray-right").attr("locked");
            if (angular.isUndefined(rt)) rt = "true";
            return {
                left: (angular.element('#cohortmenu-lock').attr("locked") == "true") ? 300 : 0,
                right: (rt === "true") ? 300 : 0
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
                query("lookup_oncoscape_datasources", {
                    beta: false
                }).then(function(response) {
                    //query("lookup_oncoscape_datasources").then(function(response) {
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
                }, reject);
            });
        }

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

        // Returns Promise
        var _cpuApi;
        (function(serviceEndpoint) {
            var server = serviceEndpoint.substring(0, serviceEndpoint.replace("//", "--").indexOf("/"));
            var createMethod = function(obj, method) {
                var fnName = 'get' + method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
                obj[fnName] = function(options) {
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: serviceEndpoint + "/" + method,
                            type: "POST",
                            data: JSON.stringify(options),
                            contentType: "application/json; charset=utf-8",
                            dataType: "text",
                            beforeSend: function(xhr, settings) {
                                settings.xhrFields = settings.xhrFields || {};
                                settings.xhrFields.withCredentials = true;
                                settings.crossDomain = true;
                            }
                        }).done(function(response) {
                            var response = response.split("\n");
                            var url = server + response[0];
                            $.ajax({
                                url: url,
                                type: "GET",
                                crossDomain: true,
                                beforeSend: function(xhr, settings) {
                                    settings.xhrFields = settings.xhrFields || {};
                                    settings.xhrFields.withCredentials = true;
                                    settings.crossDomain = true;
                                }
                            }).done(function(response) {
                                resolve(response);
                            });
                        });
                    });
                }
            }
            return new Promise(function(resolve, reject) {
                $.get(serviceEndpoint).then(function(methods) {
                    var api = methods.split("\n").reduce(function(obj, method) {
                        if (method != "") createMethod(obj, method)
                        return obj;
                    }, {})
                    api.getEndpoint = function() {
                        return serviceEndpoint;
                    }
                    resolve(api);
                });
            });
        })("https://dev.oncoscape.sttrcancer.io/ocpu/library/oncoscape/R").then(function(v) {
            _cpuApi = v;
        });
        var getCpuApi = function(){ return _cpuApi; };

        return {
            init: init,
            query: query,
            getCpuApi: getCpuApi,
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
