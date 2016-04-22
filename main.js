var regApp = angular
    .module('RegistryClient', ['ngRoute', 'ngResource', 'ui.bootstrap', 'xeditable', 'chart.js'])
    .factory('globalParams', function($window, $location, $log, $routeParams) {
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
            var stringValue = $window.sessionStorage.getItem('registryParams');
            var jsonValue = $window.JSON.parse(stringValue) || {};
            
            delete jsonValue[key];
            $window.sessionStorage.setItem('registryParams', $window.JSON.stringify(jsonValue));            
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
            unset: unset,
            dateToObject: dateToObject,
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
            .when('/stat/', {
                templateUrl: '/stat/statView.html',
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
                resolve: {
                    defaultParams: function() {
                        return {
                            action: 'login/'
                        }
                    }
                }
            })
            .when('/user/logout', {
                template: ' ',
                controller: 'userLogout',
                resolve: {
                    defaultParams: function() {
                        return {
                            action: 'logout/'
                        }
                    }
                }
            })
            .otherwise({
                redirectTo: '/user/login'
            });
            
        $locationProvider.html5Mode(true);
    })
    .controller('registryList', function ($scope, $routeParams, $http, $location, $window, $log, dbHandler, dialogHandler, globalParams) {
        $scope.goto = function(id) {
            var user = globalParams.get('user');
            user.registry = Number(id);
            globalParams.set('user', user);
            $location.path('entry/list');
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
                $location.path('/logout');
            });
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
                    $location.path('/logout');
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
        
        $scope.go = function(location, savestate)
        {
            if(savestate)
                globalParams.set('entryList', $scope.params);
            else
                globalParams.unset('entryList');
            
            $location.path(location);
        }
        
        if(globalParams.get('entryList'))
        {
            $scope.params = globalParams.get('entryList');
            globalParams.unset('entryList');
        }else{
            $scope.params = {
                "type":"ASSOCIATION",
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
            $scope.params.type = 2;
            $scope.params.class = "PERSON";
            $scope.params.parentEntry = $routeParams.id;
            $scope.params.orgId = $routeParams.id;
        }
        
        $scope.init = function()
        {
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
                .getEntries({
                    "name":"entrylist",
                    "include":$scope.params.includes,
                    "filter": angular.merge({
                        "withProperty":$scope.params.withProperty,
                        "withoutProperty":$scope.params.withoutProperty,
                        "class":$scope.params.class,
                        "type":$scope.params.type,
                        "parentEntry":$scope.params.parentEntry,
                    }, $scope.params.filter),
                    "limit":$scope.params.limit,
                    "offset":$scope.params.offset,
                    "order": {
                        "lastName":"asc",
                        "name":"asc"
                    }
                })
                .runQuery()
                .then(function(response) {
                    $scope.entryTypes = globalParams.static.types;
                    
                    $scope.entrylist = response.entrylist;
                    $scope.organization = response.organization;
                    $scope.properties = response.propertyGroups;
                    $scope.foundCount = response.foundCount;
                    
                    if($scope.params.propertyGroup === undefined && $scope.params.propertyGroup !== undefined)
                        $scope.params.propertyGroup = Object.keys($scope.properties)[0];
                    
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
                            var page = {}
                            page.name = i;
                            if(i == active)
                                page.class = 'active';
                            pagination.push(page);
                        }
                    }
                    $scope.pagination = pagination;
                });
        }
        
        $scope.init();
    })
    .controller('entryEdit',  function ($scope, $routeParams, $http, $log, $location, $window, globalParams, dbHandler) {
        $scope.today = new Date();
        $scope.routeParams = $routeParams;
        $scope.meta = {};
        
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
        }
        
        $scope.checkProperty = function(id)
        {
            if(!$scope.entry.properties)
                $scope.entry.properties = [];
            var index = Number($scope.entry.properties.indexOf(id));
            if(index == -1)
                $scope.entry.properties.push(id);
            else
                $scope.entry.properties.splice(index,1);                
        }
        
        $scope.removeMembership = function(key) {
            if($scope.meta.membershipDelete === undefined)
                $scope.meta.membershipDelete = new Array();
            
            $scope.meta.membershipDelete.push($scope.entry.connection[key]);
            
            delete $scope.entry.connection[key];
            var index = 0;
            var newObject = {}
            angular.forEach($scope.entry.connection, function(value, key)
            {
                newObject[index] = $scope.entry.connection[key];
                index++;
            });
            $scope.entry.connection = newObject;
        }

        $scope.addMembership = function() {
            $scope.entry.connection[Object.keys($scope.entry.connection).length] = {
                "organization": "-",
                "from": $scope.today,
                "fromOpen":false,
            }
        }
        
        $scope.addContactsheet = function() {
            $scope.entry.address[Object.keys($scope.entry.address).length] = {"country":"Finland"}
            $scope.meta.addressActive = Object.keys($scope.entry.address).length - 1;
        }
        
        $scope.init = function() {
            if($routeParams.id == '-1')
            {
                dbHandler
                /*
                    .getConnectionTypes()
                    .getEntries({
                        "name":"organizations",
                        "filter": {
                            "class":"ORGANIZATION",
                            "type":[3,1]
                        }
                    })
                    .getProperties()
                */
                    .runQuery()
                    .then(function(response) {
                        $scope.entryTypes = globalParams.static.types;
                        $scope.connectionType = response.connectionType;
                        $scope.organizations = response.organizations;
                        $scope.propertyGroups = response.propertyGroups;
                        
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
                        
                        /*
                        $scope.$watch('entry.type', function() {
                            $scope.entry.class = $scope.entryTypes[$scope.entry.type].class;
                        });
                        */
                        
                        $scope.addMembership();
                        $scope.addContactsheet();
                    });
            }else{
                dbHandler
                    .getConnectionTypes()
                    .getProperties()
                    .getEntries({
                        "name":"organizations",
                        "filter": {
                            "class":"ORGANIZATION",
                            "type":[3,1]
                        }
                    })
                    .getProperties()
                    .getFullEntry($routeParams.id)
                    .runQuery()
                    .then(function(response) {
                        $scope.entryTypes = response.entryTypes;
                        $scope.connectionType = response.connectionType;
                        $scope.organizations = response.organizations;
                        $scope.propertyGroups = response.propertyGroups;
                        $scope.entry = response.fullEntry;
                        if($scope.entry.class == 'PERSON')
                        {
                            $scope.meta.birthYear = $scope.entry.birthYear ? new Date('1-1-' + $scope.entry.birthYear) : null;
                        }
                        $scope.meta.addressActive = 0;
                        $scope.meta.activeProperty = "all";
                        
                        
                        if($scope.entry.birthYear !== null)
                            $scope.meta.birthYear = new Date($scope.entry.birthYear, 1, 1);
                        if($scope.entry.birthMonth !== null)
                            $scope.meta.birthMonth = new Date($scope.entry.birthYear, $scope.entry.birthMonth-1, 1);
                        if($scope.entry.birthDay !== null)
                            $scope.meta.birthDate = new Date($scope.entry.birthYear, $scope.entry.birthMonth-1, $scope.entry.birthDay);
                        
                        angular.forEach($scope.entry.address, function(value, key) {
                            if(value.country == null)
                            {
                                $scope.entry.address[key].country = 'Finland';
                            }
                        });
                        
                        angular.forEach($scope.entry.connection, function(value, key) {
                            $scope.entry.connection[key] = {
                                "id" : value.id,
                                "organization" : String(value.parentEntry.id),
                                "from" : value.start ? new Date(value.start) : null,
                            }
                        })
                });
            }
            
            $scope.submit = function() {
                var entryQuery = {
                    "service":$routeParams.id == '-1' ? "entry/create" : "entry/update",
                    "arguments":{
                        "registry": globalParams.get('user').registry,
                        "type": $scope.entry.type,
                        "externalId": $scope.entry.externalId,
                        "notes": $scope.entry.notes,
                        "gender": $scope.entry.gender == '' ? null : $scope.entry.gender,
                        "name": $scope.entry.name,
                        "firstName": $scope.entry.firstName,
                        "lastName": $scope.entry.lastName,
                        "birthYear": $scope.entry.birthYear,
                        "birthMonth": $scope.entry.birthMonth,
                        "birthDay": $scope.entry.birthDate,
                        "notes": $scope.entry.notes,
                        "description": (($scope.entry.description === undefined) ? null : $scope.entry.description),
                        "properties": $scope.entry.properties
                    }
                }
                
                angular.forEach($scope.entry.connection, function(values, key) {
                    if(values.organization !== '-') {
                        connection['connection' + key] = {};
                        connection['connection' + key].arguments = {
                            "notes" : values.notes,
                            "start" : globalParams.dateToObject(values.from),
                            "startNotes" : values.startNotes,
                            "endNotes" : values.endNotes,
                            "parentEntry": values.organization,
                            "connectionType": $scope.connectionType[$scope.entry.type].id
                        }

                        if(values.id !== undefined)
                        {
                            connection['connection' + key].service = 'connection/update';
                            connection['connection' + key].arguments.id = values.id;
                        }else{
                            connection['connection' + key].service = 'connection/create';
                            connection['connection' + key].arguments.childEntry = entryId;
                        }
                    }
                });

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
                        address['contactsheet' + key].arguments.entry = entryId;
                    }
                });

                var subQuery = angular.merge(connection, address);
                
                
                if($routeParams.id !== '-1')
                    $scope.entryQuery.entry.arguments.id = $scope.entry.id;
                
                dbHandler
                    .setQuery(entryQuery)
                    .runQuery()
                    .then
                
                $http
                    .post(globalParams.static.apiurl, $scope.entryQuery)
                    .then(function(response)
                    {
                        var entryId = response.data.entry.data.item.id;

                        var connection = {};
                        
                        if($scope.meta.membershipDelete !== undefined)
                        {
                            var membershipDeleteQuery = {}
                            angular.forEach($scope.meta.membershipDelete, function(values, key) {
                                if(values.id !== undefined)
                                {
                                    membershipDeleteQuery['deleteconnection' + key] = {
                                        "service":"connection/delete",
                                        "arguments": {
                                            "id": values.id
                                        }
                                    }
                                }
                            });
                            subQuery = angular.merge(subQuery, membershipDeleteQuery);
                        }
                        
                        $http
                            .post(globalParams.static.apiurl, subQuery)
                            .then(function(response) {
                                $window.history.back();
                            })
                            .catch(function(response) {
                                $log.error(response)
                            });
                    })
                    .catch(function(response) {
                        $log.error(response)
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
            .runQuery()
            .then(function(response) {
                $scope.propertyGroups = response.propertyGroups;
                $log.log($scope.propertyGroups);
            });
    })
    .controller('userLogin', function($scope, $http, $resource, $location, $log, globalParams, defaultParams, dbHandler) {
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
                        else
                            $location.path('/entry/list');
                    }
                });
        };
    })
    .controller('userLogout', function($scope, $http, $location, $log, globalParams, defaultParams) {
        $http
            .post(globalParams.static.apiurl + defaultParams.action)
            .then(function() {
                globalParams.unset('user');
                $location.path('/user/login')
            })
            .catch(function(response) {
                $log.error(response);
            });
    });