(function() {
	'use strict';

	angular
		.module('oncoscape')
		.service('osState', osState);

	/** @ngInject */
	function osState() {
		this.getUser = getUser;
		function getUser(){
			return {
				"name":"",
				"password":"",
				"domain":{"name":"Guest"},
				"authenticated":false,
				"token": null
			}
		}
	}
})();