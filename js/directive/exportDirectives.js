angular.module('RegistryClient')
    .directive('xgCsvExportButton', function($window, $log, $filter, $uibModal, globalParams, dbHandler) {
        return {
            template: '<a class="btn btn-default" ng-csv="doCsvExport();" quote-strings="true" ng-hide="csvExportProcessing" filename="{{ config.typeselect.types[config.query.arguments.filter.type] | lowercase }}.csv" csv-header="doCsvHeaders(config.query.arguments.filter.type)" uib-tooltip="Exportera {{ config.typeselect.types[config.query.arguments.filter.type] | lowercase }}"><i class="fa fa-download"></i></a><div class="btn btn-danger" ng-show="csvExportProcessing"><i class="fa fa-refresh fa-spin"></i></div>',
            link: function(scope) {
                scope.doCsvHeaders = function (type) {
                    scope.headers = {
                        'MEMBER_PERSON': ['ID', 'Förnamn', 'Efternamn', 'Föd.dag', 'Föd.månad', 'Föd.år', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad'],
                        'ASSOCIATION': ['ID', 'Namn', 'Beskrivning', 'Bank', 'Kontonr.', 'VAT-nr.', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad']
                    };
                    return scope.headers[type];
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
                            return ret;
                        });
                }
            }
        }
    })
    .directive('xgPdfLabelButton', function($window, $log, $uibModal, globalParams, dbHandler, PDFKit, FileSaver, Blob) {
        return {
            template: '<a class="btn btn-default" ng-hide="pdfLabelsProcessing" ng-click="doPdfLabelExport();" uib-tooltip="Exportera etiketter PDF" target="_blank"><i class="fa fa-file"></i></a><div class="btn btn-danger" ng-show="pdfLabelsProcessing"><i class="fa fa-refresh fa-spin"></i></div>',
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

                            _do = true;
                            if (response.foundCount.entrylist > 2000) {
                                msg = 'OBS! Du har valt att exportera en stor mängd poster, vill du fortsätta?\n\n' +
                                    'Beroende på antalet kan exporten kan ta länge att genomföra. ' + 
                                    'Om processen tar för lång tid kan webbläsaren meddela att sidan har stannat, välj i sådana fall att inte stänga den utan välj att fortsätt.';
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
                                scope.pdfLabelsProcessing = false;
                                scope.$digest();
                            });
                        } else {
                            scope.pdfLabelsProcessing = false;
                        }
                    });
                }
            }
        }
    });