(function() {
  'use strict';

  angular
    .module('oncoscape')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
