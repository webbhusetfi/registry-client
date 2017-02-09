angular.module('RegistryClient')
.controller('userList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, $timeout, globalParams, dialogHandler, dbHandler) {
    
    $scope.roles = {
        "SUPER_ADMIN":"Superadmin",
        "ADMIN":"Administratör",
        "USER":"Användare"
    }
    
    $scope.config = {
        "list":{
            "cols": {
                "username": {
                    "label":"Användarnamn",
                    "link": "/user/edit/[id]",
                    "filter":false
                }, "role_label": {
                    "label":"Roll",
                    "filter":false
                }
            },
            "pagination":1,
            "functions":{
                "deleteDialog": {
                    "postAction": {
                        "entry": {
                            "service":"user/delete",
                            "arguments": [
                                "id"
                            ]
                        }
                    }
                },
                "edit":"/user/edit/[id]"
            }
        },
        "query":{
            "service":"user/search",
            "arguments": {
                // filters 
                "order": {
                    "name":"asc"
                },
                "offset":0,
                "limit":25
            }
        }
    }
    
    if (globalParams.get('user').registry !== null) {
        $scope.config.query.arguments.filter = {
            "registry":globalParams.get('user').registry
        };
    } 
    if (globalParams.get('user').role === 'USER') {
        $scope.config.query.arguments.filter.entry = globalParams.get('user').entry;
    }
    
    var time = 0;
    $scope.$watch('config.query', function(newQuery, oldQuery) {
        if($scope.timeout)
            $timeout.cancel($scope.timeout);
        $scope.timeout = $timeout(function() {
            dbHandler
                .setQuery({"base":$scope.config.query})
                .runQuery()
                .then(function(response) {
                    angular.forEach(response.base, function (value, key) {
                        value.role_label = $scope.roles[value.role];
                        value.name = value.username;  // add name for deleteDialog
                    });
                    //console.log($scope.config.query);
                    $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
                })
                .catch(function(response) {
                    $log.error(response);
                    $location.path('/user/logout');
                });
        }, time);
        time = 200;
    }, true);
});