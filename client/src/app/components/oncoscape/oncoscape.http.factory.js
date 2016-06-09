 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http, $location) {

         var url = $location.protocol() + "://" + $location.host() + ":" + (($location.port() == "3002") ? 80 : $location.port()) + '/api/'

         var queryString = function(req) {
            console.log(req.table)
            console.log(JSON.stringify(req.query));
             var query = url + req.table;
             if (angular.isDefined(req.query)) query += "/?q="+encodeURIComponent(JSON.stringify(req.query));
             console.log(query);
             return query;
         };

         var query = function(req) {
            return $http({
                 method: 'GET',
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
