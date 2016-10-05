angular.module('RegistryClient')
.controller('registryList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams) {
    if (globalParams.get('user').role != 'SUPER_ADMIN')
        $location.path('entry/list');    
    globalParams.set('user', angular.merge(globalParams.get('user'), {"registry":null}));
    
    $scope.config = {
        "params":{
            "pagination":1,
            "functions":{
                "deleteDialog": {
                    "postAction": {
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
                    "directive":"xg-open-registry",
                    "params": [
                        "id"
                    ]
                }]
            }
        },
        "cols": [{
            "name":"name",
            "label":"Namn",
            "link": "/registry/edit/[id]",
            "filter":true
        }],
        "query":{
            "base": {
                "service":"registry/search",
                "arguments": {
                    "offset":0,
                    "limit":20
                }
            }
        }
    }
    $scope.$watch('config.query', function(newQuery, oldQuery) {
        if($scope.timeout)
            $timeout.cancel($scope.timeout);
        $scope.timeout = $timeout(function() {
            dbHandler
                .setQuery($scope.config.query)
                .runQuery()
                .then(function(response) {
                    $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
                })
                .catch(function(response) {
                    $log.error(response);
                    $location.path('/user/logout');
                });
        }, 500);
    }, true);

});