 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http, $location) {

         //var url = "/api/";
         //url = "https://dev.oncoscape.sttrcancer.io/api/";
         var url = "https://oncoscape.sttrcancer.org/api/";
         var queryString = function(req) {
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