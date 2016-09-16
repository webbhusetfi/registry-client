angular.module('RegistryClient')
.controller('userList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, globalParams, dialogHandler, dbHandler) {
    $scope.roles = {
        "SUPER_ADMIN":"Superadmin",
        "ADMIN":"Administratör",
        "USER":"Användare"
    }
    $scope.globalParams = globalParams;
    $scope.routeParams = $routeParams;
    
    if(globalParams.get('user').registry !== null) {
        var arguments = {
            "filter": {
                "registry":globalParams.get('user').registry
            }
        };
    }else{
        var arguments = {};
    }
    
    dbHandler
        .setQuery({
            "users": {
                "service":"user/search",
                "arguments": arguments
            }
        })
        .runQuery()
        .then(function(response) {
            $scope.resource = response;
        });
});