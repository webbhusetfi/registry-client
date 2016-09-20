angular.module('RegistryClient')
.controller('userEdit', function($scope, $log, $routeParams, $location, $window, globalParams, dbHandler) {
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
        if(globalParams.get('user').role !== 'SUPER_ADMIN')
            $scope.user.registry = globalParams.get('user').registry;
        if(globalParams.get('user').role === 'USER')
            $scope.user.entry = globalParams.get('user').entry;
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
                }
                orgs[value.registry][Object.keys(orgs[value.registry]).length] = value;
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
            }else{
                if(globalParams.get('user').role === 'SUPER_ADMIN') {
                    $scope.user.registry = $scope.registry[0].id;
                    $scope.user.entry = $scope.organizations[$scope.registry[0].id][0].id;
                }
            }
            
            // watch entry & role to prevent null
            $scope.$watch('user.entry', function(nV, oV, scope) {
                if(scope.user.role === 'USER' && nV === null)
                    scope.user.entry = scope.organizations[scope.user.registry][0].id;
            });
            $scope.$watch('user.role', function(nV, oV, scope) {
                if(nV === 'USER' && !angular.isNumber(scope.user.entry))
                    scope.user.entry = scope.organizations[scope.user.registry][0].id;
                if(nV === 'ADMIN') {
                    scope.user.entry = null;
                    if(globalParams.get('user').registry === null) {
                        scope.user.registry = scope.registry[0].id;
                    }else{
                        scope.user.registry = globalParams.get('user').registry;
                    }
                }
                if(nV === 'SUPER_ADMIN') {
                    scope.user.registry = null;
                    scope.user.entry = null;
                }
            });
        });
        
    $scope.submit = function() {
        var userQuery = {
            "user": {
                "service": $routeParams.id ? "user/update" : "user/create",
                "arguments": {
                    "role":$scope.user.role,
                    "username":$scope.user.username,
                    "password":$scope.user.password,
                    "entry":$scope.user.entry,
                    "registry": globalParams.get('user').role === 'SUPER_ADMIN' ? $scope.user.registry : globalParams.get('user').registry
                }
            }
        }
        
        if($routeParams.id)
            userQuery.user.arguments.id = $scope.user.id;
        
        dbHandler
            .setQuery(userQuery)
            .runQuery()
            .then(function(response) {
                if(response.user.status === 'success')
                    $window.history.back();
                else {
                    $scope.message = 'Det uppstod ett problem.'
                }
            });
    }
});