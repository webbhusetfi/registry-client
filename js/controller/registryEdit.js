angular.module('RegistryClient')
.controller('registryEdit', function($scope, $routeParams, $http, $location, $log, dbHandler, globalParams) {
    $scope.routeParams = $routeParams;
    $scope.ngvalidation = {};
    $scope.registry = {};
    
    if($routeParams.id)
    {
        dbHandler
            .setQuery({
                "registry": {
                    "service":"registry/read",
                    "arguments": {
                        "id":$routeParams.id
                    }
                }
            })
            .runQuery()
            .then(function(response) {
                $scope.registry = response.registry[0];
            })
            .catch(function(response) {
                $location.path('/user/logout');
            });
    }
    $scope.submit = function() {
        var connections = {
            "conn1": {
                "parentType":"UNION",
                "childType":"ASSOCIATION"
            },
            "conn2": {
                "parentType":"UNION",
                "childType":"MEMBER_PERSON"
            },
            "conn3": {
                "parentType":"ASSOCIATION",
                "childType":"MEMBER_PERSON"
            }
        };
        
        var request = {
            "registry": {
                "service":"registry/" + ($routeParams.id ? 'update' : 'create'),
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
                if(_.isNumber(response.registry.data.item.id) && response.registry.status == 'success') {
                    var connectionQuery = {};
                    _.forEach(connections, function(value, key) {
                        connectionQuery[key]= {
                            "service":"connectionType/create",
                            "arguments": _.merge(value, {
                                "registry": response.registry.data.item.id
                            })
                        }
                        dbHandler
                            .setQuery(connectionQuery)
                            .runQuery()
                            .then(function(response) {
                                $log.log(connectionQuery);
                                $log.log(response);
                                $location.path('/registry/list');
                            });
                    });
                }else{
                    $log.error('Failed to create registry');
                }
            })
            .catch(function(response) {
                $location.path('/logout');
            });
    };
});