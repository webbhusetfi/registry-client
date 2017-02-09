angular.module('RegistryClient')
.controller('invoiceLedger', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams, invoiceCsvWriter, invoicePdfWriter, referenceNumberCalculator) {
    $scope.routeParams = $routeParams;
    $scope.globalParams = globalParams;
    $scope.config = {
        "pagination":1,
        "query":{
            "service":"entryInvoice/search",
            "arguments": {
                "include": ["entry"],
                "filter": {
                    "invoice": $routeParams.id
                },
                "order": {
                    "id": "asc"
                },
                "offset":0,
                "limit":50
            }
        }
    };

    $scope.ref = function(id) {
        return referenceNumberCalculator.calculate(id, true);
    }
    
    $scope.setPaid = function(item, value) {
        
        var paid = true;
        if (!value) {
            paid = false;
        }

        var query = {
            "invoice_upd": {
                "service":"entryInvoice/update",
                "arguments": {
                    "id": item.id,
                    "entry": item.entry.id,
                    "invoice": item.invoice,
                    "paid": paid
                }
            }
        };
                    
        dbHandler
        .setQuery(query)
        .runQuery()
        .then(function(response) {
            if (response.invoice_upd.status !== 'success') {
                 $window.alert('Ett fel uppstod!');
            }
            $scope.load();
        })
        .catch(function(response) {
            $location.path('/user/logout');
        });
    }
        
    $scope.deleteDialog = function(item) {
        //if (globalParams.get('user').role != 'USER') {
            var query = {
                "invoice_del": {
                    "service":"entryInvoice/delete",
                    "arguments": {
                        "id": item.id
                    }
                }
            };
            dialogHandler.deleteConfirm(item, query);
        //}
    }
    
    var time = 0;
    $scope.$watch('config.query', function(newQuery, oldQuery) {
        if ($scope.timeout) {
            $timeout.cancel($scope.timeout);
        }
    
        $scope.timeout = $timeout(function() {
            $scope.load();
        }, time);
        time = 200;
    }, true);
    
    $scope.load = function() {
        dbHandler
        .setQuery({"base":$scope.config.query})
        .runQuery()
        .then(function(response) {
            var combo = '';
            angular.forEach(response.base, function (value, key) {
                combo = '';
                if (value.entry.type == 'MEMBER_PERSON') {
                    combo = value.entry.firstName + ' ' + value.entry.lastName;
                } else {
                    combo = value.entry.name;
                }
                value.combined = combo;
                value.name = '(' + value.id +') ' + combo; // for deleteDialog
                value.type2 = globalParams.static.types[value.entry.type];
            });
            $scope.resource =  { "items": response.base, "foundCount": response.foundCount.base };
        })
        .catch(function(response) {
            $log.error(response);
            $location.path('/user/logout');
        });
    }
    
    $scope.back = function() {
        $window.history.back();
    }
});