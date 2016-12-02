angular.module('RegistryClient')
.controller('userLogout', function($scope, $http, $window, $log, globalParams, dbHandler) {
    dbHandler
        .setUrl('logout/')
        .setLogout()
        .then(function(response) {
            globalParams.unset('all');
            $window.location.href = '/user/login';
        })
        .catch(function(response) {
            $log.error(response);
        });
});