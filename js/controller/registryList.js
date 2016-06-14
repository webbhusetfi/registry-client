angular.module('RegistryClient')
.controller('registryList', function ($scope, $routeParams, $http, $location, $window, $log, dbHandler, dialogHandler, globalParams) {
    $scope.goto = function(id) {
        dbHandler
            .getConnectionTypes(id)
            .getRegistry({"id": id})
            .runQuery()
            .then(function(response) {
                var user = globalParams.get('user');
                user.registry = Number(id);
                globalParams.set('user', user);
                globalParams.set('connectionTypes', response.connectionType);
                globalParams.set('registry', response.registry[0]);
                $location.path('entry/list');
            });
    }
    $scope.user = globalParams.get('user');

    $scope.deleteConfirm = function(item) {
        dialogHandler.deleteConfirm(item, {
            "entry": {
                "service":"registry/delete",
                "arguments": {
                    "id": item.id
                }
            }
        })
    };

    if (globalParams.get('user').role != 'SUPER_ADMIN') {
        $location.path('entry/list');
    } else {
        dbHandler
            .getRegistries({
                "offset":0,
                "limit":20
            })
            .runQuery()
            .then(function(response) {
                $scope.resource = response;
            })
            .catch(function(response) {
                $log.error(response);
                $location.path('/user/logout');
            });
    }
});
