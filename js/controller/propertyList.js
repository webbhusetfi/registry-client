angular.module('RegistryClient')
.controller('propertyList', function($scope, $http, $location, $log, $routeParams, $route, $q, globalParams, dbHandler, dialogHandler) {
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

            $scope.createProperty = function(args) {
                dialogHandler.form({
                        args: {
                            title: "Skapa egenskap",
                            templateUrl:'template/propertyCreate.html',
                            buttons: {
                                cancel:true,
                                save: function(data) {
                                    if(args.service == 'propertyGroup') {
                                        dbHandler
                                            .setQuery({
                                                "property": {
                                                    "service":args.service + '/create',
                                                    "arguments": _.assign(
                                                        data,
                                                        {
                                                            "registry":globalParams.get('user.registry')
                                                        }
                                                    )
                                                }
                                            });
                                    }else{
                                        dbHandler
                                            .setQuery({
                                                "property": {
                                                    "service":args.service + '/create',
                                                    "arguments": _.assign(
                                                        data,
                                                        {
                                                            "propertyGroup":args.propertyGroup,
                                                            "registry":globalParams.get('user.registry')
                                                        }
                                                    )
                                                }
                                            });
                                    }
                                    
                                    dbHandler
                                        .runQuery()
                                        .then(function(response) {
                                            $route.reload();
                                        })
                                        .catch(function(response) {
                                            $log.error('dialog failed');
                                        });
                                }
                            }
                        }
                    }
                );
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