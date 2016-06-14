angular.module('RegistryClient')
.controller('userLogin', function($scope, $http, $resource, $location, $log, globalParams, dbHandler) {
    $scope.loginform = {};
    $scope.loginform.user = {};
    $scope.loginform.password = {};

    $scope.submit = function() {
        $scope.message = null;

        dbHandler
            .setUrl('login/')
            .setLogin({
                "username":$scope.user,
                "password":$scope.password
            })
            .then(function(response) {
                if(response.message !== undefined)
                {
                    $scope.message = response.message;
                }else{
                    if(response.role == 'SUPER_ADMIN')
                        $location.path('/registry/list');
                    else{
                        dbHandler
                            .getConnectionTypes()
                            .getRegistry({"id": globalParams.get('user').registry})
                            .runQuery()
                            .then(function(response) {
                                if(response.registry)
                                {
                                    var user = globalParams.get('user');
                                    globalParams.set('connectionTypes', response.connectionType);
                                    globalParams.set('registry', response.registry[0]);  
                                    $location.path('entry/list');
                                }else{
                                    $scope.message = 'Fatal error.';
                                }
                            });
                    }
                }
            });
    };
});