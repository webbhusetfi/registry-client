angular.module('RegistryClient')
.controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $timeout, $uibModal, globalParams, dialogHandler, dbHandler, loadOverlay) {
    $scope.routeParams = $routeParams;
    $scope.user = globalParams.get('user');
    $scope.globalParams = globalParams;
    $scope.config = {};

    $scope.currentEntry = {};
    if (!$routeParams.id && $scope.currentEntry.hasOwnProperty('id')) {
        $scope.currentEntry = {};
    }
    
    // base configuration
    $scope.config.typeselect = {
        "types": globalParams.types()
    };
    if ($routeParams.id) {
        _.unset($scope.config.typeselect.types, 'UNION');        
    }
    
    if (globalParams.get('user').role == 'USER') {
        _.unset($scope.config.typeselect.types, 'UNION');
        if (globalParams.get('user').entry != $routeParams.id) {
            $location.path('/entry/list/' + globalParams.get('user').entry);
            return false;
        }
    }
    
    $scope.config.include = null;

    $scope.config.list = {
        "pagination":1,
        "functions":{
            "custom":[
                {
                    "function": function(item) {
                        globalParams.set('entryList.query', $scope.config.query);
                        globalParams.set('entryList.include', $scope.config.include);
                        $location.path('/entry/edit/' + item.id);
                    },
                    "icon":"fa fa-pencil",
                    "btnclass":"btn-primary"
                },
                {
                    "function": function(item) {
                        $location.path('/entry/list/' + item.id);
                    },
                    "if": function(item) {
                        // allow "login" only for associations and admins
                        if (globalParams.get('user').role == 'USER' || item.type != 'ASSOCIATION') {
                            return false;
                        } else {
                            return true;
                        }
                    },
                    "icon":"fa fa-sign-in"
                }]
        }
    };
    
    if (globalParams.get('user').role != 'USER') {
        $scope.config.list.functions.deleteDialog = {
            "query": {
                "entry": {
                    "service":"entry/delete",
                    "arguments": [
                        "id",
                        "type"
                    ]
                }
            },
            "completed": function() {
                $scope.config.query.force_refresh = Math.random();
            }
        }
    }
    
    // set include columns (separate from query, separate handler)
    $scope.setInclude = function(include) {
        if($scope.config.include == include) {
            $scope.config.include = null;
            delete $scope.config.query.arguments.include;
        }else{
            $scope.config.include = include;
            $scope.config.query.force_refresh = Math.random();       // Force watch to trigger else columns will not update
            $scope.config.query.arguments.include = ['address'];
        }
    }
    
    // toggle empty parent value
    $scope.toggleParent = function() {
        if($scope.config.query.arguments.filter.parentEntry === null)
            delete $scope.config.query.arguments.filter.parentEntry;
        else
            $scope.config.query.arguments.filter.parentEntry = null;
    }
    
    // main query object
    if (globalParams.get('entryList')) {
        $scope.config.query = globalParams.get('entryList.query');
        $scope.setInclude(globalParams.get('entryList.include'));
        $scope.config.query.arguments.filter.registry = globalParams.get('user.registry');
        globalParams.unset('entryList');
    } else { 
        $scope.config.query = {
            "service":"entry/search",
            "arguments": {
                "filter": {
                    "type":"ASSOCIATION",
                    "registry":globalParams.get('user.registry'),
                },
                "offset":0,
                "limit":25,
                "order": {
                    "lastName":"asc",
                    "firstName":"asc",
                    "name":"asc"
                }
            }
        };
        
        // default to MEMBER_PERSON when ASSOCIATION open and set parentEntry filter
        if (globalParams.get('user').role == 'USER') {
            if (globalParams.get('user').entry) {
                $scope.config.query.arguments.filter.parentEntry = globalParams.get('user').entry;
                $scope.config.query.arguments.filter.type = "MEMBER_PERSON";
            }
        } else {
            if ($routeParams.id) {
                $scope.config.query.arguments.filter.parentEntry = $routeParams.id;
                $scope.config.query.arguments.filter.type = "MEMBER_PERSON";
            }
        }
    }
    
    // function for dynamic columns
    $scope.getCols = function() {
        var baseCols = {
            "id": {
                "label":"Id",
                "width":"5%",
                "filter":false,
                "sorter":true
            }
        }
        
        switch($scope.config.query.arguments.filter.type) {
            default:
            case 'ASSOCIATION':
                var typeCols = {
                    "name": {
                        "label":"Namn",
                        "link":"/entry/edit/[id]",
                        "filter":true,
                        "sorter":true
                    }
                }
            break;
            
            case 'MEMBER_PERSON':
                var typeCols = {
                    "firstName": {
                        "label":"Förnamn",
                        "link":"/entry/edit/[id]",
                        "filter":true,
                        "sorter":true
                    },
                    "lastName": {
                        "label":"Efternamn",
                        "link":"/entry/edit/[id]",
                        "filter":true,
                        "sorter":true
                    }
                }
            break;
        }
        
        var addCols = {};
        
        switch($scope.config.include) {
            case 'address':
                var addCols = {
                    "address.street": {
                        "label":"Adress",
                        "filter":true,
                        "sorter":true
                    },
                    "address.postalCode": {
                        "label":"Postnummer",
                        "filter":true,
                        "sorter":true
                    },
                    "address.town": {
                        "label":"Postort",
                        "filter":true,
                        "sorter":true
                    }
                }
            break;
            
            case 'contact':
                var addCols = {
                    "address.email": {
                        "label":"Epost",
                        "filter":true,
                        "sorter":true
                    },
                    "address.mobile": {
                        "label":"Mobil",
                        "filter":true,
                        "sorter":true
                    }
                }
            break;
        }
        
        if (globalParams.get('user').role == 'USER' && $scope.config.query.arguments.filter.type == 'ASSOCIATION') {
            typeCols.name.filter = false;
            baseCols.id.filter = false;
        }
        if (globalParams.get('user').role == 'ADMIN' && $routeParams.id && $scope.config.query.arguments.filter.type == 'ASSOCIATION') {
            typeCols.name.filter = false;
            baseCols.id.filter = false;
        }
        
        return _.merge(baseCols, typeCols, addCols);
    }
    
    // zero timeout for first load
    var time = 0;
    // watch query parameters and update
    $scope.$watch('config.query', function(newQuery, oldQuery) {
    
        delete $scope.config.query.force_refresh;      // remove forcerer 
        
        if (globalParams.get('user').role == 'USER') {
            if ($scope.config.query.arguments.filter.type == 'ASSOCIATION') {
                // allow view of own association in list
                $scope.config.query.arguments.filter.id = globalParams.get('user').entry;
                delete $scope.config.query.arguments.filter.parentEntry;
                //$scope.config.query.arguments.filter.parentEntry = null;
            }
            if ($scope.config.query.arguments.filter.type == 'MEMBER_PERSON') {
                // add back parentEntry of own association when viewing members in list
                delete $scope.config.query.arguments.filter.id;
                $scope.config.query.arguments.filter.parentEntry = globalParams.get('user').entry;
            }
        }
        if (globalParams.get('user').role == 'ADMIN' && $routeParams.id) {
            if ($scope.config.query.arguments.filter.type == 'ASSOCIATION') {
                // allow view of own association in list
                $scope.config.query.arguments.filter.id = $routeParams.id;
                delete $scope.config.query.arguments.filter.parentEntry;
                //$scope.config.query.arguments.filter.parentEntry = null;
            }
            if ($scope.config.query.arguments.filter.type == 'MEMBER_PERSON') {
                // add back parentEntry of own association when viewing members in list
                delete $scope.config.query.arguments.filter.id;
                $scope.config.query.arguments.filter.parentEntry = $routeParams.id;
            }
        }
        
                        
        // reset some parameters in case of type change
        if(oldQuery.arguments.filter.type) {
            if(oldQuery.arguments.filter.type !== newQuery.arguments.filter.type) {
                $scope.config.query.arguments.offset = 0;
                $scope.config.query.arguments.limit = 25;
                switch(newQuery.arguments.filter.type) {
                    case 'ASSOCIATION':
                        $scope.config.query.arguments.order = {
                            "name":"asc"
                        }
                    break;
                    case 'MEMBER_PERSON':
                        $scope.config.query.arguments.order = {
                            "lastName":"asc",
                            "firstName":"asc"
                        }
                    break;
                }
            }
        }
        if($scope.timeout)
            $timeout.cancel($scope.timeout);
        
        $scope.timeout = $timeout(function() {
            //console.log(JSON.stringify($scope.config.query));
            
            dbHandler
            .setQuery({"base":$scope.config.query})
            .getProperties({"all":true});
            
            if ($routeParams.id && !$scope.currentEntry.hasOwnProperty('id')) {
                dbHandler
                .getEntry({"id": $routeParams.id});
            }
            
            dbHandler
            .runQuery()
            .then(function(response) {
                $scope.config.list.cols = $scope.getCols();
                $scope.properties = response.properties;
                $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
                if ($routeParams.id && !$scope.currentEntry.hasOwnProperty('id')) {
                    if(_.isNumber(response.entry[0].id)) {
                        $scope.currentEntry = response.entry[0];
                    }
                }
            })
            .catch(function(response) {
                $log.error(response);
                $location.path('/user/logout');
            });
        }, time);
        time = 300;
    }, true);

    $scope.config.sendMail = function() {
        var modalInstance = $uibModal.open({
            title: "Skicka epost",
            templateUrl: 'template/entrySendMail.html',
            scope: $scope,
            controller: function($scope, $uibModalInstance, $log) {
                $scope.foundCount = $scope.resource.foundCount;
                
                var qry = {};
                if ($routeParams.id || globalParams.get('user').entry) {
                    entry = (($routeParams.id) ? $routeParams.id : globalParams.get('user').entry);
                    qry = {
                        "sender": {
                            "service":"entry/read",
                            "arguments": {
                                "id":entry,
                                "include": ['addresses'],
                                "registry":globalParams.get('user.registry')
                            }
                        }
                    };
                } else {
                    qry = {
                        "sender": {
                            "service":"entry/search",
                            "arguments": {
                                "filter": {
                                    "registry":globalParams.get('user.registry'),
                                    "type":"UNION"
                                },
                                "include": ['address']
                            }
                        }
                    };
                }
               
                dbHandler
                .setQuery(qry)
                .runQuery()
                .then(function(response) {
                    if(_.isNumber(response.sender[0].id)) {
                        $scope.entry = response.sender[0].id;
                    }
                    if(_.isString(response.sender[0].name)) {
                        $scope.name = response.sender[0].name;
                    }
                    $scope.senderEmail = null;
                    if ($routeParams.id || globalParams.get('user').entry) {
                        // addresses
                        if (_.isObject(response.sender[0].addresses)) {
                            angular.forEach(response.sender[0].addresses, function(adr) {
                                if (adr.class == 'PRIMARY' && _.isString(adr.email)) {
                                    $scope.senderEmail = adr.email;
                                }
                            });
                        }
                    } else {
                        // address
                        if (_.isObject(response.sender[0].address)) {
                            if (response.sender[0].address.class == 'PRIMARY' && _.isString(response.sender[0].address.email)) {
                                $scope.senderEmail = response.sender[0].address.email;
                            }
                        }
                    }

                    $scope.go = function() {
                         if ($scope.entrySendMail.$valid) {
                            loadOverlay.enable();
                                 
                            // fluff query object for mail
                            var query = _.cloneDeep($scope.config.query);
                            query.service = 'mail/create';
                            _.unset(query, 'arguments.offset');
                            _.unset(query, 'arguments.limit');
                            _.unset(query, 'arguments.order');
                            _.unset(query, 'arguments.include');
                            _.assign(query.arguments, {
                                "subject":$scope.subject,
                                "message":$scope.message,
                                "entry":$scope.entry,
                                "senderName":$scope.name,
                                "senderEmail":$scope.senderEmail
                            });
                            
                            // save state
                            globalParams.set('entryList.query', $scope.config.query);
                            globalParams.set('entryList.include', $scope.config.include);
                            
                            dbHandler
                            .setQuery({"mail":query})
                            .runQuery()
                            .then(function(response) {
                                // $route.reload();
                            })
                            .catch(function(response) {
                                $log.error('sending failed');
                                $log.log(response);
                            });

                            loadOverlay.disable();
                            $uibModalInstance.close();
                         } else {
                            angular.forEach($scope.entrySendMail.$error, function (field) {
                                angular.forEach(field, function(errorField){
                                    errorField.$setTouched();
                                })
                            });
                         }
                    }
                    
                }).catch(function(response) {
                    $log.error('query failed');
                    $log.log(response);
                });
            },
            size: 'md'
        });

        modalInstance.result.then(function() {

        }); 

    };    
});