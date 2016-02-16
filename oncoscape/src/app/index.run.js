(function() {
  'use strict';

  angular
    .module('oncoscape')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, $rootScope) {

  	// Actions To Take On State Change
  	$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){ 

  		// Reset DataTable Custom Filters
  		$.fn.DataTable.ext.search = [];

	});

    $log.debug('runBlock end');
  }

})();
