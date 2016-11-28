angular.module('RegistryClient')
.controller('invoiceList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams) {
    
    $scope.config = {
        "list":{
            "cols": {
                "name": {
                    "label":"Fakturamall",
                    "link": "/invoice/edit/[id]",
                    "filter":false
                }
            },
            "pagination":1,
            "functions":{
                "deleteDialog": {
                    "postAction": {
                        "entry": {
                            "service":"invoice/delete",
                            "arguments": [
                                "id"
                            ]
                        }
                    }
                },
                "edit":"/invoice/edit/[id]",
                "custom":[{
                    "function": function(item) {
                        $location.path('/invoice/edit/-1/' + item.id);
                    },
                    "if": function(item) {
                        if (item.id) {
                            return true;
                        }
                        return false;
                    },
                    "icon":"fa fa-files-o"
                }]
            }
        },
        "query":{
            "service":"invoice/search",
            "arguments": {
                "filter": {
                    "registry":globalParams.get('user.registry'),
                },
                "offset":0,
                "limit":25,
                "order": {
                    "name":"asc"
                }
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
                    $location.path('/user/logout');
                });
        }, time);
        time = 200;
    }, true);

});