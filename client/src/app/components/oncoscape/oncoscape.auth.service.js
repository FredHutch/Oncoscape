(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osAuth', osAuth);

    /** @ngInject */
    function osAuth(osHttp, $http, signals, $location, auth, osApi) {

        // Events
        var onLogin = new signals.Signal(); // Fired When Data Changes
        var onLogout = new signals.Signal(); // Fired When Selection changes

        // User Object
        var user = null;
        var getUser = function() {
            return user;
        };
        var isAuthenticated = function() {
            return user != null;
        };

        // Authentication Sources
        var authSource = null;
        var authSources = [{
                id: 'guest',
                name: 'Guest',
                icon: 'fa fa-user'
            },{
                id: 'google',
                name: 'Google',
                icon: 'fa fa-google-plus',
                key: '428912153446-7c82srcvu1bk1nramiqqctne005epl6s.apps.googleusercontent.com',
                mode: 'implicit'
            }, {
                id: 'linkedin',
                name: 'LinkedIn',
                icon: 'fa fa-linkedin',
                key: '7869gkuwwnacez',
                mode: 'explicit'
            }];
            
            /*}, {
                id: 'facebook',
                name: 'Facebook',
                icon: 'fa fa-facebook',
                key: '142281766208909',
                mode: 'implicit'
            }, {
                id: 'github',
                name: 'GitHub',
                icon: 'fa fa-github-alt',
                key: '78b5dbe2ba756151169e',
                mode: 'explicit'
            },{
                id: 'instagram',
                name: 'Instagram',
                icon: 'fa fa-instagram',
                key: '3578c1b7c8c248c6ba80784b9ede0c52',
                mode: 'implicit'
            }, {
                id: 'linkedin',
                name: 'LinkedIn',
                icon: 'fa fa-linkedin',
                key: '7869gkuwwnacez',
                mode: 'explicit'
            }, {
                id: 'twitter',
                name: 'Twitter',
                icon: 'fa fa-twitter',
                key: 'vrbGiMB0LCtuHeShKE6v5IIFa',
                mode: 'implicit'
            }, {
                id: 'windows',
                name: 'Win Live',
                icon: 'fa fa-windows',
                key: 'caee23ac-d4aa-41c7-9bda-166b86c52de3',
                mode: 'implicit'
            }, {
                id: 'dropbox',
                name: 'Dropbox',
                icon: 'fa fa-dropbox',
                key: 'dropbox',
                mode: 'implicit'
            }, {
                id: 'flickr',
                name: 'Flickr',
                icon: 'fa fa-flickr',
                key: '',
                mode: 'implicit'
            }*/
        
        var getAuthSources = function() {
            return authSources;
        };

        var loginGuest = function(){
            user = {
                    network: 'guest',
                    id: 'x',
                    name: 'Guest',
                    thumb: 'Guest.png'
                };
            osApi.init().then(function() {
                onLogin.dispatch();
            });
        }
        var login = function(source) {
            if (source.id == 'guest') {
                user = {
                    network: 'guest',
                    id: 'x',
                    name: 'Guest',
                    thumb: 'Guest.png'
                };
                osApi.init().then(function() {
                    onLogin.dispatch();
                });
                return;
            }
            auth().login(source.id, {
                response_type: 'code',
                display: 'page',
                force: false,
                scope: "email"
            });
        };

        var logout = function() {
            auth().logout(authSource, {
                force: false
            }, onLogout.dispatch);
        };

        auth.init(
            authSources.reduce(function(prev, curr) {
                prev[curr.id] = curr.key;
                return prev;
            }, {}), {
                oauth_proxy: '/api/auth',
                redirect_uri: 'https://dev.oncoscape.sttrcancer.io/'
            }
        );

        auth.on('auth.login', function(e) {
            osApi.setBusy();
            authSource = e.network;
            auth(authSource).api("/me", "get", null, function(e) {
                user = {
                    network: authSource,
                    id: e.id,
                    name: e.name,
                    thumb: e.thumbnail
                };
                osApi.init().then(function() {
                    onLogin.dispatch();
                });
            });
        });

        return {
            isAuthenticated: isAuthenticated,
            loginGuest: loginGuest,
            getUser: getUser,
            getAuthSources: getAuthSources,
            login: login,
            logout: logout,
            onLogin: onLogin,
            onLogout: onLogout
        }
    }
})();
