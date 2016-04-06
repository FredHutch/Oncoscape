(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(config);

    /** @ngInject */
    function config($logProvider) {
        // Enable log
        $logProvider.debugEnabled(true);

        // Decorate The Exception Handler
        /*
        $provide.decorator('$exceptionHandler', function($delgate){
            return function(exception, cause) {
                $delegate(exception, cause);
                var errorData = {
                    exception: exception,
                    cause: cause
                };
                alert(exception.msg);
                //toastr.error(exception.msg, errorData);
            };
        });
        */
    }
})();
