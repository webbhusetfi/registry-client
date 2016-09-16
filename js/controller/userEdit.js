angular.module('RegistryClient')
.controller('userEdit', function($scope, $log, $routeParams, $location, globalParams, dbHandler) {
    // default roles
    $scope.roles = {
        "USER":"Användare",
        "ADMIN":"Administratör"
    }
    // add SA role
    if(globalParams.get('user').role === 'SUPER_ADMIN')
        $scope.roles['SUPER_ADMIN'] = 'Superadmin';
    
    // share parameters to scope
    var merge = {
        "routeParams":$routeParams
    }
    $scope = angular.merge($scope, merge);
    
    // prequery filter assignment
    var filter = {
        "type":"ASSOCIATION"
    }
    if(globalParams.get('user').role !== 'SUPER_ADMIN')
        filter.registry = globalParams.get('user').registry;
    
    // organization query
    dbHandler
        .setQuery({
            "organizations": {
                "service":"entry/search",
                "arguments":{
                    "filter":filter,
                    "order": {
                        "name":"asc"
                    }
                }
            }
        })
    
    // resolve main user entry data
    if($routeParams.id) {
        dbHandler
            .setQuery({
                "user": {
                    "service":"user/read",
                    "arguments": {
                        "id":$routeParams.id
                    }
                }
            });
    }else{
        $scope.user = {
            "username":"",
            "password":"",
            "role":"USER",
            "entry":"0"
        }
    }
    
    if(globalParams.get('user').role === 'SUPER_ADMIN') {
        dbHandler
            .setQuery({
                "registry":{
                    "service":"registry/search",
                    "order":{
                        "name":"asc"
                    }
                }
            })
    }
    
    dbHandler
        .runQuery()
        .then(function(response) {
            var orgs = {}
            angular.forEach(response.organizations, function(value, key) {
                if(orgs[value.registry] === undefined) {
                    orgs[value.registry] = {};
                    orgs[value.registry][0] = {
                        "id":null,
                        "name":"-"
                    }
                }
                orgs[value.registry][Object.keys(orgs[value.registry]).length + 1] = value;
            });

            $scope.organizations = orgs;
            
            if(response.registry) {
                $scope.registry = response.registry;
            }
            
            if($routeParams.id)
            {
                if(angular.isObject(response.user[0]))
                    $scope.user = response.user[0];
                else
                    $location.path('/user/list');
            }
        });
        
    $scope.submit = function() {
        var userQuery = {
            "user": {
                "service": $routeParams.id ? "user/update" : "user/create",
                "arguments": {
                    "role":$scope.user.role,
                    "username":$scope.user.username,
                    "password":$scope.user.password,
                }
            }
        }
        
        $log.log(userQuery);
    }
});