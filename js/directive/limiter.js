angular.module('RegistryClient')
    .directive('xgLimiter', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/limiter.html',
            replace: true,
            scope: {
                value: '=',
            },
            controller: function($scope) {
                $scope.options = [5,10,25,50];
                $scope.setValue = function(step) {
                    $scope.value = step;
                }
            }
        }
    })