 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http, $location) {

         var url = $location.protocol() + "://" + $location.host() + ":" + (($location.port() == "3002") ? 80 : $location.port()) + '/api/'
         var request = function(req) {
             var query = url + req.table;
             query += "/?q="+encodeURIComponent(JSON.stringify(req.query));
             // switch (typeof(req.query).toString()) {
             //     case "object":
             //         query += "/?q=" + encodeURIComponent(JSON.stringify(req.query));
             //         break;
             //     case "string":
             //         query += "/" + req.query;
             //         break;
             // }
             // debugger;
             return $http({
                 method: 'GET',
                 url: query
             })
         }

         // Return Object
         return {
             request: request
         };
     }
 })();
