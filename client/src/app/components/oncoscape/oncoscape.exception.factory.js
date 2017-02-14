(function() {
    'use strict';
    angular.module('oncoscape').directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
    /*
        angular
            .module('oncoscape')
            .provider({
                $exceptionHandler:
    */
    /** @ngInject */
    /*        
            function exceptionFactory(){
            	var handler = function (exception, cause){
                    window.alert("Oh Snap!  An error occured.  View console for details")
                    console.log(exception);
                    exception.stack();
                    if (angular.isDefined(cause)) console.log(cause);
            	}
                this.$get = function() { return handler; };
            }
           });
    */

})();