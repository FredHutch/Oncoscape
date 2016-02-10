(function() {
    'use strict';

    angular
        .module('oncoscape')
        .value('SockJS', window.SockJS)
        .factory('osSocket', oncoscape);

    /** @ngInject */
    function oncoscape(SockJS, $rootScope, $log) {

        var createSocket = function() {

            var socket = new SockJS('http://localhost/oncoscape/', '', {
                'debug': true,
                'devel': true
            });

            socket.onopen = function() {
                $log.info("OPEN");
                var args = arguments;
                service.open = true;
                service.timesOpened++;
                $rootScope.$broadcast('SOCKET_CLOSED');
                if (service.handlers.onopen) {
                    $rootScope.$apply(
                        function() {
                            service.handlers.onopen.apply(socket, args);
                        }
                    );
                }
            };

            socket.onmessage = function(data) {
                var args = arguments;
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    $log.error("fOncoscape.onMessage Unable To Parse: " + e);
                }
                if (service.handlers.onmessage) {
                    $rootScope.$apply(
                        function() {
                            service.handlers.onmessage.apply(socket, args);
                        }
                    );
                }
            };

            socket.onclose = function() {
                $log.info("SOCKET CLOSED");
                service.open = false;
                setTimeout(function() {
                    socket = createSocket(service);
                }, 3000);
                var args = arguments;
                $rootScope.$broadcast('SOCKET_OPEN');

                if (service.handlers.onclose) {
                    $rootScope.$apply(
                        function() {
                            service.handlers.onclose.apply(socket, args);
                        }
                    )
                }
            };

            return socket;
        }


        var service = {
            handlers: {},
            onopen: function(callback) {
                this.handlers.onopen = callback;
            },
            onmessage: function(callback) {

                this.handlers.onmessage = callback;
            },
            onclose: function(callback) {
                this.handlers.onclose = callback;
            },
            send: function(data) {
                console.dir(JSON);
                var msg = typeof(data) == "object" ? JSON.stringify(data) : data;
                socket.send(msg);
            },
            open: false
        };
        var socket = createSocket();
        return service;

    }
})();
