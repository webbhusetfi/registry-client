angular.module('RegistryClient')
.controller('navigation', function($scope, $routeParams, $log, $window, dbHandler, globalParams){
    $scope.user = globalParams.get('user');
    $scope.globalParams = globalParams;
    $scope.routeParams = $routeParams;
});