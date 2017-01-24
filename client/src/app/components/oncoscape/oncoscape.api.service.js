(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', osApi);

    /** @ngInject */
    function osApi(osHttp, $http, signals, $location, $q, $, $window, _) {

        // Events
        var onDataSource = new signals.Signal();
        var onResize = new signals.Signal();
        var onNavChange = new signals.Signal();

        // Resize
        angular.element($window).bind('resize', _.debounce(onResize.dispatch, 900));

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
        var _tools;
        var getTools = function() {

            return _tools.filter(function(item) {
                return (_dataSource.tools.indexOf(item.route) !== -1);
            }).sort(function(a, b) {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });
        };
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

        // Initialize (Load Tools Raw Data + DataSources)
        var initialized = false;

        function init() {
            if (initialized) return new Promise(function(resolve) { resolve(); });
            initialized = true;
            return Promise.all([
                new Promise(function(resolve, reject) {
                    query("lookup_oncoscape_tools").then(function(response) {
                        _tools = response.data;
                        resolve(_tools);
                    }, reject);
                }),
                new Promise(function(resolve, reject) {
                    query("lookup_oncoscape_datasources", {
                        beta: false
                    }).then(function(response) {
                        _dataSource = { disease: '' };
                        _dataSources = response.data
                            .filter(function(d) {
                                return angular.isDefined(d.img)
                            })
                            .map(function(d) {
                                d.name = d.name.trim();
                                return d;
                            })
                            .sort(function(a, b) {
                                return (a.img < b.img) ? -1 :
                                    (a.img > b.img) ? 1 :
                                    (a.disease < b.disease) ? -1 :
                                    (a.disease > b.disease) ? 1 :
                                    0;
                            });
                        resolve(_dataSources);
                    }, reject);
                })
            ]);
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

        return {
            init: init,
            query: query,
            queryString: queryString,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,
            getTools: getTools,
            getLayout: getLayout,
            onNavChange: onNavChange,
            onDataSource: onDataSource,
            onResize: onResize,
            setBusy: setBusy
        }
    }
})();

// Returns Promise
// var _cpuApi;
// (function(serviceEndpoint) {
//     var server = serviceEndpoint.substring(0, serviceEndpoint.replace("//", "--").indexOf("/"));
//     var createMethod = function(obj, method) {
//         var fnName = 'get' + method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
//         obj[fnName] = function(options) {
//             return new Promise(function(resolve) {
//                 $.ajax({
//                     url: serviceEndpoint + "/" + method,
//                     type: "POST",
//                     data: angular.toJson(options),
//                     contentType: "application/json; charset=utf-8",
//                     dataType: "text",
//                     beforeSend: function(xhr, settings) {
//                         settings.xhrFields = settings.xhrFields || {};
//                         settings.xhrFields.withCredentials = false;
//                         settings.crossDomain = true;
//                     }
//                 }).done(function(response) {
//                     response = response.split("\n");
//                     var url = server + response[0];
//                     $.ajax({
//                         url: url,
//                         type: "GET",
//                         crossDomain: true,
//                         beforeSend: function(xhr, settings) {
//                             settings.xhrFields = settings.xhrFields || {};
//                             settings.xhrFields.withCredentials = false;
//                             settings.crossDomain = true;
//                         }
//                     }).done(function(response) {
//                         resolve(response);
//                     });
//                 });
//             });
//         }
//     }
//     return new Promise(function(resolve) {
//         $.get(serviceEndpoint).then(function(methods) {
//             var api = methods.split("\n").reduce(function(obj, method) {
//                 if (method != "") createMethod(obj, method)
//                 return obj;
//             }, {})
//             api.getEndpoint = function() {
//                 return serviceEndpoint;
//             }
//             resolve(api);
//         });
//     });
// })("https://oncoscape-test.fhcrc.org/ocpu/library/oncoscape/R").then(function(v) {
//     _cpuApi = v;
// });
// var getCpuApi = function() {
//     return _cpuApi;
// };