angular.module('RegistryClient')
.controller('invoiceEdit', function ($scope, $routeParams, $http, $log, $location, $window, $filter, globalParams, dbHandler, dialogHandler, PDFKit, FileSaver, Blob, loadOverlay) {
    $scope.today = new Date();
    $scope.routeParams = $routeParams;
    $scope.globalParams = globalParams;
    $scope.role_admin = (!globalParams.get('user').entry && globalParams.get('user').role != 'USER');
    $scope.orgs = [];
    
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
                            $scope.invoice.bank = $scope.suborg.bank;
                            $scope.invoice.bankAccount = $scope.suborg.account;
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
                } else {
                    $scope.invoice = {};
                }
                
            });
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

            //console.log(queryObject);

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
                var user_entry = null;
                if (!globalParams.get('user').entry && globalParams.get('user').role != 'USER') {
                    user_entry = $scope.invoice.entry;
                } else {
                    user_entry = globalParams.get('user').entry;
                }
                //----------------------------
                var invoicer = {};
                var invoicee = {};
                var myquery = {};
                myquery.invoicer =  {
                    "service": "entry/read",
                    "arguments": {
                        "id": user_entry,
                        "include": ["addresses"],
                        "registry": Number(globalParams.get('user').registry)
                    }
                };
                myquery.invoicee =  {
                    "service": "entry/search",
                    "arguments": {
                        "filter":{
                            "type": "MEMBER_PERSON",    
                            "registry": Number(globalParams.get('user').registry)
                        },
                        "limit":1000,
                        "include": ["address"]
                    }
                };
               
                /*
                myquery.invoicee =  {
                    "service": "entry/read",
                    "arguments": {
                        "id": 19328,
                        "include": ["addresses"],
                        "registry": Number(globalParams.get('user').registry)
                    }
                };
                */
                dbHandler
                    .parse(false)
                    .setQuery(myquery)
                    .runQuery()
                    .then(function(response) {
                        
                        invoicer = response.invoicer.data.items[0];
                        
                        var row = 14;
                        var margin = 50;
                        var fullwidth = 595 - margin*2;
                        var ref = '1234567890';
                        var col_2_1 = 300;
                        var col_2_2 = 400;
                        var halfpage = fullwidth - col_2_1 + margin;
                        var field = 100;
                    
                        var invoicer_adr = {};
                        angular.forEach(invoicer.addresses, function (value, key) {
                            if (value.class == 'PRIMARY') {
                                invoicer_adr = value;
                            }
                        });
                        var document = new PDFKit({'layout':'portrait', 'size':'A4', 'margin': margin});
                        var stream = document.pipe(new blobStream());
                    
                        // page loop
                        loadOverlay.enable();
                        angular.forEach(response.invoicee.data.items, function (value, key) {
                            invoicee = value;
                            var current = 0;
                            
                            document.fillColor('black');
                            document.font('Helvetica');
                            document.fontSize(15);
                            current += margin;
                            document.text($scope.invoice.name, margin, current, {'width': fullwidth, 'height': row});    
                            document.fontSize(12);
                            document.moveTo(margin, row*5).lineTo(fullwidth+margin, row*5).stroke();
                            current += row;
                            current += row;
                            //current = document.y;

                            
                            if (key != 0) {
                                document.addPage();
                            }
                            
                            invoicee_adr = invoicee.address;
                            /*
                            var invoicee_adr = {};
                            var invoicee_adr_pri = {};
                            var invoicee_adr_inv = {};
                            angular.forEach(invoicee.addresses, function (value, key) {
                                if (value.class == 'PRIMARY') {
                                    invoicee_adr_pri = value;
                                }
                                if (value.class == 'INVOICE') {
                                    invoicee_adr_inv = value;
                                }
                            });
                            if (Object.keys(invoicee_adr_inv).length) {
                                invoicee_adr = invoicee_adr_inv;
                            } else {
                                invoicee_adr = invoicee_adr_pri;
                            }
                            */

                            current += row;
                            // Namn
                            if (invoicee.type == 'MEMBER_PERSON') {
                                document.text(invoicee.firstName + ' ' + invoicee.lastName, margin, current, {'width': halfpage, 'height': row});
                            } else {    
                                document.text(invoicee.name, margin, current, {'width': halfpage, 'height': row});
                            }

                            // Datum 
                            document.text("Datum:", col_2_1, current, {'width': field, 'height': row});
                            document.text($filter('date')(new Date($scope.invoice.createdAt), "d.M.yyyy"), col_2_2, current, {'width': field, 'height': row});
                            current += row;
                            // Förfallodatum
                            document.text("Förfallodatum:", col_2_1, current, {'width': field, 'height': row});
                            document.text($filter('date')(new Date($scope.invoice.dueAt), "d.M.yyyy"), col_2_2, current, {'width': field, 'height': row});

                            // Adress
                            if (Object.keys(invoicee_adr).length) {
                                if (invoicee_adr.name) {
                                    document.text(invoicee_adr.name, margin, current, {'width': halfpage, 'height': row});
                                    current += row;
                                }
                                if (invoicee_adr.street) {
                                    document.text(invoicee_adr.street, margin, current, {'width': halfpage, 'height': row});
                                    current += row;
                                }
                                if (invoicee_adr.postalCode && invoicee_adr.town) {
                                    document.text(invoicee_adr.postalCode + ' ' + invoicee_adr.town, margin, current, {'width': halfpage, 'height': row});
                                    current += row;
                                }
                                if (invoicee_adr.country) {
                                    document.text(invoicee_adr.country, margin, current, {'width': halfpage, 'height': row});
                                }
                            }

                            current += row;
                            current += row;
                            current += row;
                            document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                            current += row;
                            current += row;
                            document.text(
                                $scope.invoice.message,
                                margin, 
                                current, 
                                {'width':fullwidth, 'height': row * 28});
                            current += row*28;
                            //document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                            current += row;
                            current += row;

                            document.text("Mottagarens bank och kontonr.:", margin, current, {'width': halfpage, 'height': row});
                            document.text($scope.invoice.bank + ', ' + $scope.invoice.bankAccount, col_2_1, current, {'width': halfpage, 'height': row}); 
                            current += row;
                            document.text("Mottagare:", margin, current, {'width': halfpage, 'height': row});
                            document.text(invoicer.name, col_2_1, current, {'width': halfpage, 'height': row});
                            current += row;
                            document.text("Meddelande:", margin, current, {'width': halfpage, 'height': row});
                            document.text($scope.invoice.description, col_2_1, current, {'width': halfpage, 'height': row*2});
                            current += row;
                            current += row;
                            current += row;
                            document.font('Helvetica-Bold');
                            document.text("Referensnummer: " + ref, margin, current).stroke();
                            document.text("Summa:", col_2_1, current, {'width': halfpage, 'height': row});
                            document.text($scope.invoice.amount, col_2_2, current, {'width': halfpage, 'height': row});
                            document.font('Helvetica');
                            current += row;
                            document.rect(margin-10, current-row*7, fullwidth+20, row*8).stroke()
                            current += row;
                            current += row;
                            current += row;
                            document.fontSize(10);
                            document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                            current += row;
                            document.text(invoicer.name, margin, current, {'width': halfpage, 'height': row});
                            document.text("Telefon: " + invoicer_adr.phone, col_2_1, current, {'width': halfpage, 'height': row});
                            current += row;
                            document.text(invoicer_adr.street, margin, current, {'width': halfpage, 'height': row});
                            document.text("E-post: " + invoicer_adr.email, col_2_1, current, {'width': halfpage, 'height': row});
                            current += row;
                            document.text(invoicer_adr.postalCode + ' ' + invoicer_adr.town, margin, current, {'width': halfpage, 'height': row});
                        
                        });
                        // page end
                    
                        document.end();

                        stream.on('finish', function () {
                             loadOverlay.disable()
                            now = new Date();
                            //fn = globalParams.static.types[scope.config.query.arguments.filter.type] + '_etiketter_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.pdf';
                            FileSaver.saveAs(stream.toBlob('application/pdf'), 'fooo.pdf');
                            //scope.pdfLabelsProcessing = false;
                            //scope.$digest();
                        });
                        
/*
                        console.log("INVOICER\nid: " + invoicer.id + "\n" +
                            "name: " + invoicer.name + "\n" + 
                            "account: " + invoicer.account + "\n" +
                            "bank: " + invoicer.bank + "\n" +
                            "createdAt: " + invoicer.createdAt + "\n" +
                            "createdBy: " + invoicer.createdBy + "\n" +
                            "description: " + invoicer.description + "\n" +
                            "notes: " + invoicer.notes + "\n" +
                            "registry: " + invoicer.registry + "\n" +
                            "type: " + invoicer.type + "\n" +
                            "externalId: " + invoicer.externalId + "\n" +
                            "vat: " + invoicer.vat);

                        console.log("INVOICEE\nid: " + invoicee.id + "\n" +
                            "firstName: " + invoicee.firstName + "\n" + 
                            "lastName: " + invoicee.lastName + "\n" + 
                            "birthDay: " + invoicee.birthDay + "\n" +
                            "birthMonth: " + invoicee.birthMonth + "\n" +
                            "birthYear: " + invoicee.birthYear + "\n" +
                            "createdAt: " + invoicee.createdAt + "\n" +
                            "createdBy: " + invoicee.createdBy + "\n" +
                            "externalId: " + invoicee.externalId + "\n" +
                            "gender: " + invoicee.gender + "\n" +
                            "notes: " + invoicee.notes + "\n" +
                            "registry: " + invoicee.registry + "\n" +
                            "type: " + invoicee.type + "\n");

                        console.log("INVOICE\nid: " + $scope.invoice.id + "\n" +
                            "entry: " + user_entry + "\n" +
                            "name: " + $scope.invoice.name + "\n" +
                            "description: " + $scope.invoice.description + "\n" +
                            "message: " + $scope.invoice.message + "\n" +
                            "amount: " + $scope.invoice.amount + "\n" +
                            "bank: " + $scope.invoice.bank + "\n" +
                            "bankAccount: " + $scope.invoice.bankAccount + "\n" +
                            "vat: " + $scope.invoice.vat + "\n" +
                            "dueAt: " + $scope.invoice.dueAt + "\n" +
                            "createdAt: " + $scope.invoice.createdAt);
*/
                    })
                    .catch(function(response) {
                        console.log(response);
                    });
            }
        } else {
            angular.forEach($scope.invoiceForm.$error, function (field) {
                angular.forEach(field, function(errorField){
                    errorField.$setTouched();
                })
            });
        }
    };
    
    $scope.init();
});