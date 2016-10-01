 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http, $location) {

         //var url = $location.protocol() + "://" + $location.host() + "/api/";
         var url = "https://dev.oncoscape.sttrcancer.io/api/";
         var queryString = function(req) {
             var query = url + req.table;
             if (angular.isDefined(req.query)) query += "/" + encodeURIComponent(JSON.stringify(req.query));
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
