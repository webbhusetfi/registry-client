angular.module('RegistryClient')
.controller('navigation', function($scope, $routeParams, $log, $window, dbHandler, globalParams){
    /*
    if(globalParams.get('user').registry === null) {
        globalParams.unset('registry');
    }else{
        dbHandler
            .setQuery({
                "registry": {
                    "service":"registry/read",
                    "arguments":{
                        "id":globalParams.get('user').registry
                    }
                }
            })
    }
    if(globalParams.get('user').entry === null) {
        globalParams.unset('entry');
    }else{
        dbHandler
            .setQuery({
                "entry": {
                    "service":"entry/read",
                    "arguments":{
                        "id":globalParams.get('user').entry
                    }
                }
            })
    }
    
    dbHandler
        .runQuery()
        .then(function(response) {
            $log.log(response);
        });
    */
    
    $scope.user = globalParams.get('user');
    $scope.globalParams = globalParams;
    $scope.routeParams = $routeParams;
});