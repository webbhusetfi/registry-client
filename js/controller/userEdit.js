angular.module('RegistryClient')
.controller('userEdit', function($scope, $log, $routeParams) {
    var merge = {
        "routeParams":$routeParams
    }
    // $log.log($scope);
    $scope = angular.merge($scope, merge);
    // $log.log($scope);
});