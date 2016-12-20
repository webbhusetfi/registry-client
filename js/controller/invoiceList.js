angular.module('RegistryClient')
.controller('invoiceList', function ($scope, $routeParams, $http, $location, $timeout, $window, $log, dbHandler, dialogHandler, globalParams, invoiceCsvWriter, invoicePdfWriter) {

    query = {};
    query.list = {
            "service":"invoice/search",
            "arguments": {
                "filter": {
                    "registry":globalParams.get('user').registry,
                },
                "order": {
                    "name":"asc"
                }
            }
        };
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
        
    $scope.exportInvoices = function(id, type) {
        console.log(id + ' -> ' + type);
        var outquery = {};
        outquery.entryinvoice = {
                        "service": "entryInvoice/search",
                        "arguments" :{
                            "include": ["entry", "primaryAddress"],
                            "filter": {
                                "invoice": id,
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
            invoicePdfWriter.run(outquery.invoiceModel, outquery.entryinvoice);
        } else if (type == 'csv') {
            // do csv
            invoiceCsvWriter.run(outquery.entryinvoice);
        }
    }
    
    $scope.deassignInvoices = function(id) {
            alert('Not yet!');
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