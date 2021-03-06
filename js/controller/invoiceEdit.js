angular.module('RegistryClient')
.controller('invoiceEdit', function ($scope, $routeParams, $http, $log, $location, $window, $filter, globalParams, dbHandler, dialogHandler, PDFKit, FileSaver, Blob, loadOverlay, invoicePdfWriter) {
    $scope.today = new Date();
    $scope.routeParams = $routeParams;
    $scope.globalParams = globalParams;
    $scope.role_admin = (!globalParams.get('user').entry && globalParams.get('user').role != 'USER');
    $scope.orgs = [];
    $scope.invoice = {};
    
    $scope.deleteInvoice = function(item) {
        dialogHandler.deleteConfirm(item, {
            "invoice": {
                "service":"invoice/delete",
                "arguments": {
                    "id": item.id
                }
            }
        });
    };

    $scope.init = function() {
        var query = {};
        if ($scope.role_admin) {
            query.suborgs = {
                "service": "entry/search",
                "arguments": {
                    "filter": {
                        "type": "ASSOCIATION",
                        "registry": Number(globalParams.get('user').registry)
                    }, "order": {
                        "name":"asc"
                    }
                }
            };
            query.headorg = {
                "service": "entry/search",
                "arguments": {
                    "filter": {
                        "type": "UNION",
                        "registry": Number(globalParams.get('user').registry)
                    }, "order": {
                        "name":"asc"
                    }
                }
            };
        } else {
            query.suborg =  {
                "service": "entry/read",
                "arguments": {
                    "id": globalParams.get('user').entry,
                    "registry": Number(globalParams.get('user').registry)
                }
            };
        }
        
        if ($routeParams.id !== '-1') {
            query.invoice = {
                "service": "invoice/read",
                "arguments": {
                    "id": $routeParams.id
                }
            };
        } else if ($routeParams.id == '-1' && !angular.isUndefined($routeParams.copy)) {
           query.invoice_copy = {
                "service": "invoice/read",
                "arguments": {
                    "id": $routeParams.copy
                }
            };
        }
            
        dbHandler
            .setUrl('')
            .setQuery(query)
            .parse(false)
            .runQuery()
            .then(function(response) {
                if ($scope.role_admin) {
                    if (response.headorg) {
                        if (response.headorg.data.items[0]) {
                            v = response.headorg.data.items[0];
                            v.type = globalParams.static.types[v.type];
                            $scope.orgs.push(v);
                        }
                    }
                    angular.forEach(response.suborgs.data.items, function (value, key) {
                        val = value;
                        val.type = globalParams.static.types[val.type];
                        $scope.orgs.push(val);
                    });
                } else {
                    if (response.suborg) {
                         if (response.suborg.data.items[0]) {
                            $scope.suborg = response.suborg.data.items[0];
                            if ($scope.suborg.bank) {
                                $scope.invoice.bank = $scope.suborg.bank;
                            }
                            if ($scope.suborg.account) {
                                $scope.invoice.bankAccount = $scope.suborg.account;
                            }
                         }
                    }
                }

                if (angular.isObject(response.invoice) && angular.isObject(response.invoice.data)) {
                    d = response.invoice.data;
                    d.dueAt = new Date(d.dueAt);
                    $scope.invoice = d;
                } else if (angular.isObject(response.invoice_copy) && angular.isObject(response.invoice_copy.data) && ($routeParams.id == '-1' && !angular.isUndefined($routeParams.copy))) {
                    copy = response.invoice_copy.data;
                    copy.name = 'Kopia av ' + copy.name;
                    copy.dueAt = new Date(copy.dueAt);
                    delete copy.id;
                    $scope.invoice = copy;
                }
            });
    }

    $scope.orgName = function(entry) {
        var name;
        name = '';
        angular.forEach($scope.orgs, function (org) {
            if (org.id == entry) {
                name = org.name;
            }
        });
        
        return name;
    }
    
    $scope.addBankInfo = function() {
        if ($scope.invoice.entry) {
            var query = {};
             query.suborg =  {
                    "service": "entry/read",
                    "arguments": {
                        "id": $scope.invoice.entry,
                        "registry": Number(globalParams.get('user').registry)
                    }
                };

            dbHandler
                .setUrl('')
                .setQuery(query)
                .parse(false)
                .runQuery()
                .then(function(response) {
                    if (response.suborg) {
                        if (response.suborg.data.items[0]) {
                            $scope.suborg = response.suborg.data.items[0];
                            $scope.invoice.bank = $scope.suborg.bank;
                            $scope.invoice.bankAccount = $scope.suborg.account;
                        }
                    }
                });
        }
    }
    
    $scope.submit = function() {
        if ($scope.invoiceForm.$valid) {
            var user_entry = null;
            if (!globalParams.get('user').entry && globalParams.get('user').role != 'USER') {
                user_entry = $scope.invoice.entry;
            } else {
                user_entry = globalParams.get('user').entry;
            }
            var queryObject = {
                    "invoice": {
                        "service": ($routeParams.id == '-1' ? "invoice/create" : "invoice/update"),
                        "arguments":{
                            "entry": user_entry,
                            "name": $scope.invoice.name,
                            "description": $scope.invoice.description,
                            "message": $scope.invoice.message,
                            "amount": $scope.invoice.amount,
                            "bank": $scope.invoice.bank,
                            "bankAccount": $scope.invoice.bankAccount,
                            "vat": $scope.invoice.vat,
                            "dueAt": $scope.invoice.dueAt
                        }
                    }
                };

            if ($routeParams.id !== '-1') {
                queryObject.invoice.arguments.id = $scope.invoice.id;
            }

            dbHandler
                .setQuery(queryObject)
                .runQuery()
                .then(function(response) {
                    $window.history.back();
                })
                .catch(function(response) {
                    $log.error(response);
                });
        } else {
            angular.forEach($scope.invoiceForm.$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                })
            });
        }
    };
    
    $scope.preview = function() {
        //console.log($scope.invoice);
        if ($scope.invoiceForm.$valid) {
            if ($scope.invoice.id) {
                var query = {};
                query.invoiceModel = {
                    "service": "invoice/read",
                    "arguments": {
                        "id": $routeParams.id
                    }
                };
                invoicePdfWriter.run(query.invoiceModel, null /* null defaults to example data */);
            }
        } else {
            angular.forEach($scope.invoiceForm.$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                })
            });
        }
    };
    
    $scope.previewById = function(invoiceId) {        
        if (invoiceId) {
            var query = {};
            query.invoiceModel = {
                "service": "invoice/read",
                "arguments": {
                    "id": invoiceId
                }
            };
            invoicePdfWriter.run(query.invoiceModel, null /* null defaults to example data */);
        }
    };
    
    $scope.init();
});