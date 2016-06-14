angular.module('RegistryClient')
.controller('propertyList', function($scope, $http, $location, $log, $routeParams, $route, globalParams, dbHandler, dialogHandler) {
    if(globalParams.get('user').role === 'USER')
        $location.path('/entry/list/' + globalParams.get('user').entry);

    var db = dbHandler;

    if(!isNaN(Number($routeParams.id)))
        db.getProperties()
    else
        db.getProperties($routeParams.id);

    db
        .getProperties()
        .setJoin({
            "resource":"properties",
            "service":"property/search",
            "field":"id",
            "equals":"propertyGroup",
            "name":"children"
        })
        .runQuery()
        .then(function(response) {
            $scope.properties = response.properties;

            $scope.createProperty = function(item) {
                if(item.service === 'propertyGroup') {
                    var action = function(item) {
                        return {
                            "property": {
                                "service":item.service + '/create',
                                "arguments":{
                                    "name":item.name,
                                    "registry":globalParams.get('user').registry
                                }
                            }
                        }
                    }
                }else if(item.service === 'property') {
                    var action = function(item) {
                        return {
                            "property": {
                                "service":item.service + '/create',
                                "arguments":{
                                    "name":item.name,
                                    "propertyGroup":item.propertyGroup
                                }
                            }
                        }
                    }
                }

                dialogHandler.create('template/propertyCreate.html', item, action);
            }

            $scope.deleteConfirm = function(item) {
                dialogHandler.deleteConfirm(item, {
                    "property": {
                        "service": item.service + "/delete",
                        "arguments": {
                            "id": item.id
                        }
                    }
                })
            };

            $scope.updatePropertyGroup = function(data) {
                dbHandler
                    .setQuery({
                        "property":{
                            "service":"propertyGroup/update",
                            "arguments": {
                                "id":data.id,
                                "name":data.name
                            }
                        }
                    })
                    .runQuery()
                    .then(function(response) {
                    })
            }

            $scope.updateProperty = function(data) {
                dbHandler
                    .setQuery({
                        "property":{
                            "service":"property/update",
                            "arguments": {
                                "id":data.id,
                                "name":data.name
                            }
                        }
                    })
                    .runQuery()
                    .then(function(response) {
                    })
            }
        });
});