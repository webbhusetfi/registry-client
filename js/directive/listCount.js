angular.module('RegistryClient')
    .directive('xgListCount', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/listCount.html',
            replace: true,
            scope: {
                offset: '=',
                limit: '=',
                count: '='
            }
        }
    });