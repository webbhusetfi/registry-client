angular.module('RegistryClient')
.controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $timeout, $uibModal, globalParams, dialogHandler, dbHandler, loadOverlay) {
    $scope.routeParams = $routeParams;
    $scope.user = globalParams.get('user');
    $scope.globalParams = globalParams;
    $scope.config = {};
    
    // base configuration
    $scope.config.typeselect = {
        "types": globalParams.static.types
    };
    
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
            /*
            added in case of admin below
            "deleteDialog": {
                "postAction": {
                    "entry": {
                        "service":"entry/delete",
                        "arguments": [
                            "id",
                            "type"
                        ]
                    }
                }
            },*/
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
                        if(item.type == 'MEMBER_PERSON')
                            return false;
                        else
                            return true;
                    },
                    "icon":"fa fa-sign-in"
                }]
        }
    };
    
    if (globalParams.get('user').role != 'USER') {
        $scope.config.list.functions.deleteDialog = {
            "postAction": {
                "entry": {
                    "service":"entry/delete",
                    "arguments": [
                        "id",
                        "type"
                    ]
                }
            }
        }
    }

    $scope.config.sendMail = function() {
        var modalInstance = $uibModal.open({
            title: "Skicka epost",
            templateUrl: 'template/entrySendMail.html',
            scope: $scope,
            controller: function($scope, $uibModalInstance, $log) {
                // console.log(JSON.stringify($scope.config));
                // console.log('rp: ' + $routeParams.id);
                // console.log('entry: ' + globalParams.get('user').entry);
                // console.log("registry: " + globalParams.get('user.registry'));
                
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
               
                //console.log(JSON.stringify(qry));
                dbHandler
                .setQuery(qry)
                .runQuery()
                .then(function(response) {
                    //console.log(JSON.stringify(response));
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
                    // console.log('fc: ' + $scope.resource.foundCount.base);
                    // console.log('sender entry: ' + entry);
                    // console.log('sender name: ' + name);
      
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss();
                    }

                    $scope.go = function() {
                         if ($scope.entrySendMail.$valid) {
                            loadOverlay.enable();
                            
                            //console.log('running email...');
                                 
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
                            
                            //console.log(JSON.stringify(query));
                            // save state
                            globalParams.set('entryList.query', $scope.config.query);
                            globalParams.set('entryList.include', $scope.config.include);
                            
                            dbHandler
                            .setQuery({"mail":query})
                            .runQuery()
                            .then(function(response) {
                                $log.log(response);
                                //console.log(response);
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
        
            
            
/*
            dialogHandler.form({
                args: {
                    title: "Skicka epost",
                    templateUrl:'template/entrySendMail.html',
                    buttons: {
                        cancel:true,
                        save: function(data) {
                            // validation would be nice...
                            // fluff query object for mail
                            var query = _.cloneDeep($scope.config.query);
                            query.service = 'mail/create';
                            _.unset(query, 'arguments.offset');
                            _.unset(query, 'arguments.limit');
                            _.unset(query, 'arguments.order');
                            _.assign(query.arguments, {
                                "subject":data.subject,
                                "message":data.message,
                                "entry":data.entry
                            });
                            
                            // save state
                            globalParams.set('entryList.query', $scope.config.query);
                            globalParams.set('entryList.include', $scope.config.include);
                            
                            dbHandler
                            .setQuery({"mail":query})
                            .runQuery()
                            .then(function(response) {
                                $log.log(response);
                                // $route.reload();
                            })
                            .catch(function(response) {
                                $log.error('sending failed');
                                $log.log(response);
                            });
                        }
                    }
                }
            }, { 
                "foundCount":$scope.resource.foundCount,
                "entry": entry,
                "name": name
            });
*/

    };

    
    // set include columns (separate from query, separate handler)
    $scope.setInclude = function(include) {
        if($scope.config.include == include) {
            $scope.config.include = null;
            delete $scope.config.query.arguments.include;
        }else{
            $scope.config.include = include;
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
    if(globalParams.get('entryList')) {
        if(globalParams.get('entryList')) {
            $scope.config.query = globalParams.get('entryList.query');
            $scope.setInclude(globalParams.get('entryList.include'));
            $scope.config.query.arguments.filter.registry = globalParams.get('user.registry');
            globalParams.unset('entryList');
        }
    }else{
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
    }
    
    // function for dynamic columns
    $scope.getCols = function() {
        var baseCols = {
            "id": {
                "label":"Id",
                "width":"5%",
                "filter":true
            }
        }
        
        switch($scope.config.query.arguments.filter.type) {
            default:
            case 'ASSOCIATION':
                var typeCols = {
                    "name": {
                        "label":"Namn",
                        "link":"/entry/edit/[id]",
                        "filter":true
                    }
                }
            break;
            
            case 'MEMBER_PERSON':
                var typeCols = {
                    "firstName": {
                        "label":"Förnamn",
                        "link":"/entry/edit/[id]",
                        "filter":true
                    },
                    "lastName": {
                        "label":"Efternamn",
                        "link":"/entry/edit/[id]",
                        "filter":true
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
                        "filter":true
                    },
                    "address.postalCode": {
                        "label":"Postnummer",
                        "filter":true
                    },
                    "address.town": {
                        "label":"Postort",
                        "filter":true
                    }
                }
            break;
            
            case 'contact':
                var addCols = {
                    "address.email": {
                        "label":"Epost",
                        "filter":true
                    },
                    "address.mobile": {
                        "label":"Mobil",
                        "filter":true
                    }
                }
            break;
        }
        
        if (globalParams.get('user').role == 'USER' && $scope.config.query.arguments.filter.type == 'ASSOCIATION') {
            typeCols.name.filter = false;
            baseCols.id.filter = false;
        }
        
        return _.merge(baseCols, typeCols, addCols);
    }
    
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
    
    // zero timeout for first load
    var time = 0;
    // watch query parameters and update
    $scope.$watch('config.query', function(newQuery, oldQuery) {
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
            console.log(JSON.stringify($scope.config.query));
            dbHandler
                .setQuery({"base":$scope.config.query})
                .getProperties({"all":true})
                .runQuery()
                .then(function(response) {
                    $scope.config.list.cols = $scope.getCols();
                    $scope.properties = response.properties;
                    $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
                })
                .catch(function(response) {
                    $log.error(response);
                    $location.path('/user/logout');
                });
        }, time);
        time = 300;
    }, true);
});