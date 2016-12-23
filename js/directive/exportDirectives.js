angular.module('RegistryClient')
    .directive('xgAssignInvoiceButton', function($window, $log, $filter, $uibModal, globalParams, dbHandler, loadOverlay, dialogHandler, CSV, FileSaver, invoicePdfWriter, invoiceCsvWriter) {
        return {
            template: '<a class="btn btn-default" ng-click="doAssignInvoiceDialog();" uib-tooltip="Fakturera"><i class="fa fa-sticky-note"></i></a>',
            link: function(scope) {

                scope.doAssignInvoiceDialog = function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'js/directive/template/assignInvoiceButton.html',
                        controller: function($scope, $uibModalInstance, $log) {
                            $scope.to_be_invoiced_foundcount = 0;
                            $scope.to_be_invoiced_type = scope.config.typeselect.types[scope.config.query.arguments.filter.type];
                            var query = {};
                            query.summary = {
                                "service":"entry/search",
                                "arguments":{
                                    "filter": {
                                        "registry": globalParams.get('user').registry,
                                        "withProperty":scope.config.query.arguments.filter.withProperty,
                                        "withoutProperty":scope.config.query.arguments.filter.withoutProperty,
                                        "class":scope.config.query.arguments.filter.class,
                                        "type":scope.config.query.arguments.filter.type,
                                        "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : scope.config.query.arguments.filter.parentEntry)
                                    },
                                    "order": {
                                        "lastName":"asc",
                                        "name":"asc"
                                    }
                                }
                            };
                            query.summary.arguments.filter = angular.merge(query.summary.arguments.filter, scope.config.query.arguments.filter);
                            
                            query.invoice_models = {
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
                                .parse(true)
                                .setQuery(query)
                                .runQuery()
                                .then(function(response) {
                                    $scope.to_be_invoiced_foundcount = response.foundCount.summary;
                                    if ($scope.to_be_invoiced_foundcount <= 1000) {
                                        $scope.invoice_format = 'pdf';
                                    } else {
                                        $scope.invoice_format = 'csv';
                                    }
                                    
                                    $scope.invoice_models = response.invoice_models;
                                    $scope.invoice_model = '';
                                });
                    
                            $scope.dismiss = function() {
                                $uibModalInstance.dismiss();
                            }

                            $scope.go = function() {
                                 if ($scope.assignInvoiceForm.$valid) {
                                    loadOverlay.enable();
                                    
                                    var query = {};
                                    query.summary = {
                                        "service":"entry/assignInvoice",
                                        "arguments":{
                                            "filter": {
                                                "registry": globalParams.get('user').registry,
                                                "withProperty":scope.config.query.arguments.filter.withProperty,
                                                "withoutProperty":scope.config.query.arguments.filter.withoutProperty,
                                                "class":scope.config.query.arguments.filter.class,
                                                "type":scope.config.query.arguments.filter.type,
                                                "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : scope.config.query.arguments.filter.parentEntry)
                                            },
                                            "invoice": $scope.invoice_model,
                                            "order": {
                                                "lastName":"asc",
                                                "name":"asc"
                                            }
                                        }
                                    };
                                    query.summary.arguments.filter = angular.merge(query.summary.arguments.filter, scope.config.query.arguments.filter);
                                    
                                    dbHandler
                                        .parse(false)
                                        .setQuery(query)
                                        .runQuery()
                                        .then(function(response) {
                                            if (response.summary.status == 'success') {
                                                assigned_count = response.summary.data.assigned;
                                                
                                                var outquery = {};
                                                outquery.entryinvoice = {
                                                                "service": "entryInvoice/search",
                                                                "arguments" :{
                                                                    "include": ["entry", "primaryAddress"],
                                                                    "filter": {
                                                                        "invoice": $scope.invoice_model,
                                                                    }
                                                                }
                                                            };
                                                outquery.invoiceModel = {
                                                                    "service": "invoice/read",
                                                                    "arguments": {
                                                                        "id": $scope.invoice_model
                                                                    }
                                                                };
                                                
                                                if ($scope.invoice_format == 'pdf') {
                                                    invoicePdfWriter.run(outquery.invoiceModel, outquery.entryinvoice);
                                                } else if ($scope.invoice_format == 'csv') {
                                                    invoiceCsvWriter.run(outquery.entryinvoice);
                                                }
                                                
                                            }
                                        })
                                        .catch(function(response) {
                                            $log.error(response);
                                        });
                                    loadOverlay.disable();
                                    $uibModalInstance.close();
                                 } else {
                                    angular.forEach($scope.assignInvoiceForm.$error, function (field) {
                                        angular.forEach(field, function(errorField){
                                            errorField.$setTouched();
                                        })
                                    });
                                 }
                            }
                        },
                        size: 'md'
                    });

                    modalInstance.result.then(function() {
                        
                    }); 
                };
            }
        }
    })
    .directive('xgCsvExportButton', function($window, $log, $filter, $uibModal, globalParams, dbHandler, loadOverlay) {
        return {
            template: '<a class="btn btn-default" ng-csv="doCsvExport();" quote-strings="true" ng-hide="csvExportProcessing" filename="{{ fileName(); }}" csv-header="doCsvHeaders(config.query.arguments.filter.type)" uib-tooltip="Ladda ner"><i class="fa fa-download"></i></a><div class="btn btn-danger" ng-show="csvExportProcessing"><i class="fa fa-refresh fa-spin"></i></div>',
            link: function(scope) {
                scope.doCsvHeaders = function (type) {
                    scope.headers = {
                        'MEMBER_PERSON': ['ID', 'Förnamn', 'Efternamn', 'Föd.dag', 'Föd.månad', 'Föd.år', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad'],
                        'ASSOCIATION': ['ID', 'Namn', 'Beskrivning', 'Bank', 'Kontonr.', 'VAT-nr.', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad']
                    };
                    return scope.headers[type];
                }
                
                scope.fileName = function() {
                    now = new Date();
                    fn = globalParams.static.types[scope.config.query.arguments.filter.type] + '_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.csv';
                    return fn;
                }
                
                scope.doCsvExport = function () {
                    scope.csvExportProcessing = true;                    
                    return dbHandler
                        .parse(true)
                        .getEntries({
                            "name":"entrylist",
                            "include":['address'],
                            "filter": angular.merge({
                                "withProperty":scope.config.query.arguments.filter.withProperty,
                                "withoutProperty":scope.config.query.arguments.filter.withoutProperty,
                                "class":scope.config.query.arguments.filter.class,
                                "type":scope.config.query.arguments.filter.type,
                                "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : scope.config.query.arguments.filter.parentEntry),
                            }, scope.config.query.arguments.filter),
                            "order": {
                                "lastName":"asc",
                                "name":"asc"
                            }
                        })
                        .runQuery()
                        .then(function(response) {
                            var ret = [];
                            loadOverlay.enable();
                            angular.forEach(response.entrylist, function (value, key) {
                                if (scope.config.query.arguments.filter.type == 'MEMBER_PERSON') {
                                    var row = [
                                        value.id, 
                                        value.firstName,
                                        value.lastName,
                                        value.birthDay,
                                        value.birthMonth,
                                        value.birthYear,
                                        ((value.address) ? value.address.street : null),
                                        ((value.address) ? value.address.postalCode : null),
                                        ((value.address) ? value.address.town : null),
                                        ((value.address) ? value.address.country : null),
                                        ((value.address) ? value.address.email : null),
                                        ((value.address) ? value.address.mobile : null),
                                        ((value.address) ? value.address.phone : null),
                                        $filter('date')(new Date(value.createdAt), "d.M.yyyy HH:mm")
                                    ];
                                } else {
                                    var row = [
                                        value.id,
                                        value.name,
                                        value.description,
                                        value.bank,
                                        value.account,
                                        value.vat,
                                        ((value.address) ? value.address.street : null),
                                        ((value.address) ? value.address.postalCode : null),
                                        ((value.address) ? value.address.town : null),
                                        ((value.address) ? value.address.country : null),
                                        ((value.address) ? value.address.email : null),
                                        ((value.address) ? value.address.mobile : null),
                                        ((value.address) ? value.address.phone : null),
                                         $filter('date')(new Date(value.createdAt), "d.M.yyyy HH:mm")
                                    ];
                                }
                                ret.push(row);
                            });
                            scope.csvExportProcessing = false;
                            loadOverlay.disable();
                            return ret;
                        });
                }
            }
        }
    })
    .directive('xgPdfLabelButton', function($window, $log, $uibModal, globalParams, dbHandler, PDFKit, FileSaver, Blob, loadOverlay) {
        return {
            template: '<a class="btn btn-default" ng-hide="pdfLabelsProcessing" ng-click="doPdfLabelExport();" uib-tooltip="Etiketter PDF" target="_blank"><i class="fa fa-tag"></i></a><div class="btn btn-danger" ng-show="pdfLabelsProcessing"><i class="fa fa-refresh fa-spin"></i></div>',
            link: function(scope) {
                scope.doPdfLabelExport = function () {
                    scope.pdfLabelsProcessing = true;
                    dbHandler
                        .parse(true)
                        .getEntries({
                            "name":"entrylist",
                            "include":['address'],
                            "filter": angular.merge({
                                "withProperty":scope.config.query.arguments.filter.withProperty,
                                "withoutProperty":scope.config.query.arguments.filter.withoutProperty,
                                "class":scope.config.query.arguments.filter.class,
                                "type":scope.config.query.arguments.filter.type,
                                "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : scope.config.query.arguments.filter.parentEntry),
                            }, scope.config.query.arguments.filter),
                            "order": {
                                "lastName":"asc",
                                "name":"asc"
                            }
                        })
                        .runQuery()
                        .then(function(response) {
                            loadOverlay.enable();
                            _do = true;
                            if (response.foundCount.entrylist > 2000) {
                                msg = 'OBS! Du har valt att exportera en stor mängd poster, vill du fortsätta?\n\n' +
                                    'Beroende på antalet kan exporten kan ta länge att genomföra. ' + 
                                    'Om processen tar för lång tid kan webbläsaren meddela att sidan har stannat, välj i sådana fall att inte stänga den utan välj att fortsätta.';
                                _do = confirm(msg);
                            }

                            if (_do) {
                                var document = new PDFKit({'layout':'portrait', 'size':'A4', 'margin': 30});
                                var stream = document.pipe(new blobStream());

                                document.fontSize(10);
                                document.fillColor('black');

                                row_default = -1;
                                col_default = 0;
                                row = row_default;
                                col = col_default;

                                angular.forEach(response.entrylist, function (value, key) {
                                    label_data = '';
                                    if (scope.config.query.arguments.filter.type == 'MEMBER_PERSON') {
                                        label_data = value.firstName + ' ' + value.lastName + '\n';
                                        if (value.address) {
                                            if (value.address.street) {
                                                label_data += value.address.street + '\n';
                                            }
                                            if (value.address.postalCode) {
                                                label_data += value.address.postalCode + ' ';
                                            }
                                            if (value.address.town) {
                                                label_data += value.address.town + '\n';
                                            }
                                            if (value.address.country) {
                                                label_data += value.address.country;
                                            }
                                        }
                                    } else {
                                        label_data = value.name + '\n';
                                        if (value.address) {
                                            if (value.address.street) {
                                                label_data += value.address.street + '\n';
                                            }
                                            if (value.address.postalCode) {
                                                label_data += value.address.postalCode + ' ';
                                            }
                                            if (value.address.town) {
                                                label_data += value.address.town + '\n';
                                            }
                                            if (value.address.country) {
                                                label_data += value.address.country;
                                            }
                                        }
                                }
                                if (key != 0 && (key % 24 === 0)) {
                                    document.addPage();
                                    row = row_default;
                                    col = col_default;
                                }
                                if (key % 3 === 0) {
                                    three = true;
                                    row++;
                                    col = 0;
                                } else {
                                    three = false;
                                    col++;
                                }

                                document.text(
                                    label_data,
                                    (col * 201)+30, 
                                    ((row*103)+30), 
                                    {'width':160});    
                            });

                            document.end();

                            stream.on('finish', function () {
                                now = new Date();
                                fn = globalParams.static.types[scope.config.query.arguments.filter.type] + '_etiketter_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.pdf';
                                FileSaver.saveAs(stream.toBlob('application/pdf'), fn);
                                scope.$digest();
                            });
                        }
                        scope.pdfLabelsProcessing = false;
                        loadOverlay.disable();
                    });
                }
            }
        }
    });