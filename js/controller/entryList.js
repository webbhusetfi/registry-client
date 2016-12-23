angular.module('RegistryClient')
.controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $timeout, globalParams, dialogHandler, dbHandler) {
    var userLevel = globalParams.get('user').role;
    $scope.config = {};
    
    // base configuration
    $scope.config.typeselect = {
        "types": globalParams.static.types
    };
    $scope.config.include = null;
    /*
    $scope.config.sendMail = function() {
        dialogHandler.form({
                args: {
                    title: "Skicka epost",
                    templateUrl:'template/entrySendMail.html',
                    buttons: {
                        cancel:true,
                        save: function(data) {
                            // fluff query object for mail
                            var query = _.cloneDeep($scope.config.query);
                            query.service = 'mail/create';
                            _.unset(query, 'arguments.offset');
                            _.unset(query, 'arguments.limit');
                            _.unset(query, 'arguments.order');
                            _.assign(query.arguments, {
                                "subject":data.subject,
                                "message":data.message
                            });
                            
                            // save state
                            globalParams.set('entryList.query', $scope.config.query);
                            globalParams.set('entryList.include', $scope.config.include);
                            
                            switch(globalParams.get('user.role')) {
                                case 'ADMIN':
                                case 'SUPER_ADMIN':
                                    dbHandler
                                        .setQuery({
                                            "union": {
                                                "service":"entry/search",
                                                "arguments": {
                                                    "filter": {
                                                        "registry":globalParams.get('user.registry'),
                                                        "type":"UNION"
                                                    }
                                                }
                                            }
                                        })
                                        .runQuery()
                                        .then(function(response) {
                                            if(_.isNumber(response.union[0].id)) {
                                                _.assign(query.arguments, {
                                                    "entry": $routeParams.id ? $routeParams.id : response.union[0].id
                                                })
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
                                        })
                                break;
                                
                                case 'USER':
                                    if($routeParams.id) {
                                        _.assign(query.arguments, {
                                            "entry": $routeParams.id
                                        });
                                        dbHandler
                                            .setQuery({
                                                "mail": query
                                            })
                                            .runQuery()
                                            .then(function(response) {
                                                $route.reload();
                                            })
                                            .catch(function(response) {
                                                $log.error('sending failed');
                                                $log.log(response);
                                            });
                                    }else{
                                        $log.error('no entry id for mail');
                                    }
                                break;
                            }
                        }
                    }
                }
            }, { 
                "foundCount":$scope.resource.foundCount
            });
    };
    */
    $scope.config.list = {
        "pagination":1,
        "functions":{
            "deleteDialog": {
                "postAction": {
                    "entry": {
                        "service":"entry/delete",
                        "arguments": [
                            "id"
                        ]
                    }
                }
            },
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
                    "address.phone": {
                        "label":"Mobil",
                        "filter":true
                    }
                }
            break;
        }
        return _.merge(baseCols, typeCols, addCols);
    }
    
    // default to MEMBER_PERSON when ASSOCIATION open and set parentEntry filter
    if($routeParams.id) {
        $scope.config.query.arguments.filter.parentEntry = $routeParams.id;
        $scope.config.query.arguments.filter.type = "MEMBER_PERSON";
    }    
    
    // zero timeout for first load
    var time = 0;
    // watch query parameters and update
    $scope.$watch('config.query', function(newQuery, oldQuery) {
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