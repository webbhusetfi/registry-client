angular.module('RegistryClient')
.controller('pageController',  function ($scope, $location, $log) {
    if($location.path().trim('/') == '/user/login' || $location.path() == '/')
        $scope.layout = 'login';
    else
        $scope.layout = 'default';
});