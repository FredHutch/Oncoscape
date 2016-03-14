(function() {
    'use strict';

    angular
        .module('oncoscape')
        .factory('osSocket', oncoscape);

    /** @ngInject */
    function oncoscape(SockJS, $rootScope, $q, $log, $location) {
       
        // Object To Store Call Back Promises
        var callbacks = {};

        // Request Ids Used To Coorelate Request With Callback
        var requestId = 1;
        var getRequestId = function() { 
            if (requestId==9999) requestId = 1;
            return requestId++; 
        }

        // Create Sock JS Instace
        var socket = new SockJS(
            $location.protocol()+"://"+$location.host()+":"+ (($location.port()=="3002") ? 80 : $location.port()) +'/oncoscape','',
            {
                'debug': false,
                'devel': false
            }
        );

        // Handle Messages From Socket & Resolve Promise
        socket.onmessage = function(event) {
            var data = angular.fromJson(event.data);
            if (angular.isDefined(callbacks[data.cmd])) {
                var callback = callbacks[data.cmd];
                delete callbacks[data.cmd];
                callback.resolve(data);
            } else {

                $log.error("Unhandled message: %o", data);
            }
        };

        // Formulate Request
        var request = function(request) {

            // Add Additional Information To Request Per Chinook Protocol
            request.callback = getRequestId();
            request.status = "request";
            request.payload = request.payload || "";

            // Store Promise In Callback Object
            var deferred = $q.defer();
            callbacks[request.callback] = deferred;

            // Ensure Socket Is Open Before Sending
            if (socket.readyState===0){
                socket.onopen = function(){
                    socket.send(angular.toJson(request));    
                };
            }else{
                socket.send(angular.toJson(request));
            }

            // Return Promise
            return deferred.promise.then(function(response) {
                request.response = response;
                return response;
            });
        }

        // Return Object
        return {
            request: request
        };
    }
})();
