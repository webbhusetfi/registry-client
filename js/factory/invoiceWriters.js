angular.module('RegistryClient')
.factory('referenceNumberCalculator', ['$log', function($log) {
    var referenceNumberCalculator = {
        calculate: function(number) {
            var num = '';
            var ki = 0;
            var summa = 0;
            var kertoimet = [7, 3, 1];

            num = number+'';
            for (var i = num.length; i > 0; i--) {
                summa += num.charAt(i - 1) * kertoimet[ki++ % 3];
            }
            
            return num + (10 - (summa % 10)) % 10;
        }
    }
    
    return referenceNumberCalculator;
}])
.factory('invoiceCsvWriter', ['$log', '$filter', 'globalParams', 'dbHandler', 'FileSaver', 'loadOverlay', 'CSV', 'referenceNumberCalculator', function($log, $filter, globalParams, dbHandler, FileSaver, loadOverlay, CSV, referenceNumberCalculator) {

    var invoiceCsvWriter = {
        run: function(outQry) {
        
            var outquery = {};
            outquery.entryinvoice = outQry;
            
            dbHandler
                .parse(false)
                .setQuery(outquery)
                .runQuery()
                .then(function(response) {
                    //console.log(JSON.stringify(response));
                    // entryInvoice/search tar emot "include": ["entry", "primaryAddress"]
                    var csv_options = {};
                    csv_options.header = ['Ref.nr.', 'Betalat', 'Fakturamall ID', 'ID', 'Typ', 'Namn', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land'];
                    csv_options.quoteStrings = "true";
                    csv_options.txtDelim = '"';

                    var ret = [];                                                            
                    angular.forEach(response.entryinvoice.data.items, function (value, key) {
                        var row = {};
                        row.a = referenceNumberCalculator.calculate(value.id);
                        row.b = ((value.paid) ? 'Ja' : 'Nej');
                        row.c = value.invoice;
                        row.d = value.entry.id;
                        row.e = globalParams.static.types[value.entry.type];
                        if (value.entry.type == 'MEMBER_PERSON') {
                            row.f = value.entry.firstName + ' ' + value.entry.lastName;
                        } else {
                            row.f = value.entry.name;
                        }
                        row.g = ((value.entry.primaryAddress) ? value.entry.primaryAddress.street : null);
                        row.h = ((value.entry.primaryAddress) ? value.entry.primaryAddress.postalCode : null);
                        row.i = ((value.entry.primaryAddress) ? value.entry.primaryAddress.town : null);
                        row.j = ((value.entry.primaryAddress) ? value.entry.primaryAddress.country : null);
                        ret.push(row);
                    });  
                    
                    CSV.stringify(ret, csv_options).then(function(result){ 
                        now = new Date();
                        // globalParams.static.types[scope.config.query.arguments.filter.type] + 
                        fn = 'fakturor_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.csv';
                        var blob = new Blob([result], {type : 'text/csv'});
                        FileSaver.saveAs(blob, fn);
                    }); 
                })
                .catch(function(response) {
                    $log.error(response);
                });
        }
    }

    return invoiceCsvWriter;
                
}])
.factory('invoicePdfWriter', ['$log', '$filter', 'globalParams', 'dbHandler', 'PDFKit', 'FileSaver', 'Blob', 'loadOverlay', 'referenceNumberCalculator', function($log, $filter, globalParams, dbHandler, PDFKit, FileSaver, Blob, loadOverlay, referenceNumberCalculator) {

    var invoicePdfWriter = {
        run: function(invoiceModelQry, invoiceesQry) {
            var query = {};
            if (invoiceModelQry == undefined) {
                $log.error('Queries missing');
                return false;
            } else {
                query.invoicemodel = invoiceModelQry;
            }
            if (invoiceesQry == undefined) {
                // defaulting to example data
                $log.info('Defaulting to example data');
                invoicees = [{
                                "paid":false,
                                "id":123456,
                                "invoice": null,
                                "entry": {
                                    "externalId":"00001",
                                    "notes":null,
                                    "createdAt":"2016-01-01T10:00:00+03:00",
                                    "id":null,
                                    "gender":null,
                                    "firstName":"Mattias",
                                    "lastName":"Medlem",
                                    "birthYear":null,
                                    "birthMonth":null,
                                    "birthDay":null,
                                    "type":"MEMBER_PERSON",
                                    "createdBy":null,
                                    "registry":null,
                                    "primaryAddress":{
                                        "class":"PRIMARY",
                                        "name":null,
                                        "street":"Exempelvägen 123",
                                        "postalCode":"65100",
                                        "town":"VASA",
                                        "country":null,
                                        "email":null,
                                        "phone":null,
                                        "mobile":null,
                                        "id":null
                                    }
                                }
                            }];
            } else {
                query.invoicees = invoiceesQry;
            }
            
            dbHandler
                .parse(false)
                .setQuery(query)
                .runQuery()
                .then(function(response) {
                    if (response.invoicemodel) {
                        invoicemodel = response.invoicemodel.data;
                    }
                    if (response.invoicees) {
                        invoicees = response.invoicees.data.items;
                    }

                    var user_entry = null;
                    if (!globalParams.get('user').entry && globalParams.get('user').role != 'USER') {
                        user_entry = invoicemodel.entry;
                    } else {
                        user_entry = globalParams.get('user').entry;
                    }
                    var query2 = {};
                    query2.invoicer = {
                        "service": "entry/read",
                        "arguments": {
                            "id": user_entry,
                            "include": ["addresses"],
                            "registry": Number(globalParams.get('user').registry)
                        }
                    };
                    dbHandler
                        .parse(false)
                        .setQuery(query2)
                        .runQuery()
                        .then(function(response) {
                            if (response.invoicer.data.items[0]) {
                                invoicer = response.invoicer.data.items[0];
                            }
                            
                            if (invoicemodel == undefined || invoicees == undefined || invoicer == undefined) {
                                $log.error('Required data missing');
                                return false;
                            } else {
                                // do work...
                                var row = 14;
                                var margin = 50;
                                var fullwidth = 595 - margin*2;
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

                                angular.forEach(invoicees, function (value, key) {
                                    var current = 0;
                                    
                                    invoicee = value.entry;
                                    
                                    document.fillColor('black');
                                    document.font('Helvetica');
                                    document.fontSize(15);
                                    current += margin;
                                    document.text(invoicemodel.name, margin, current, {'width': fullwidth, 'height': row});    
                                    document.fontSize(12);
                                    document.moveTo(margin, row*5).lineTo(fullwidth+margin, row*5).stroke();
                                    current += row;
                                    current += row;
                                    
                                    if (key != 0) {
                                        document.addPage();
                                    }
                                    //console.log(invoicee);
                                    invoicee_adr = invoicee.primaryAddress; // allways entryInvoice/search
                                    /*
                                    if (invoicee.primaryAddress !== undefined) {
                                        invoicee_adr = invoicee.primaryAddress;
                                    } else if (invoicee.address !== undefined) {
                                        invoicee_adr = invoicee.address;
                                        
                                        // - TODO - primary and invoice addresses
                                        
                                        // var invoicee_adr = {};
                                        // var invoicee_adr_pri = {};
                                        // var invoicee_adr_inv = {};
                                        // angular.forEach(invoicee.addresses, function (value, key) {
                                            // if (value.class == 'PRIMARY') {
                                                // invoicee_adr_pri = value;
                                            // }
                                            // if (value.class == 'INVOICE') {
                                                // invoicee_adr_inv = value;
                                            // }
                                        // });
                                        // if (Object.keys(invoicee_adr_inv).length) {
                                            // invoicee_adr = invoicee_adr_inv;
                                        // } else {
                                            // invoicee_adr = invoicee_adr_pri;
                                        // }
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
                                    document.text($filter('date')(new Date(invoicemodel.createdAt), "d.M.yyyy"), col_2_2, current, {'width': field, 'height': row});
                                    current += row;
                                    // Förfallodatum
                                    document.text("Förfallodatum:", col_2_1, current, {'width': field, 'height': row});
                                    document.text($filter('date')(new Date(invoicemodel.dueAt), "d.M.yyyy"), col_2_2, current, {'width': field, 'height': row});

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
                                        invoicemodel.message,
                                        margin, 
                                        current, 
                                        {'width':fullwidth, 'height': row * 28});
                                    current += row*28;
                                    //document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                                    current += row;
                                    current += row;

                                    document.text("Mottagarens bank och kontonr.:", margin, current, {'width': halfpage, 'height': row});
                                    document.text(invoicemodel.bank + ', ' + invoicemodel.bankAccount, col_2_1, current, {'width': halfpage, 'height': row}); 
                                    current += row;
                                    document.text("Mottagare:", margin, current, {'width': halfpage, 'height': row});
                                    document.text(invoicer.name, col_2_1, current, {'width': halfpage, 'height': row});
                                    current += row;
                                    document.text("Meddelande:", margin, current, {'width': halfpage, 'height': row});
                                    document.text(invoicemodel.description, col_2_1, current, {'width': halfpage, 'height': row*2});
                                    current += row;
                                    current += row;
                                    current += row;
                                    document.font('Helvetica-Bold');
                                    document.text("Referensnummer: " + referenceNumberCalculator.calculate(value.id), margin, current).stroke();
                                    document.text("Summa:", col_2_1, current, {'width': halfpage, 'height': row});
                                    document.text(invoicemodel.amount, col_2_2, current, {'width': halfpage, 'height': row});
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
                                    // globalParams.static.types[scope.config.query.arguments.filter.type] + 
                                    fn = 'fakturor_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.pdf';
                                    FileSaver.saveAs(stream.toBlob('application/pdf'), fn);
                                });                           
                            }
                        })
                        .catch(function(response) {
                            $log.error(response);
                        });                            
                })
                .catch(function(response) {
                    $log.error(response);
                });
        }
    }

    return invoicePdfWriter;
                
}]);