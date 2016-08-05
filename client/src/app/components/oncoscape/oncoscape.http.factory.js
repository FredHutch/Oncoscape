 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http, $location) {

         //var url = $location.protocol() + "://" + $location.host() + ":" + (($location.port() == "3000") ? 80 : $location.port()) + '/api/'
         var url = $location.protocol() + "://" + $location.host() + ":80/api/";
         //var url = "http://apigateway.fhcrc.org:8000/api/";

         var queryString = function(req) {
             var query = url + req.table;
             if (angular.isDefined(req.query)) query += "/?q="+encodeURIComponent(JSON.stringify(req.query));
             return query;
         };

         var query = function(req) {
            return $http({
                 method: 'GET',
                 //cache: true,
                 url: queryString(req)
             });
         };

         // Return Object
         return {
            queryString: queryString,
            query: query
         };
     }
 })();
