 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http) {
         //window.collections = {};
         var url = "/api/";
         //url = "https://dev.oncoscape.sttrcancer.io/api/";
           url = "https://oncoscape-test.fhcrc.org/api/";

         var queryString = function(req) {
             //window.collections[req.table] = 1;
             var query = url + req.table;
             if (angular.isDefined(req.query)) query += "/" + encodeURIComponent(angular.toJson(req.query));
             return query;
         };

         var query = function(req) {
             return $http({
                 method: 'GET',
                 url: queryString(req),
                 headers: {
                     apikey: 'password'
                 }
             });
         };

         // Return Object
         return {
             queryString: queryString,
             query: query
         };
     }
 })();
