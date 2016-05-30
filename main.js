var regApp = angular
    .module('RegistryClient', ['ngRoute', 'ngResource', 'ui.bootstrap', 'xeditable', 'chart.js', 'ngSanitize', 'ngCsv'])
    .factory('globalParams', function($window, $location, $log, $routeParams) {
        var state;
        
        var get = function(key)
        {
            var stringValue = $window.sessionStorage.getItem('registryParams');
            var jsonValue = $window.JSON.parse(stringValue) || {};
            
            if(jsonValue[key] !== undefined)
                return jsonValue[key]
            else
                return false;
        }
        
        var set = function(key, value)
        {
            var stringValue = $window.sessionStorage.getItem('registryParams');
            var jsonValue = $window.JSON.parse(stringValue) || {};
            
            jsonValue[key] = value;
            $window.sessionStorage.setItem('registryParams', $window.JSON.stringify(jsonValue));
        }
        
        var unset = function(key)
        {
            if(key === 'all')
            {
                $window.sessionStorage.removeItem('registryParams');
            }else{
                var stringValue = $window.sessionStorage.getItem('registryParams');
                var jsonValue = $window.JSON.parse(stringValue) || {};

                delete jsonValue[key];
                $window.sessionStorage.setItem('registryParams', $window.JSON.stringify(jsonValue));
            }
        }
        
        var sendParams = function(object) {
            if(angular.isObject(object))
                state = object;
            else
                state = undefined;
        }
        
        var getParams = function() {
            return state;
        }
        
        var dateToObject = function(date)
        {
            if(date)
            {
                return {
                    "date": {
                        "year": date.getFullYear(),
                        "month": date.getMonth()+1,
                        "day": date.getDate()
                    },
                    "time": {
                        "hour": date.getHours(),
                        "minute": date.getMinutes()
                    }
                }
            }else{
                return null;
            }
        }
        
        return {
            static: {
                "types":{
                    "ASSOCIATION":"Förening",
                    "MEMBER_PERSON":"Medlem"
                },
                "datepickerPopupConfig":{
                    "uib-datepicker-popup":"dd.MM.yyyy",
                    "current-text":"Idag",
                    "clear-text":"Töm",
                    "close-text":"Stäng",
                    "on-open-focus":false
                }
            },
            get: get,
            set: set,
            sendParams: sendParams,
            getParams: getParams,
            unset: unset,
            dateToObject: dateToObject
        };
    })
    .run(function($window, $log, editableOptions) {
        editableOptions.theme = 'bs3';
    })
    .config(function($httpProvider, $routeProvider, $locationProvider) {
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8';
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $routeProvider
            .when('/registry/list', {
                templateUrl: '/template/registryList.html',
                controller: 'registryList'
            })
            .when('/stat', {
                templateUrl: '/stat_mod/statView.html',
                controller: 'statController'
            })
            .when('/registry/:id/delete', {
                template: ' ',
                controller: 'registryDelete'
            })
            .when('/registry/:id/edit', {
                templateUrl: '/template/registryEdit.html',
                controller: 'registryEdit'
            })
            .when('/registry/:id', {
                templateUrl: '/template/registryView.html',
                controller: 'registryView'
            })
            .when('/entry/list/:id?', {
                templateUrl: '/template/entryList.html',
                controller: 'entryList'
            })
            .when('/entry/:id/edit', {
                templateUrl: '/template/entryEdit.html',
                controller: 'entryEdit'
            })
            .when('/property/list/:id?', {
                templateUrl: '/template/propertyList.html',
                controller: 'propertyList'
            })
            .when('/user/login', {
                templateUrl: '/template/userLogin.html',
                controller: 'userLogin',
            })
            .when('/user/logout', {
                template: ' ',
                controller: 'userLogout',
            })
            .otherwise({
                redirectTo: '/user/login'
            });
            
        $locationProvider.html5Mode(true);
    })
    .controller('registryList', function ($scope, $routeParams, $http, $location, $window, $log, dbHandler, dialogHandler, globalParams) {
        $scope.goto = function(id) {
            dbHandler
                .getConnectionTypes(id)
                .getRegistry({"id": id})
                .runQuery()
                .then(function(response) {
                    var user = globalParams.get('user');
                    user.registry = Number(id);
                    globalParams.set('user', user);
                    globalParams.set('connectionTypes', response.connectionType);
                    globalParams.set('registry', response.registry[0]);
                    $location.path('entry/list');
                });
        }
        $scope.user = globalParams.get('user');
        
        $scope.deleteConfirm = function(item) {
            dialogHandler.deleteConfirm(item, {
                "entry": {
                    "service":"registry/delete",
                    "arguments": {
                        "id": item.id
                    }
                }
            })
        };
        
        if (globalParams.get('user').role != 'SUPER_ADMIN') {
            $location.path('entry/list');
        } else {
            dbHandler
                .getRegistries({
                    "offset":0,
                    "limit":20
                })
                .runQuery()
                .then(function(response) {
                    $scope.resource = response;
                })
                .catch(function(response) {
                    $log.error(response);
                    $location.path('/user/logout');
                });
        }
    })
    .controller('topbar', function($scope, globalParams){
        $scope.globalParams = globalParams;
    })
    .controller('registryEdit', function($scope, $routeParams, $http, $location, $log, dbHandler, globalParams) {
        $scope.routeParams = $routeParams;
        $scope.registry = {};
        
        if(Number($routeParams.id) !== -1)
        {
            dbHandler
                .getRegistry({"id":$routeParams.id})
                .runQuery()
                .then(function(response) {
                    $scope.registry = response.registry;
                })
                .catch(function(response) {
                    $log.error(response);
                    $location.path('/user/logout');
                });
        }
        $scope.submit = function() {
            var request = {
                "registry": {
                    "service":"registry/update",
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
                    $location.path('/registry/list');
                })
                .catch(function(response) {
                    $location.path('/logout');
                });
        };
    })
    .controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, globalParams, dialogHandler, dbHandler) {
        $scope.globalParams = globalParams;
        $scope.routeParams = $routeParams;
        $scope.params = {};
        $scope.headers = {
            'MEMBER_PERSON': ['ID', 'Förnamn', 'Efternamn', 'Föd.dag', 'Föd.månad', 'Föd.år', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon'],
            'ASSOCIATION': ['ID', 'Namn', 'Beskrivning', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon']
        };

		if (globalParams.get('user').role == 'USER') {
            $scope.params.type = 'MEMBER_PERSON';
        }
        
        $scope.deleteConfirm = function(item) {
            dialogHandler.deleteConfirm(item, {
                "entry": {
                    "service":"entry/delete",
                    "arguments": {
                        "id": item.id
                    }
                }
            })
        };
        
        $scope.checkProperty = function(id)
        {
            var onIndex = Number($scope.params.withProperty.indexOf(id));
            var offIndex = Number($scope.params.withoutProperty.indexOf(id));
            
            if(onIndex == -1 && offIndex == -1)
                $scope.params.withProperty.push(id);
            else if(offIndex == -1)
            {
                $scope.params.withProperty.splice(onIndex,1);
                $scope.params.withoutProperty.push(id);
            }
            else
            {
                $scope.params.withoutProperty.splice(offIndex,1);
            }
            $scope.init();
        }
        
        $scope.setAdditionals = function(id)
        {
            var onIndex = Number($scope.params.additionals.indexOf(id));
            
            if(onIndex == -1)
            {
                $scope.params.additionals = [];
                $scope.params.additionals = id;
                switch(id)
                {
                    case 'address':
                        $scope.params.includes = ['address'];
                    break;
                    case 'contact':
                        $scope.params.includes = ['address'];
                    break;
                }
            }
            else
            {
                $scope.params.includes = [];
                $scope.params.additionals = [];
            }
            
            $scope.init();
        }
        
        $scope.setSearch = function()
        {
            angular.forEach($scope.params.filter, function(val, key) {
                if(val == null || val == undefined || val == "")
                    delete $scope.params.filter[key];
            });
            $scope.params.offset = 0;
            $scope.init();
        }
        
        $scope.setType = function(type)
        {
            $scope.params.type = type;
            $scope.params.filter = {};
            $scope.params.offset = 0;
            $scope.init();
        }
        
        $scope.setLimit = function(limit)
        {
            $scope.params.limit = limit;
            $scope.init();
        }
        
        $scope.setOffset = function(offset)
        {
            $scope.params.offset = offset;
            $scope.init();
            $window.scroll(0,0);
        }
        
        $scope.go = function(location, params, savestate)
        {
            if(savestate)
                globalParams.set('entryList', $scope.params);
            else
                globalParams.unset('entryList');
            if(angular.isObject(params)) {
                if(Object.keys(params).length)
                    globalParams.sendParams(params);
            }else{
                globalParams.sendParams(undefined);
            }
            
            $location.path(location);
        }
        
        if(globalParams.get('entryList'))
        {
            $scope.params = globalParams.get('entryList');
            globalParams.unset('entryList');
        }else{
            $scope.params = {
                "type": ((globalParams.get('user').role == 'USER') ? "MEMBER_PERSON":"ASSOCIATION"),
                "limit":50,
                "offset":0,
                "withProperty":[],
                "withoutProperty":[],
                "additionals":[],
                "includes":[],
                "filter":{}
            }
        }
        
        if($routeParams.id !== undefined)
        {
            $scope.params.type = "MEMBER_PERSON";
            $scope.params.parentEntry = $routeParams.id;
            $scope.params.orgId = $routeParams.id;
        }
        
        $scope.doExport = function () {
            return dbHandler
                .parse(true)
                .getEntries({
                    "name":"entrylist",
                    "include":['address'],
                    "filter": angular.merge({
                        "withProperty":$scope.params.withProperty,
                        "withoutProperty":$scope.params.withoutProperty,
                        "class":$scope.params.class,
                        "type":$scope.params.type,
                        "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : $scope.params.parentEntry),
                    }, $scope.params.filter),
                    "order": {
                        "lastName":"asc",
                        "name":"asc"
                    }
                })
                .runQuery()
                .then(function(response) {
                    var ret = [];
                    angular.forEach(response.entrylist, function (value, key) {
                        if ($scope.params.type == 'MEMBER_PERSON') {
                            var row = [
                                value.id,
                                value.firstName,
                                value.lastName,
                                value.birthDay,
                                value.birthMonth,
                                value.birthYear,
                                ((value.address) ? value.address.street : null),
                                ((value.address) ? value.address.postalCode : null),
                                ((value.address) ? value.address.town : null),
                                ((value.address) ? value.address.country : null),
                                ((value.address) ? value.address.email : null),
                                ((value.address) ? value.address.mobile : null),
                                ((value.address) ? value.address.phone : null)
                            ];
                        } else {
                            var row = [
                                value.id,
                                value.name,
                                value.description,
                                value.bank,
                                value.account,
                                value.vat,
                                ((value.address) ? value.address.street : null),
                                ((value.address) ? value.address.postalCode : null),
                                ((value.address) ? value.address.town : null),
                                ((value.address) ? value.address.country : null),
                                ((value.address) ? value.address.email : null),
                                ((value.address) ? value.address.mobile : null),
                                ((value.address) ? value.address.phone : null)
                            ];
                        }
                        ret.push(row);
                    });
                    return ret;
                });
        }
    
        $scope.init = function()
        {
			var entry_search = {
                    "name":"entrylist",
                    "include":$scope.params.includes,
                    "limit":$scope.params.limit,
                    "offset":$scope.params.offset,
                    "order": {
                        "lastName":"asc",
                        "name":"asc"
                    }};
            entry_search.filter = $scope.params.filter;
            entry_search.filter.withProperty = $scope.params.withProperty;
            entry_search.filter.withoutProperty = $scope.params.withoutProperty;
            entry_search.filter.class = $scope.params.class;
            entry_search.filter.type = $scope.params.type;
            if (globalParams.get('user').role == 'USER') {
                if ($scope.params.type == 'ASSOCIATION') {
                    entry_search.filter.id = globalParams.get('user').entry;    
                } else {
                    entry_search.filter.parentEntry = globalParams.get('user').entry;    
                }
            } else {
                entry_search.filter.parentEntry = $scope.params.parentEntry;
            }
            
            dbHandler
                .getEntry({
                    "name":"organization",
                    "id": $scope.params.orgId
                })
                .getProperties()
                .setJoin({
                    "resource":"properties",
                    "service":"property/search",
                    "field":"id",
                    "equals":"propertyGroup",
                    "name":"children"
                })
                .getEntries(entry_search)
                .runQuery()
                .then(function(response) {
                    $scope.types = globalParams.static.types;
                    $scope.entrylist = response.entrylist;
                    $scope.organization = response.organization;
                    $scope.properties = response.properties;
                    $scope.foundCount = response.foundCount;
                    
                    if(angular.isObject($scope.properties) && $scope.params.propertyGroup === undefined)
                    {
                        angular.isObject($scope.properties[0])
                            $scope.params.propertyGroup = String($scope.properties[0].id);
                    }
                    
                    if($scope.foundCount.entrylist > 0)
                    {
                        var active = $scope.params.offset/$scope.params.limit;
                        var total = Math.ceil(Number($scope.foundCount.entrylist)/$scope.params.limit);

                        if(total < 6)
                        {
                            var lower = 0;
                            var upper = total;
                        }else if(active > 4)
                        {
                            var lower = active - 4;
                            var upper = active + 5 < total ? active + 5 : total;
                        }else if(active > total - 5 && total > 10){
                            var lower = total - 10;
                            var upper = total;
                        }else if(active < 5 && total > 9)
                        {
                            lower = 0;
                            upper = 9;
                        }else{
                            var lower = 0;
                            var upper = total;
                        }

                        var pagination = [];
                        for(i = lower; i < upper; i++)
                        {
                            var page = {};
                            page.name = i;
                            if(i == active)
                                page.class = 'active';
                            pagination.push(page);
                        }
                    }
                    $scope.pagination = pagination;
                });
        };
        
        $scope.init();
    })
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
            $scope.entry.connection[Object.keys($scope.entry.connection).length] = {
                "parentType": $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].parentType,
                "connectionType": $scope.connectionTypes[$scope.entry.type][Object.keys($scope.connectionTypes[$scope.entry.type])[0]].id,
                "parentEntry": "-",
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
    })
    .controller('propertyList', function($scope, $http, $location, $log, $routeParams, dbHandler) {
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
                            $log.log(response);
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
                            $log.log(response);
                        })
                }                
            });
    })
    .controller('userLogin', function($scope, $http, $resource, $location, $log, globalParams, dbHandler) {
        $scope.loginform = {};
        $scope.loginform.user = {};
        $scope.loginform.password = {};
        
        $scope.submit = function() {
            $scope.message = null;
            
            dbHandler
                .setUrl('login/')
                .setLogin({
                    "username":$scope.user,
                    "password":$scope.password
                })
                .then(function(response) {
                    if(response.message !== undefined)
                    {
                        $scope.message = response.message;
                    }else{
                        if(response.role == 'SUPER_ADMIN')
                            $location.path('/registry/list');
                        else{
                            dbHandler
                                .getConnectionTypes()
                                .getRegistry({"id": globalParams.get('user').registry})
                                .runQuery()
                                .then(function(response) {
                                    var user = globalParams.get('user');
                                    globalParams.set('connectionTypes', response.connectionType);
                                    globalParams.set('registry', response.registry[0]);  
                                    $location.path('entry/list');
                                });
                        }
                    }
                });
        };
    })
    .controller('userLogout', function($scope, $http, $location, $log, globalParams, dbHandler) {
        dbHandler
            .setUrl('logout/')
            .setLogout()
            .then(function(response) {
                globalParams.unset('all');
                $location.path('/user/login')      
            })
            .catch(function(response) {
                $log.error(response);
            });
    });