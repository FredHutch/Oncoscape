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
				"name":"michael",
				"password":"mzT1hs0nT1hs0n1q2w3e",
				"domain":{"name":"FHCRC"}
			}
		}
	}
})();