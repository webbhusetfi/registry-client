var regApp = angular
    .module('RegistryClient', ['ngRoute', 'ui.bootstrap', 'chart.js'])
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
                "apiurl":"http://api.registry.huset.fi/",
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
    .config(function($httpProvider, $routeProvider, $locationProvider) {
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8';
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $routeProvider
            .when('/registry/list', {
                templateUrl: '/template/registryList.html',
                controller: 'registryList',
                resolve: {
                   defaultParams: function()
                    {
                        return {
                            service: 'registry/search',
                            arguments: {
                                offset: 0,
                                limit:  20
                            }
                        };
                    }
                }
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
    .controller('registryList', function ($scope, $routeParams, $http, $location, $log, globalParams, defaultParams) {
        $scope.request = request;
        $scope.user = globalParams.get('user');
        
        $scope.goto = function(id) {
            var user = globalParams.get('user');
            user.registry = Number(id);
            globalParams.set('user', user);
            $location.path('entry/list');
        }
        
        var request = {};
        request = angular.merge(defaultParams, $routeParams);
        
        $http.post(
                globalParams.static.apiurl,
                {"request1":request}
            ).then(function(response) {
                // internal handling on successful load
                $scope.request = request;
                $scope.resource = response.data.request1.data.items;

                if(response.data.count !== undefined)
                {
                    var pagination = [];
                    for(i = 0; i < Math.ceil(response.data.count/20); i++)
                    {
                        var page = {}
                        page.name = i;
                        if(i == request.offset/request.limit)
                            page.class = 'active';
                        pagination.push(page);
                    }
                }
                $scope.resource.pagination = pagination;
            // http failure
            }).catch(function(response) {
                $location.path('/user/logout');
            });
    })
    .controller('registryEdit', function($scope, $routeParams, $http, $location, $log, globalParams) {
        $scope.routeParams = $routeParams;
        $scope.post = {};
        if(Number($routeParams.id) !== -1)
        {
            var request = {
                "request1": {
                    "service":"registry/read",
                    "arguments":{
                        "id": $routeParams.id
                    }
                }
            }
            $http
                .post(globalParams.static.apiurl, request)
                .then(function(response) {
                    $scope.post = response.data.request1.data.item;
                })
                .catch(function(response) {
                    $log.error(response);
                });
        }
        $scope.submit = function() {
            if(Number($routeParams.id) === -1)
            {
                var request = {
                    "request1": {
                        "service":"registry/create",
                        "arguments": {
                            "name":$scope.post.name.value
                        }
                    }
                }
            }
            else
            {
                var request = {
                    "request1": {
                        "service":"registry/update",
                        "arguments": {
                            "id":Number($routeParams.id),
                            "name":$scope.post.name.value
                        }
                    }
                }
            }
            
            $http
                .post(globalParams.static.apiurl, request)
                .then(function(response) {
                    $location.path('/registry/list')
                })
                .catch(function(response) {
                    $log.error(response);
                });
        };
    })
    .controller('registryDelete', function($routeParams, $http, $location, $log, globalParams) {
        var request = {
            "request1":{
                "service":"registry/delete",
                "arguments":{
                    "id":Number($routeParams.id)
                }
            }
        }
        
        $http
            .post(globalParams.static.apiurl, request)
            .then(function(response) {
                $location.path('registry/list');
            }).catch(function(response) {
                $log.error(response);
            });
    })
    .controller('entryListDelete', function($scope, $uibModalInstance, $log, item) {
        $scope.item = item;
        $scope.dismiss = function() {
            $uibModalInstance.dismiss();
        }
        
        $scope.go = function(id) {
            $uibModalInstance.close(id);
        };
    })
    .controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, globalParams, dbHandler) {
        $scope.globalParams = globalParams;
        $scope.routeParams = $routeParams;
        
        $scope.deleteConfirm = function(item)
        {
            if(item.id !== undefined)
            {
                var modalInstance = $uibModal.open({
                    templateUrl: 'template/entryListDelete.html',
                    controller: 'entryListDelete',
                    size: 'sm',
                    resolve: {
                        item: item
                    }
                });
                
                modalInstance.result.then(function (id) {
                    var deleteQuery = {
                        "entry": {
                            "service":"entry/delete",
                            "arguments": {
                                "id": id
                            }
                        }
                    }
                    $http
                        .post(globalParams.static.apiurl, deleteQuery)
                        .then(function(response) {
                            $route.reload();
                        })
                        .catch(function(response) {
                            $log.error(response);
                        });
                });
            }
        }
        
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
                delete $scope.params.additionals;
            }
            
            $scope.init();
        }
        
        if(globalParams.get('entryList'))
        {
            $scope.params = globalParams.get('entryList');
            globalParams.unset('entryList');
        }else{
            $scope.params = {
                "type":3,
                "class":"ORGANIZATION",
                "limit":50,
                "offset":0,
                "withProperty":[],
                "withoutProperty":[],
                "additionals":[],
                "includes":[]
            }
        }
        
        if($routeParams.id !== undefined)
        {
            $scope.params.type = 2;
            $scope.params.class = "PERSON";
            $scope.params.parentEntry = $routeParams.id;
            $scope.params.orgId = $routeParams.id;
        }else{
            $scope.params.orgId = 1;
        }
        
        $scope.setSearch = function(query)
        {
            if(query.length > 0)
            {
                if($scope.params.class == 'ORGANIZATION')
                {
                    $scope.entrylistAppend = {
                        "arguments":{
                            "filter":{
                                "name":query
                            },
                            "offset":0
                        }
                    }
                }else{
                    $scope.entrylistAppend = {
                        "arguments":{
                            "filter":{
                                "lastName":$scope.lastName,
                                "firstName":$scope.firstName
                            },
                            "offset":0
                        }
                    }
                }
            }
            
            $scope.init();
        }
        
        $scope.$watch('name + firstName + lastName', function(newVal) {
            angular.forEach(['name', 'firstName', 'lastName'], function(value) {
                if($scope[value] !== undefined)
                {
                    if($scope[value].length == 0)
                    {
                        delete $scope.entrylistAppend.arguments.filter[value];
                        $scope.init();
                    }
                }
            });
        });
        
        $scope.setType = function(type)
        {
            $scope.params.type = type.id;
            $scope.params.class = type.class;
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
        
        $scope.init = function()
        {
            dbHandler
                .getEntry({
                    "name":"organization",
                    "id": $scope.params.orgId
                })
                .getEntryTypes()
                .getProperties()
                .getEntries({
                    "name":"entrylist",
                    "include":$scope.params.includes,
                    "filter": {
                        "withProperty":$scope.params.withProperty,
                        "class":$scope.params.class,
                        "type":$scope.params.type,
                        "parentEntry":$scope.params.parentEntry
                    },
                    "limit":$scope.params.limit,
                    "offset":$scope.params.offset,
                    "order": {
                        "lastName":"asc",
                        "name":"asc"
                    },
                    "append":$scope.entrylistAppend
                })
                .runQuery()
                .then(function(response) {
                    $log.log(response.entrylist);
                    $scope.entrylist = response.entrylist;
                    $scope.organization = response.organization;
                    $scope.properties = response.propertyGroups;
                    $scope.entryTypes = response.entryTypes;
                    $scope.foundCount = response.foundCount;
                    
                    if($scope.params.propertyGroup === undefined)
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
        
        $scope.checkProperty = function(id)
        {
            var index = Number($scope.entry.properties.indexOf(id));
            if(index == -1)
                $scope.entry.properties.push(id);
            else
                $scope.entry.properties.splice(index,1);                
        }
        
        $scope.removeMembership = function(key) {
            if($scope.meta.membershipDelete === undefined)
                $scope.meta.membershipDelete = new Array();
            
            $scope.meta.membershipDelete.push($scope.entry.membership[key]);
            
            delete $scope.entry.membership[key];
            var index = 0;
            var newObject = {}
            angular.forEach($scope.entry.membership, function(value, key)
            {
                newObject[index] = $scope.entry.membership[key];
                index++;
            });
            $scope.entry.membership = newObject;
        }

        $scope.addMembership = function() {
            $scope.entry.connection[Object.keys($scope.entry.connection).length] = {
                    "organization": "-",
                    "status": "1",
                    "from": $scope.today,
                    "to": $scope.today,
                    "fromOpen":false,
                    "toOpen":false
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
                    .getEntryTypes()
                    .getStatusTypes()
                    .getConnectionTypes()
                    .getEntries({
                        "name":"organizations",
                        "filter": {
                            "class":"ORGANIZATION",
                            "type":[3,1]
                        }
                    })
                    .getProperties()
                    .runQuery()
                    .then(function(response) {
                        $scope.entryTypes = response.entryTypes;
                        $scope.statusTypes = response.statusTypes;
                        $scope.connectionType = response.connectionType;
                        $scope.organizations = response.organizations;
                        $scope.propertyGroups = response.propertyGroups;
                        
                        $scope.entry = {
                            "type": "3",
                            "class": "ORGANIZATION",
                            "gender": "",
                            "connection": {},
                            "address": {}
                        };

                        $scope.meta = {
                            "addressActive": "0",
                            "address": {},
                            "birthYear": $scope.today,
                            "activeProperty": Object.keys($scope.propertyGroups)[0]
                        }
                        
                        $scope.$watch('entry.type', function() {
                            $scope.entry.class = $scope.entryTypes[$scope.entry.type].class;
                        });
                        
                        $scope.addMembership();
                        $scope.addContactsheet();
                    });
            }else{
                dbHandler
                    .getEntryTypes()
                    .getStatusTypes()
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
                        $scope.statusTypes = response.statusTypes;
                        $scope.connectionType = response.connectionType;
                        $scope.organizations = response.organizations;
                        $scope.propertyGroups = response.propertyGroups;
                        $scope.entry = response.fullEntry;
                        
                        $scope.meta = {};
                        $scope.setCalTime = function(format, date, target) {
                            switch(format)
                            {
                                case 'YYYY':
                                    // virtualize ?
                                    $scope.entry.birthYear = date.getFullYear();
                                break;
                            }
                        }
                        if($scope.entry.class == 'PERSON')
                        {
                            $scope.meta.birthYear = $scope.entry.birthYear ? new Date('1-1-' + $scope.entry.birthYear) : null;
                        }
                        $scope.meta.addressActive = 0;
                        $scope.meta.activeProperty = Object.keys($scope.propertyGroups)[0];

                        
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
                                "status" : String(value.status.id),
                                "from" : value.start ? new Date(value.start) : null,
                                "to" : value.end ? new Date(value.end) : null
                            }
                        })
                });
            }
            
            $scope.submit = function() {
                $scope.entryQuery = {};
                $scope.entryQuery.entry = {
                    "service":$routeParams.id == '-1' ? "entry/create" : "entry/update",
                    "arguments":{
                        "registry": globalParams.get('user').registry,
                        "type": $scope.entry.type,
                        "externalId": $scope.entry.externalId,
                        "notes": $scope.entry.notes,
                        "class": $scope.entry.class,
                        "gender": $scope.entry.gender,
                        "firstName": $scope.entry.firstName,
                        "lastName": $scope.entry.lastName,
                        "birthYear": $scope.entry.birthYear,
                        "birthMonth": $scope.entry.birthMonth,
                        "birthDay": $scope.entry.birthDay
                    }
                }

                if($routeParams.id !== '-1')
                    $scope.entryQuery.entry.arguments.id = $scope.entry.id;

                $http
                    .post(globalParams.static.apiurl, $scope.entryQuery)
                    .then(function(response)
                    {
                        if($routeParams.id == '-1')
                            var entryId = response.data.entry.data.item.id;
                        else
                            var entryId = $scope.entry.id;

                        var membership = {};
                        angular.forEach($scope.entry.connection, function(values, key) {
                            if(values.organization !== '-') {
                                membership['membership' + key] = {};
                                membership['membership' + key].arguments = {
                                    "notes" : values.notes,
                                    "start" : globalParams.dateToObject(values.from),
                                    "end" : globalParams.dateToObject(values.to),
                                    "startNotes" : values.startNotes,
                                    "endNotes" : values.endNotes,
                                    "status" : Number(values.status),
                                    "parentEntry": values.organization,
                                    "connectionType": $scope.connectionType[$scope.entry.type].id
                                }
                            }

                            if(values.id !== undefined)
                            {
                                membership['membership' + key].service = 'connection/update';
                                membership['membership' + key].arguments.id = values.id;
                            }else{
                                membership['membership' + key].service = 'connection/create';
                                membership['membership' + key].arguments.childEntry = entryId;
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

                        var subQuery = angular.merge(membership, address);
                        
                        if($scope.meta.membershipDelete !== undefined)
                        {
                            var membershipDeleteQuery = {}
                            angular.forEach($scope.meta.membershipDelete, function(values, key) {
                                if(values.id !== undefined)
                                {
                                    membershipDeleteQuery['membership' + key] = {
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
    .controller('userLogin', function($scope, $http, $location, $log, globalParams, defaultParams) {
        $scope.loginform = {};
        $scope.loginform.user = {};
        $scope.loginform.password = {};
        
        $scope.submit = function() {
            $scope.message = null;
            var request = {
                "username":$scope.loginform.user.value,
                "password":$scope.loginform.password.value
            }
            $http.post(
                globalParams.static.apiurl + defaultParams.action,
                request)
                .then(function(response) {
                    $scope.response = response;
                    
                    if(response.data.registry == null)
                        response.data.sa = true;
                    
                    globalParams.set('user', response.data);
                    $location.path('/registry/list');
                }).catch(function(response) {
                    $scope.message = response.data.message;
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