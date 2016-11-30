angular.module('RegistryClient')
.controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, $timeout, globalParams, dialogHandler, dbHandler) {
    var userLevel = globalParams.get('user').role;
    $scope.config = {};
    // base configuration
    $scope.config.typeselect = {
        "types": globalParams.static.types
    };
    $scope.config.include = null;
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
            "edit":"/entry/edit/[id]",
            "custom":[{
                "function": function(item) {
                    globalParams.set('entryList', $scope.config.query);
                    /*
                    if(angular.isObject(params)) {
                        if(Object.keys(params).length)
                            globalParams.sendParams(params);
                    }else{
                        globalParams.sendParams(undefined);
                    }
                    */
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
    
    // main query object
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
    
    // set defaults for opened association, invokes watch & sets id
    if($routeParams.id) {
        $scope.config.query.arguments.filter.type = "MEMBER_PERSON";
    }
    
    // watch type to reset offset/limit
    $scope.$watch('config.query.arguments.filter.type', function(value) {
        $scope.config.query.arguments.offset = 0;
        $scope.config.query.arguments.limit = 25;
        $scope.config.query.arguments.filter = {
            "type":$scope.config.query.arguments.filter.type,
            "registry":globalParams.get('user').registry
        }
        if($routeParams.id) {
            $scope.config.query.arguments.filter.parentEntry = $routeParams.id;
        }
        switch(value) {
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
    });
    
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
    
    // zero timeout for first load
    var time = 0;
    // watch query parameters and update
    $scope.$watch('config', function(newQuery, oldQuery) {
        if($scope.timeout)
            $timeout.cancel($scope.timeout);
        $scope.timeout = $timeout(function() {
            dbHandler
                .setQuery({"base":$scope.config.query})
                .getProperties({"all":true})
                .runQuery()
                .then(function(response) {
                    $log.log(response);
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
    
    $scope.params = {};

    if (globalParams.get('user').role == 'USER') {
        $scope.params.type = 'MEMBER_PERSON';
    }
    
    /*
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
    
    $scope.init = function()
    {
        var entry_search = {
                "name":"entrylist",
                "include":$scope.params.includes,
                "limit":$scope.params.limit,
                "offset":$scope.params.offset,
                "order": {
                    "lastName":"asc",
                    "firstName":"asc",
                    "name":"asc"
                }};
        entry_search.filter = $scope.params.filter;
        entry_search.filter.withProperty = $scope.params.withProperty;
        entry_search.filter.withoutProperty = $scope.params.withoutProperty;
        entry_search.filter.class = $scope.params.class;
        entry_search.filter.type = $scope.params.type;
        if(globalParams.get('user').role == 'USER') {
            if($scope.params.type == 'ASSOCIATION') {
                entry_search.filter.id = globalParams.get('user').entry;    
            }else{
                entry_search.filter.parentEntry = globalParams.get('user').entry;    
            }
        }else{
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
    */
});