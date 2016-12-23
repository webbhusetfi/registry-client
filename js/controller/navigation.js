angular.module('RegistryClient')
.controller('navigation', function($scope, $routeParams, $log, $location, $window, dbHandler, globalParams){
    if(globalParams.get('user')) {
        $scope.user = globalParams.get('user');
        $scope.globalParams = globalParams;
        $scope.routeParams = $routeParams;
    }else{
        $location.path('/user/logout');
    }
});