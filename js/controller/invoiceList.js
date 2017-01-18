angular.module('RegistryClient')
.controller('invoiceList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams, invoiceCsvWriter, invoicePdfWriter, referenceNumberCalculator) {

    $scope.limit = 1000;
        
    $scope.init = function(query) {
        dbHandler
        .setQuery(query)
        .setJoin({
            "resource":"list",
            "service":"entryInvoice/search",
            "field":"id",
            "equals":"invoice",
            "name":"invoices"
        })
        .runQuery()
        .then(function(response) {
            $scope.list = { "items": response.list, "foundCount": response.foundCount.list };
        })
        .catch(function(response) {
            $log.error(response);
            $location.path('/user/logout');
        });    
    }
    
    query = {};
    query.list = {
        "service":"invoice/search",
        "arguments": {
            "filter": {
                "registry":globalParams.get('user').registry
            },
            "order": {
                "name":"asc"
            }
        }
    };
    
    // Add entry filter for user or admin
    if(globalParams.get('user.entry')) {
        _.assign(query.list.arguments.filter, {
            "entry": globalParams.get('user.entry')
        });
        $scope.init(query);
    } else {
        qry = {
            "owner": {
                "service":"entry/search",
                "arguments": {
                    "filter": {
                        "registry":globalParams.get('user.registry'),
                        "type":"UNION"
                    }
                }
            }
        };
        dbHandler
        .setQuery(qry)
        .runQuery()
        .then(function(response) {
            if(_.isNumber(response.owner[0].id)) {
                _.assign(query.list.arguments.filter, {
                    "entry": response.owner[0].id
                });
                $scope.init(query);
            }
        }).catch(function(response) {
            $log.error('query failed');
            $log.log(response);
        });
    }

    $scope.exportInvoices = function(id, type, pdfoffset) {
        var outquery = {};
        var offset = ((pdfoffset) ? pdfoffset : 0);
        
        outquery.entryinvoice = {
                        "service": "entryInvoice/search",
                        "arguments" :{
                            "include": ["entry", "primaryAddress"],
                            "filter": {
                                "invoice": id,
                            },
                            "order": {
                                "id": "asc"
                            }
                        }
                    };
        outquery.invoiceModel = {
                            "service": "invoice/read",
                            "arguments": {
                                "id": id
                            }
                        };
        
        if (type == 'pdf') {
            // do pdf
            outquery.entryinvoice.arguments.offset = offset;
            outquery.entryinvoice.arguments.limit = $scope.limit;
            invoicePdfWriter.run(outquery.invoiceModel, outquery.entryinvoice);
        } else if (type == 'csv') {
            // do csv
            invoiceCsvWriter.run(outquery.entryinvoice);
        }
    }
    
    $scope.goto = function(url) {
        $window.location.href = url;
    }
    
    $scope.paidCount = function(item) {
        if (item.invoices.length) {
            var paid = 0;
            angular.forEach(item.invoices, function (value, key) {
                if (value.paid) {
                    paid++;
                }
            });
            item.paidCount = paid;
            return paid;
        }
        return 0;
    }
    
    $scope.deleteDialog = function(item) {
        var query = {
                        "invoice_del": {
                            "service":"invoice/delete",
                            "arguments": {
                                "id": item.id
                            }
                        }
                    };
        dialogHandler.deleteConfirm(item, query);
    }
});