angular.module('RegistryClient')
.controller('entryEdit',  function ($scope, $routeParams, $http, $log, $location, $window, globalParams, dbHandler) {
    $scope.today = new Date();
    $scope.routeParams = $routeParams;
    $scope.entryTypes = globalParams.static.types;
    $scope.meta = {};

    $scope.connectionTypes = {}
    var connectionNames = angular.merge({}, globalParams.static.types, {"UNION":"Förbund"});
    angular.forEach(globalParams.get('connectionTypes'), function(value, key) {
        if($scope.connectionTypes[value.childType] === undefined)
            $scope.connectionTypes[value.childType] = {};
        value.name = connectionNames[value.parentType];
        $scope.connectionTypes[value.childType][value.id] = value;
    });

    $scope.age = function(year, month, day) {
        if (year !== null && year !== undefined) {
            y = year.getFullYear();
            if (month !== null && month !== undefined) {
                m = month.getMonth();
            } else {
                m = 0;
            }
            if (day !== null && day !== undefined) {
                d = day.getDate();
            } else {
                d = 1;
            }
            birthday = new Date(y, m, d);
            var ageDifMs = Date.now() - birthday.getTime();
            var ageDate = new Date(ageDifMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        } else {
            return false;
        }
    };

    $scope.setCalTime = function(format, date, target) {
        switch(format)
        {
            case 'YYYY':
                if(date !== null)
                {
                    $scope.meta.birthMonth = date;
                    $scope.entry.birthYear = date.getFullYear();
                }else{
                    $scope.entry.birthYear = null;
                    $scope.meta.birthMonth = null;
                    $scope.entry.birthMonth = null;
                    $scope.entry.birthDate = null;
                    $scope.meta.birthDate = null;
                }
            break;

            case 'MM':
                if(date !== null)
                {
                    $scope.meta.birthDate = date;
                    $scope.entry.birthMonth = date.getMonth()+1;
                }else{
                    $scope.entry.birthMonth = null;
                    $scope.entry.birthDate = null;
                }
            break;
            case 'DD':
                if(date !== null)
                    $scope.entry.birthDate = date.getDate();
                else
                    $scope.entry.birthDate = null;
            break;
        }
    };

    $scope.checkProperty = function(id)
    {
        if(!$scope.entry.properties)
            $scope.entry.properties = [];
        var index = Number($scope.entry.properties.indexOf(id));
        if(index == -1)
            $scope.entry.properties.push(id);
        else
            $scope.entry.properties.splice(index,1);                
    };

    $scope.removeMembership = function(key) {
        if($scope.meta.membershipDelete === undefined)
            $scope.meta.membershipDelete = new Array();

        $scope.meta.membershipDelete.push($scope.entry.connection[key]);

        delete $scope.entry.connection[key];
        var index = 0;
        var newObject = {};
        angular.forEach($scope.entry.connection, function(value, key)
        {
            newObject[index] = $scope.entry.connection[key];
            index++;
        });
        $scope.entry.connection = newObject;
    }

    $scope.addMembership = function() {
        if(!isNaN(globalParams.get('user').entry))
        {
            var orgType = undefined;
            var orgParentTypeId = undefined;
            var orgParentId = undefined;

            angular.forEach($scope.organizations, function(value, key) {
                angular.forEach($scope.organizations[key], function(org, orgkey) {
                    if(org.id === globalParams.get('user').entry)
                    {
                        orgType = org.type;
                        orgParentId = org.id;
                        return false;
                    }
                });
                return false;
            });

            angular.forEach($scope.connectionTypes[$scope.entry.type], function(type, typekey) {
                if(orgType === type.parentType)
                    orgParentTypeId = type.id;
            });
        }

        $scope.entry.connection[Object.keys($scope.entry.connection).length] = {
            "parentType": orgType ? orgType : $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].parentType,
            "connectionType": orgParentTypeId ? orgParentTypeId : $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].id,
            "parentEntry": orgParentId ? orgParentId : "-",
            "createdAt": $scope.today,
            "fromOpen":false
        };
    };

    $scope.addContactsheet = function() {
        if($scope.entry.address === undefined)
            $scope.entry.address = {};
        $scope.entry.address[Object.keys($scope.entry.address).length] = {"country":"Finland"}
        $scope.meta.addressActive = Object.keys($scope.entry.address).length - 1;
    }

    $scope.resetOrg = function(id) {
        $scope.entry.connection[id].parentEntry = '-';
        $scope.entry.connection[id].parentType = $scope.connectionTypes[$scope.entry.type][$scope.entry.connection[id].connectionType].parentType;
    }

    dbHandler
        .getEntries({
            "name":"associations",
            "filter": {
                "type":"ASSOCIATION",
            }
        })
        .getEntries({
            "name":"unions",
            "filter": {
                "type":"UNION",
            }
        })
        .getProperties()
        .setJoin({
            "resource":"properties",
            "service":"property/search",
            "field":"id",
            "equals":"propertyGroup",
            "name":"children"
        });

    $scope.init = function() {
        if($routeParams.id == '-1')
        {
            dbHandler
                .runQuery()
                .then(function(response) {
                    $scope.connectionType = response.connectionType;
                    // fix organizations
                    $scope.organizations = {}
                    $scope.organizations['UNION'] = {"0":{"id":"-", "name":"-"}};
                    $scope.organizations['ASSOCIATION'] = {"0":{"id":"-", "name":"-"}};
                    angular.forEach(response.associations, function(org, key) {
                        $scope.organizations['ASSOCIATION'][Object.keys($scope.organizations['ASSOCIATION']).length] = org;
                    });
                    angular.forEach(response.unions, function(org, key) {
                        $scope.organizations['UNION'][Object.keys($scope.organizations['UNION']).length] = org;
                    });
                    $scope.propertyGroups = response.properties;

                    $scope.entry = {
                        "type": "MEMBER_PERSON",
                        "gender": "",
                        "connection": {},
                        "address": {}
                    };

                    $scope.meta = {
                        "addressActive": "0",
                        "address": {},
                        "birthYear": $scope.today,
                        "activeProperty": "all"
                    }

                    $scope.addMembership();
                    $scope.addContactsheet();
                });
        }else{
            dbHandler
                .getEntry({"id":$routeParams.id,"include":["properties"]})
                .setJoin({
                    "resource":"entry",
                    "service":"connection/search",
                    "field":"id",
                    "equals":"childEntry",
                    "name":"connection"
                })
                .setJoin({
                    "resource":"entry",
                    "service":"address/search",
                    "field":"id",
                    "equals":"entry",
                    "name":"address"
                })
                .runQuery()
                .then(function(response) {
                    $scope.connectionType = response.connectionType;
                    $scope.propertyGroups = response.properties;

                    // fix organizations
                    $scope.organizations = {}
                    $scope.organizations['UNION'] = {"0":{"id":"-", "name":"-"}};
                    $scope.organizations['ASSOCIATION'] = {"0":{"id":"-", "name":"-"}};                        
                    angular.forEach(response.associations, function(org, key) {
                        $scope.organizations['ASSOCIATION'][Object.keys($scope.organizations['ASSOCIATION']).length] = org;
                    });
                    angular.forEach(response.unions, function(org, key) {
                        $scope.organizations['UNION'][Object.keys($scope.organizations['UNION']).length] = org;
                    });

                    if(angular.isObject(response.entry) && angular.isObject(response.entry[0]))
                        $scope.entry = response.entry[0];
                    else
                        $scope.entry = {};

                    if($scope.entry.type == 'MEMBER_PERSON')
                    {
                        $scope.meta.birthYear = $scope.entry.birthYear ? new Date('1-1-' + $scope.entry.birthYear) : new Date();
                    }
                    $scope.meta.addressActive = 0;
                    $scope.meta.activeProperty = "all";

                    if($scope.entry.birthYear !== null)
                        $scope.meta.birthYear = new Date($scope.entry.birthYear, 1, 1);
                    if($scope.entry.birthMonth !== null)
                        $scope.meta.birthMonth = new Date($scope.entry.birthYear, $scope.entry.birthMonth-1, 1);
                    if($scope.entry.birthDay !== null)
                        $scope.meta.birthDate = new Date($scope.entry.birthYear, $scope.entry.birthMonth-1, $scope.entry.birthDay);

                    angular.forEach($scope.entry.connection, function(value, key) {
                        $scope.entry.connection[key].parentType = $scope.connectionTypes[$scope.entry.type][value.connectionType].parentType;
                    });

                    angular.forEach($scope.entry.address, function(value, key) {
                        if(value.country == null)
                        {
                            $scope.entry.address[key].country = 'Finland';
                        }
                    });

                    angular.forEach($scope.entry.connection, function(value, key) {
                        $scope.entry.connection[key].createdAt = value.createdAt ? new Date(value.createdAt) : null;
                    })
            });
        }

        $scope.submit = function() {
            var queryObject = {
                    "entry": {
                        "service":$routeParams.id == '-1' ? "entry/create" : "entry/update",
                        "arguments":{
                            "registry": globalParams.get('user').registry,
                            "type": $scope.entry.type,
                            "name": $scope.entry.name,
                            "externalId": $scope.entry.externalId,
                            "notes": $scope.entry.notes,
                            "gender": $scope.entry.gender == '' ? undefined : $scope.entry.gender,
                            "firstName": $scope.entry.firstName,
                            "lastName": $scope.entry.lastName,
                            "birthYear": $scope.entry.birthYear,
                            "birthMonth": $scope.entry.birthMonth,
                            "birthDay": $scope.entry.birthDate,
                            "notes": $scope.entry.notes,
                            "description": $scope.entry.description,
                            "properties": $scope.entry.properties
                        }
                    }
                };

            if($routeParams.id !== '-1')
                queryObject.entry.arguments.id = $scope.entry.id;

            dbHandler
                .setQuery(queryObject)
                .runQuery()
                .then(function(response) {
                    if($routeParams.id == '-1')
                    {
                        var parentId = response.entry.data.item.id;
                    }else{
                        var parentId = $routeParams.id;
                    }

                    var connections = {};

                    angular.forEach($scope.entry.connection, function(values, key) {
                        if(values.organization !== '-') {
                            connections['connection' + key] = {};
                            connections['connection' + key].arguments = {
                                    "notes" : values.notes,
                                    "createdAt" : values.createdAt,
                                    "startNotes" : values.startNotes,
                                    "endNotes" : values.endNotes,
                                    "parentEntry": values.parentEntry,
                                    "connectionType": values.connectionType
                                };

                            if(values.id !== undefined)
                            {
                                connections['connection' + key].service = 'connection/update';
                                connections['connection' + key].arguments.id = values.id;
                            }else{
                                connections['connection' + key].service = 'connection/create';
                                connections['connection' + key].arguments.childEntry = parentId;
                            }
                        }
                    });
                    if(Object.keys(connections).length > 0)
                    {
                        dbHandler
                            .setQuery(connections);
                    }

                    var address = {}
                    angular.forEach($scope.entry.address, function(values, key) {
                        address['contactsheet' + key] = {};
                        address['contactsheet' + key].arguments = {
                            "name": values.name,
                            "street": values.street,
                            "postalCode": values.postalCode,
                            "town": values.town,
                            "country": values.country,
                            "email": values.email,
                            "phone": values.phone,
                            "mobile": values.mobile,
                            "notes": values.notes
                        }

                        if(values.id !== undefined)
                        {
                            address['contactsheet' + key].service = 'address/update';
                            address['contactsheet' + key].arguments.id = values.id;
                        }else{
                            address['contactsheet' + key].service = 'address/create';
                            address['contactsheet' + key].arguments.entry = parentId;
                        }
                    });
                    
                    if($scope.meta.membershipDelete) {
                        var membershipDelete = {};
                        angular.forEach($scope.meta.membershipDelete, function(value, key) {
                            membershipDelete['membership' + key] = {
                                "service":"connection/delete",
                                "arguments":{
                                    "id":value.id
                                }
                            }
                        });
                        dbHandler
                            .setQuery(membershipDelete); 
                    }
                    
                    if(Object.keys(address).length > 0)
                    {
                        dbHandler
                            .setQuery(address);
                    }

                    dbHandler
                        .runQuery()
                        .then(function(response) {
                            $window.history.back();
                        });
                })
                .catch(function(response) {
                    $log.error(response);
                });
        };
    };
    $scope.init();
});