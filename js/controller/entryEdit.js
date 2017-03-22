angular.module('RegistryClient')
.controller('entryEdit',  function ($scope, $routeParams, $http, $log, $location, $window, globalParams, dbHandler, dialogHandler) {
    $scope.today = new Date();
    $scope.routeParams = $routeParams;
    $scope.globalParams = globalParams;
    $scope.entryTypes = globalParams.static.types;
    $scope.meta = {};
    // ng-form
    $scope.ngvalidation = {}
    // server
    $scope.validation = {
        "entry":{},
        "connection":{},
        "address":{}
    }
    $scope.connectionTypes = {}
    var connectionNames = globalParams.types();
    angular.forEach(globalParams.get('connectionTypes'), function(value, key) {
        if($scope.connectionTypes[value.childType] === undefined)
            $scope.connectionTypes[value.childType] = {};
        value.name = connectionNames[value.parentType];
        $scope.connectionTypes[value.childType][value.id] = value;
    });
    
    $scope.switchType = function() {
        if($scope.entry.type == 'UNION') {
            $scope.entry.connection = [];
        }else{
            if($scope.connectionTypes[$scope.entry.type]) {
                angular.forEach($scope.entry.connection, function(connection, key) {
                    _.assign($scope.entry.connection[key], {
                        "connectionType":Number(Object.keys($scope.connectionTypes[$scope.entry.type])[0]),
                        "parentEntry":"-"
                    });
                });
            }
        }
    }
    
    $scope.switchConnectionType = function(key) {
        if($scope.connectionTypes[$scope.entry.type][$scope.entry.connection[key].connectionType].parentType) {
            $scope.entry.connection[key].parentType = $scope.connectionTypes[$scope.entry.type][$scope.entry.connection[key].connectionType].parentType;
        }else{
            $scope.entry.connection[key].parentEntry = '-';
        }
    }

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
                if(date !== undefined)
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
                if(date !== undefined)
                {
                    $scope.meta.birthDate = date;
                    $scope.entry.birthMonth = date.getMonth()+1;
                }else{
                    $scope.entry.birthMonth = null;
                    $scope.entry.birthDate = null;
                }
            break;
            case 'DD':
                if(date !== undefined)
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
            $scope.meta.membershipDelete = [];
        
        if($scope.entry.connection[key].id !== undefined)
            $scope.meta.membershipDelete.push($scope.entry.connection[key]);

        $scope.entry.connection.splice(key, 1);
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
        
        $scope.entry.connection.push({
            "parentType": orgType ? orgType : $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].parentType,
            "connectionType": orgParentTypeId ? orgParentTypeId : $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].id,
            "parentEntry": orgParentId ? orgParentId : "-",
            "createdAt": $scope.today,
            "fromOpen":false
        });
        $scope.$watch('ngvalidation.connection[' + String($scope.entry.connection.length - 1) + ']', function(value) {
            if (value) {
                value.$dirty = true;
            }
        });
    };

    $scope.addAddress = function() {
        if($scope.entry.address === undefined)
            $scope.entry.address = [];
        if($scope.entry.address.length == 0) {
            var newClass = 'PRIMARY';
        }else{
            var newClass = null;
        }
        
        $scope.entry.address.push({"class":newClass,"country":"Finland"});
        $scope.meta.addressActive = $scope.entry.address.length - 1;
        $scope.$watch('ngvalidation.address[' + String($scope.entry.address.length - 1) + ']', function(value) {
            if (value) {
                value.$dirty = true;
            }
        });
    }
    
    $scope.removeAddress = function(key) {
        if($scope.entry.address.length > 1)
        {
            var type = $scope.entry.address[key].class;
            
            if($scope.meta.addressDelete === undefined)
                $scope.meta.addressDelete = [];
            if($scope.entry.address[key].id !== undefined)
                $scope.meta.addressDelete.push($scope.entry.address[key]);
            $scope.entry.address.splice(key, 1);
            $scope.meta.addressActive = 0;
            if($scope.entry.address.length == 1 || type == 'PRIMARY') {
                $scope.entry.address[0].class = 'PRIMARY';
            }
        }
    }
    
    $scope.setAddressType = function(id, type) {
        if(typeof(type) === 'string') {
            angular.forEach($scope.entry.address, function(value, key) {
                if($scope.entry.address[key].class == type)
                    $scope.entry.address[key].class = null;
            });
        };
        $scope.entry.address[id].class = type;
    };
    
    $scope.deleteEntry = function(item) {
        dialogHandler.deleteConfirm(item, {
            "entry": {
                "service":"entry/delete",
                "arguments": {
                    "id": item.id,
                    "type": item.type,
                }
            }
        });
    };

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
        .getProperties({"all":"true"});
    
    $scope.initOrganizations = function(response) {
        $scope.organizations = {};
        _.assign($scope.organizations, {
            "UNION": {"0":{"id":"-", "name":"-"}},
            "ASSOCIATION": {"0":{"id":"-", "name":"-"}}
        });
        angular.forEach(response.associations, function(org, key) {
            $scope.organizations['ASSOCIATION'][Object.keys($scope.organizations['ASSOCIATION']).length] = org;
        });
        angular.forEach(response.unions, function(org, key) {
            $scope.organizations['UNION'][Object.keys($scope.organizations['UNION']).length] = org;
        });
    }
    
    $scope.init = function() {
        if($routeParams.id == '-1')
        {
            dbHandler
                .runQuery()
                .then(function(response) {
                    $scope.connectionType = response.connectionType;
                    // fix organizations
                    $scope.initOrganizations(response);
                    $scope.propertyGroups = response.properties;

                    $scope.entry = {
                        "type": "MEMBER_PERSON",
                        "gender": undefined,
                        "firstName":"",
                        "lastName":"",
                        "connection": [],
                        "address": []
                    };

                    $scope.meta = {
                        "addressActive": "0",
                        "address": {},
                        "birthYear": null,
                        "activeProperty": "all"
                    }

                    $scope.addMembership();
                    $scope.addAddress();
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
                .setQuery({
                    "history": {
                        "service":"history/search",
                        "arguments": {
                            "filter": {
                                "entry":$routeParams.id
                            },
                            "order": {
                                "modifiedAt":"desc"
                            },
                            "limit":5
                        }
                    }
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
                    $scope.initOrganizations(response);
                    if(angular.isObject(response.entry) && angular.isObject(response.entry[0]))
                        $scope.entry = response.entry[0];
                    else
                        $scope.entry = {};

                    if(response.history) {
                        $scope.entry.history = response.history;
                    }

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
                    });
                    
                    if($scope.entry.address.length == 0) {
                        $scope.addAddress();
                    }
            });
        }

        $scope.submit = function() {
            $scope.validation = {
                "entry":{},
                "connection":{},
                "address":{}
            }
            
            var queryObject = {
                    "entry": {
                        "service": _.isNumber($scope.entry.id) ? "entry/update" : "entry/create",
                        "arguments": _.merge(
                                { "registry": globalParams.get('user').registry },
                                _.omit($scope.entry, ['address','connection'])
                            )
                        }
                    };
                    
            dbHandler
                .setQuery(queryObject)
                .runQuery()
                .then(function(response) {
                    if (response.entry.status == 'fail') {
                        $scope.validation.entry = response.entry.data;
                        return false;
                    }else{
                        $scope.entry.id = response.entry.data.item.id;
                    }

                    var connections = {};

                    angular.forEach($scope.entry.connection, function(values, key) {
                        if($scope.ngvalidation.connection && $scope.ngvalidation.connection[key] && $scope.ngvalidation.connection[key].$dirty) {
                            connections['connection' + key] = {
                                "service": _.isNumber(values.id) ? 'connection/update' : 'connection/create',
                                "arguments": _.merge({ "childEntry":$scope.entry.id }, values)
                            };

                            if(_.isNumber(values.id))
                                connections['connection' + key].arguments.id = values.id;
                        }
                    });
                    if(_.size(connections) > 0)
                        dbHandler.setQuery(connections);
                    
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
                        if(_.size(membershipDelete) > 0)
                            dbHandler.setQuery(membershipDelete); 
                    }

                    var address = {}
                    angular.forEach($scope.entry.address, function(values, key) {
                        if($scope.ngvalidation.address && $scope.ngvalidation.address[key] && $scope.ngvalidation.address[key].$dirty) {
                            address['address' + key] = {
                                "service": _.isNumber(values.id) ? "address/update" : "address/create",
                                "arguments": _.merge({
                                    "entry": $scope.entry.id
                                }, values)
                            };

                            if(_.isNumber(values.id))
                                address['address' + key].arguments.id = values.id;
                        }
                    });
                    
                    if(_.size(address) > 0)
                        dbHandler.setQuery(address);
                    
                    if($scope.meta.addressDelete) {
                        var addressDelete = {};
                        angular.forEach($scope.meta.addressDelete, function(value, key) {
                            addressDelete['membership' + key] = {
                                "service":"address/delete",
                                "arguments":{
                                    "id":value.id
                                }
                            }
                        });
                        if(_.size(addressDelete) > 0)
                            dbHandler.setQuery(addressDelete);
                    }
                    
                    dbHandler
                        .runQuery()
                        .then(function(response) {
                            _.each(response, function(val, key) {
                                if(key.indexOf('connection') == 0) {
                                    if(val.status == 'fail')
                                        $scope.validation.connection[key.replace('connection', '')] = val.data;
                                    else
                                        $scope.entry.connection[key.replace('connection', '')] = val.data.item;
                                }
                                if(key.indexOf('address') == 0) {
                                    if(val.status == 'fail')
                                        $scope.validation.address[key.replace('address', '')] = val.data;
                                    else
                                        $scope.entry.address[key.replace('address', '')] = val.data.item;
                                }
                            });
                            if(_.size($scope.validation.entry) == 0 && _.size($scope.validation.connection) == 0 && _.size($scope.validation.address) == 0)
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