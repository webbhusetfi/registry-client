angular.module('RegistryClient')
.controller('userLogout', function($scope, $http, $location, $log, globalParams, dbHandler) {
    dbHandler
        .setUrl('logout/')
        .setLogout()
        .then(function(response) {
            globalParams.unset('all');
            $location.path('/user/login')      
        })
        .catch(function(response) {
            $log.error(response);
        });
});