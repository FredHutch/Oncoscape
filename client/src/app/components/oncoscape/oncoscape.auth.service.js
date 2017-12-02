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
        var _user = null;
        var getUser = function() {
            return _user;
        };
        var _datasets = null;
        var getDatasets = function() {
            return _datasets;
        };
        var setDatasets = function(datasets) {
            _datasets = datasets;
        };
        var isAuthenticated = function() {
            return _user != null;
        };

        // Authentication Sources
        var authSource = null;
        var authSources = [{
            id: 'guest',
            name: 'Guest',
            icon: 'fa fa-user'
        }, {
            id: 'google',
            name: 'Google',
            icon: 'fa fa-google-plus',
            // key: '428912153446-7c82srcvu1bk1nramiqqctne005epl6s.apps.googleusercontent.com',
            //key: '1098022410981-p7n5ejjji8qlvdtff274pol54jo5i8ks.apps.googleusercontent.com',
            key: '459144121975-lp2p5kahpqahm2gffgtl31vv0nes9hj4.apps.googleusercontent.com',
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

        var loginGuest = function() {
            _user = {
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
                _user = {
                    network: 'guest',
                    id: 'x',
                    name: 'Guest',
                    thumb: 'Guest.png'
                };
            
                onLogin.dispatch();
                
                return;
            }
            var response = auth().login(source.id, {
                
                display: 'popup',
                response_type: 'token',
                scope: 'email',
                force: true
            });

            onLogin.dispatch();
        };

        var logout = function() {
            _user = null
            _datasets = null;
            auth().logout(authSource, {
                force: false
            }, onLogout.dispatch);
        };

        var loadUserData = function() {
            
            if(angular.isUndefined(_user)) return;

            osApi.query("users", {
                Gmail: _user.email
            }).then(function(response) {
                var acct = response.data[0]
                
                if(angular.isUndefined(acct) ) return
                
                osApi.query("permissions", {
                }).then(function(resp) {
                    var permissions = resp.data.filter(function(p){return p.User == acct._id})
                    osApi.query("projects", {
                    }).then(function(r) {
                        r.data = r.data.filter(function(d){ return _.contains(_.pluck(permissions,"Project"), d._id) })
                        osApi.query("lookup_oncoscape_datasources_v2", {
                            dataset: {$in : _.pluck(r.data, "_id")}
                        }).then(function(ds) {
                            _datasets = ds.data.map(function(d){ 
                                d.name = r.data.filter(function(p){return p._id == d.dataset})[0].Name
                                d.description = r.data.filter(function(p){return p._id == d.dataset})[0].Description
                                return d
                            })
                            osApi.addDataSources(_datasets)
                            onLogin.dispatch(_user);
                        })
                        
                    })
                })
            
            });
        };

        auth.init(
            authSources.reduce(function(prev, curr) {
                prev[curr.id] = curr.key;
                return prev;
            }, {}), {
                oauth_proxy: '/api/auth',
                redirect_uri:'/'
                //redirect_uri: 'https://dev.oncoscape.sttrcancer.io/'
            }
        );

        auth.on('auth.login', function(g) {
            osApi.setBusy();
            authSource = g.network;
            osApi.post('token', {'token': g.authResponse.access_token}).then(function(resp){

                osApi.setJWT(resp.token);
        
                    auth(authSource).api("/me", "get", null, function(e) {
                        
                        _user = {
                            network: authSource,
                            id: e.id,
                            name: e.name,
                            thumb: e.thumbnail,
                            email: e.email
                        };
                        osApi.init().then(function() { 
                            loadUserData()   
                            
                        });
                    });
            });

           
        });

        return {
            isAuthenticated: isAuthenticated,
            loginGuest: loginGuest,
            getUser: getUser,
            getAuthSources: getAuthSources,
            setDatasets : setDatasets,
            getDatasets : getDatasets,
            login: login,
            logout: logout,
            onLogin: onLogin,
            onLogout: onLogout
        }
    }
})();