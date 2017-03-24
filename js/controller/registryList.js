angular.module('RegistryClient')
.controller('registryList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams) {
    if (globalParams.get('user').role != 'SUPER_ADMIN') {
        $location.path('/entry/list');    
    }
    globalParams.set('user', angular.merge(globalParams.get('user'), {"registry":null}));
    
    $scope.config = {
        "list":{
            "cols": {
                "name": {
                    "label":"Namn",
                    "link": "/registry/edit/[id]",
                    // "filter":true
                }
            },
            "pagination":1,
            "functions":{
                "deleteDialog": {
                    "query": {
                        "entry": {
                            "service":"registry/delete",
                            "arguments": [
                                "id"
                            ]
                        }
                    }
                },
                "edit":"/registry/edit/[id]",
                "custom":[{
                    "function": function(item) {
                        dbHandler
                            .getConnectionTypes(item.id)
                            .getRegistry({"id": item.id})
                            .runQuery()
                            .then(function(response) {
                                globalParams.set('user.registry', item.id);
                                globalParams.set('connectionTypes', response.connectionType);
                                globalParams.set('registry', response.registry[0]);
                                $window.location.href = 'entry/list';
                            });
                    },
                    "icon":"fa fa-sign-in"
                }]
            }
        },
        "query":{
            "service":"registry/search",
            "arguments": {
                "offset":0,
                "limit":25
            }
        }
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
                    $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
                })
                .catch(function(response) {
                    $log.error(response);
                    $window.location.href = '/user/logout';
                });
        }, time);
        time = 200;
    }, true);

});