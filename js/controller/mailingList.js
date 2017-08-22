angular.module('RegistryClient')
.controller('mailingList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams) {

    query = {};
    query.list = {
        "service":"mail/search",
        "arguments": {
            "filter": {
                "registry":globalParams.get('user').registry,
            }, "order": {
                "id":"desc"
            }
        }
    };
        
    if(globalParams.get('user.entry')) {
        _.assign(query.list.arguments.filter, {
            "entry": globalParams.get('user.entry')
        });
    }
    
    dbHandler
    .setQuery(query)
    .setJoin({
        "resource":"list",
        "service":"entry/search",
        "field":"entry",
        "equals":"id",
        "name":"entryObject"
    })
    .runQuery()
    .then(function(response) {
        //console.log(JSON.stringify(response));
        $scope.list = { "items": response.list, "foundCount": response.foundCount.list };
    })
    .catch(function(response) {
        $log.error(response);
        $location.path('/user/logout');
    });

});