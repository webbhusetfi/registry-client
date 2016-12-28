angular.module('RegistryClient')
.controller('mailingView', function ($scope, $routeParams, $http, $log, $location, $window, $filter, globalParams, dbHandler, dialogHandler, PDFKit, FileSaver, Blob, loadOverlay, invoicePdfWriter) {
    $scope.routeParams = $routeParams;
    $scope.globalParams = globalParams;

    $scope.init = function() {
        if (!angular.isUndefined($routeParams.id)) {
            var query = {};
            query.mailing =  {
                "service": "mail/read",
                "arguments": {
                    "id": $routeParams.id
                }
            };

            dbHandler
            .setUrl('')
            .setQuery(query)
            .setJoin({
                "resource":"mailing",
                "service":"entry/search",
                "field":"entry",
                "equals":"id",
                "name":"entryObject"
            })
            .parse(true)
            .runQuery()
            .then(function(response) {
                if(_.isNumber(response.mailing[0].id)) {
                    $scope.mailstatus = response.mailing[0];
                }
            });
        }
    }
    
    $scope.back = function() {
        $window.history.back();
    }
    
    $scope.init();
    
});