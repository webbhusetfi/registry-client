angular.module('RegistryClient')
.controller('registryEdit', function($scope, $routeParams, $http, $location, $log, dbHandler, globalParams) {
    $scope.routeParams = $routeParams;
    $scope.registry = {};

    if(Number($routeParams.id) !== -1)
    {
        dbHandler
            .getRegistry({"id":$routeParams.id})
            .runQuery()
            .then(function(response) {
                $scope.registry = response.registry;
            })
            .catch(function(response) {
                $log.error(response);
                $location.path('/user/logout');
            });
    }
    $scope.submit = function() {
        var request = {
            "registry": {
                "service":"registry/update",
                "arguments":{
                    "name":$scope.registry.name
                }
            }
        }

        if(Number($routeParams.id) !== -1)
            request.registry.arguments.id = $scope.registry.id;
        else
            request.registry.service = 'registry/create';

        dbHandler
            .setQuery(request)
            .runQuery()
            .then(function(response) {
                $location.path('/registry/list');
            })
            .catch(function(response) {
                $location.path('/logout');
            });
    };
});