angular.module('RegistryClient')
.factory('referenceNumberCalculator', ['$log', function($log) {
    var referenceNumberCalculator = {
        calculate: function(number, only_control) {
            var num = '';
            var ki = 0;
            var summa = 0;
            var kertoimet = [7, 3, 1];
            var oc = false;
            if (only_control) {
                oc = true;
            }

            num = number+'';
            for (var i = num.length; i > 0; i--) {
                summa += num.charAt(i - 1) * kertoimet[ki++ % 3];
            }
            
            ctrl = (10 - (summa % 10)) % 10;
            if (oc) {
                return ctrl;
            } else {
                return num + ctrl;
            }
        }
    }
    
    return referenceNumberCalculator;
}])
.factory('invoiceCsvWriter', ['$log', '$filter', 'globalParams', 'dbHandler', 'FileSaver', 'loadOverlay', 'CSV', 'referenceNumberCalculator', function($log, $filter, globalParams, dbHandler, FileSaver, loadOverlay, CSV, referenceNumberCalculator) {

    var invoiceCsvWriter = {
        run: function(outQry, p, f) {
			// input(query, paid(y/n), format(standard_csv/xl_csv)
            var outquery = {};
            outquery.entryinvoice = outQry;
            
            if (angular.isUndefined(p) || p === null) {
                paid = 'all';
            } else {
                paid = p;
            }
			if (angular.isUndefined(f) || f === null || f == 'standard_csv') {
                format = 'standard_csv';
            } else {
                format = 'xl_csv';
            }
            
            dbHandler
                .parse(false)
                .setQuery(outquery)
                .runQuery()
                .then(function(response) {
                    //console.log(JSON.stringify(response));
                    // entryInvoice/search tar emot "include": ["entry", "primaryAddress"]
                    var csv_options = {};
                    csv_options.header = ['Ref.nr.', 'Betalat', 'Fakturamall ID', 'ID', 'Typ', 'Namn', 'Förnamn', 'Efternamn', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land'];
                    csv_options.quoteStrings = "true";
                    csv_options.txtDelim = '"';
					csv_options.charset = "utf-8";
					if (format == 'xl_csv') {
						csv_options.fieldSep = ";";
						csv_options.addByteOrderMarker = "true";
					}

                    var ret = [];                                                            
                    angular.forEach(response.entryinvoice.data.items, function (value, key) {
                        if (paid == value.paid || paid == 'all') {
                            var row = {};
                            row.a = referenceNumberCalculator.calculate(value.id);
                            row.b = ((value.paid) ? 'Ja' : 'Nej');
                            row.c = value.invoice;
                            row.d = value.entry.id;
                            row.e = globalParams.static.types[value.entry.type];
                            if (value.entry.type == 'MEMBER_PERSON') {
                                row.f = '-';
                                row.g = value.entry.firstName;
                                row.h = value.entry.lastName;
                            } else {
                                row.f = value.entry.name;
                                row.g = '-';
                                row.h = '-';
                            }
                            row.i = ((value.entry.primaryAddress) ? value.entry.primaryAddress.street : null);
                            row.j = ((value.entry.primaryAddress && value.entry.primaryAddress.postalCode) ? ((format == 'xl_csv') ? '="' + value.entry.primaryAddress.postalCode + '"' : value.entry.primaryAddress.postalCode) : null),
                            row.k = ((value.entry.primaryAddress) ? value.entry.primaryAddress.town : null);
                            row.l = ((value.entry.primaryAddress) ? value.entry.primaryAddress.country : null);                        
                            ret.push(row);
                        }
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
        run: function(invoiceModelQry, invoiceesQry, p) {
            // p = all | true | false
            if (angular.isUndefined(p) || p === null) {
                paid = 'all';
            } else {
                paid = p;
            }
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

                                addpage = false;
                                
                                angular.forEach(invoicees, function (value, key) {
                                    if (paid == value.paid || paid == 'all') {
                                        var current = 0;
                                        
                                        invoicee = value.entry;
                                        
                                        document.fillColor('black');
                                        document.font('Helvetica');
                                        document.fontSize(15);
                                        current += margin;
                                        
                                        /*
                                        if (key != 0) {
                                            document.addPage();
                                        }
                                        */
                                        if ((key != 0 && addpage)) {
                                            document.addPage();
                                        }
                                        if (!addpage) {
                                            addpage = true;
                                        }
                                        
                                        
                                        document.text(invoicemodel.name, margin, current, {'width': fullwidth, 'height': row});    
                                        document.fontSize(12);
                                        document.moveTo(margin, row*5).lineTo(fullwidth+margin, row*5).stroke();
                                        current += row;
                                        current += row;
                                        
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
                                        if (invoicee_adr) {
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
                                        }

                                        current += row;
                                        current += row;
                                        document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                                        current += row;
                                        current += row;
                                        document.text(
                                            invoicemodel.message,
                                            margin, 
                                            current, 
                                            {'width':fullwidth, 'height': row * 18});
                                        current += row*18;
                                        
                                        document.fontSize(10);

                                        document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                                        current += row;
                                        document.text(invoicer.name, margin, current, {'width': halfpage, 'height': row});
                                        document.text("Telefon: " + ((invoicer_adr.phone) ? invoicer_adr.phone : '-'), col_2_1, current, {'width': halfpage, 'height': row});
                                        current += row;
                                        document.text("Mobil: " + ((invoicer_adr.mobile) ? invoicer_adr.mobile : '-'), col_2_1, current, {'width': halfpage, 'height': row});
                                        current += row;
                                        document.text( ((invoicer_adr.street) ? invoicer_adr.street : '-'), margin, current, {'width': halfpage, 'height': row});
                                        document.text("E-post: " + ((invoicer_adr.email) ? invoicer_adr.email : '-'), col_2_1, current, {'width': halfpage, 'height': row});
                                        current += row;
                                        document.text(((invoicer_adr.postalCode) ? invoicer_adr.postalCode : '') + ' ' + ((invoicer_adr.town) ? invoicer_adr.town : ''), margin, current, {'width': halfpage, 'height': row});
                                        
                                        current += row;
                                        document.moveTo(margin, current).lineTo(fullwidth+margin, current).stroke();
                                        
                                        // NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
                                        // H
                                        
                                        y = 20;
                                        
                                        document.dash(2);
                                        document.moveTo(25, 526+y).lineTo(573, 526+y).lineWidth(0.4).stroke();
                                        
                                        document.undash();
                                        document.moveTo(25, 567+y).lineTo(573, 567+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(25, 602+y).lineTo(310, 602+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(25, 693+y).lineTo(573, 693+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(96, 683+y).lineTo(310, 683+y).lineWidth(0.2).stroke();
                                        document.moveTo(25, 716+y).lineTo(573, 716+y).lineWidth(1.4).stroke();
                                        document.moveTo(310, 670+y).lineTo(573, 670+y).lineWidth(1.4).stroke();
                                        
                                        
                                        // V
                                        document.moveTo(84, 526+y).lineTo(84, 602+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(310, 526+y).lineTo(310, 716+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(359, 670+y).lineTo(359, 716+y).lineWidth(1.4).stroke();
                                        
                                        document.moveTo(445, 693+y).lineTo(445, 716+y).lineWidth(1.4).stroke();
                                        document.moveTo(84, 693+y).lineTo(84, 716+y).lineWidth(0.2).stroke();
                                        
                                        // Labels
                                        document.fontSize(7);
                                        document.text('IBAN', 90, 529+y); 
                                        document.text('Saajan', 30, 534+y, {'width': 51, 'align': 'right'});
                                        document.text('tilinumero', 30, 541+y, {'width': 51, 'align': 'right'});
                                        document.text('Mottagarens', 30, 548+y, {'width': 51, 'align': 'right'});
                                        document.text('kontonummer', 30, 555+y, {'width': 51, 'align': 'right'});
                                        
                                        document.text('Saaja', 30, 572+y, {'width': 51, 'align': 'right'});
                                        document.text('Mottagare', 30, 579+y, {'width': 51, 'align': 'right'});
                                        
                                        document.text('Maksajan', 30, 604+y, {'width': 51, 'align': 'right'});
                                        document.text('nimi ja', 30, 611+y, {'width': 51, 'align': 'right'});
                                        document.text('osoite', 30, 618+y, {'width': 51, 'align': 'right'});
                                        document.text('Betalarens', 30, 625+y, {'width': 51, 'align': 'right'});
                                        document.text('namn och', 30, 632+y, {'width': 51, 'align': 'right'});
                                        document.text('adress', 30, 639+y, {'width': 51, 'align': 'right'});
                                        
                                        document.text('Allekirjoitus', 30, 678+y, {'width': 51, 'align': 'right'});
                                        document.text('Underskrift', 30, 685+y, {'width': 51, 'align': 'right'});
                                        
                                        document.save();
                                        document.rotate(-90, {'origin': [30, 689+y]});
                                        document.font('Helvetica-Bold');
                                        document.text('TILISIIRTO. GIRERING', 35, 689+y, {'width': 88});
                                        document.font('Helvetica');
                                        document.restore();

                                        document.text('Tililtä nro', 30, 698+y, {'width': 51, 'align': 'right'});
                                        document.text('Från konto nr', 30, 705+y, {'width': 51, 'align': 'right'});
                                        
                                        document.text('BIC', 314, 529+y);
                                        document.text('Viitenumero', 314, 673+y, {'width': 51});
                                        document.text('Ref. nr', 314, 680+y, {'width': 51});
                                        
                                        document.text('Eräpäivä', 314, 696+y, {'width': 51});
                                        document.text('Förfallodag', 314, 703+y, {'width': 51});
                                        
                                        document.text('Euro', 449, 696+y, {'width': 51});
                                        
                                        document.fontSize(6);
                                        document.text('Maksu välitetään saajalle maksujenvälityksen ehtojen', 415, 724+y, {'width': 155});
                                        document.text('mukaisesti ja vain maksajan ilmoittaman tilinumeron', 415, 731+y, {'width': 155});
                                        document.text('perusteella.', 415, 738+y, {'width': 155});
                                        
                                        document.text('Betalningen förmedlas till mottagaren enligt villkoren', 415, 745+y, {'width': 155});
                                        document.text('för betalningsförmedling och endast till det', 415, 752+y, {'width': 155});
                                        document.text('kontonummer som betalaren angivit.', 415, 759+y, {'width': 155});
                                        
                                        document.fontSize(10);
                                        
                                        document.text(invoicemodel.bankAccount, 90, 537+y, {'width': 220, 'height': 27});
                                        document.text(invoicemodel.bank, 314, 537+y, {'width': 258, 'height': 27});
                                        
                                        document.text(invoicer.name, 90, 572+y, {'width': 220, 'height': 27});
                                        

                                        if (invoicee_adr) {
                                            if (Object.keys(invoicee_adr).length) {
                                                if (invoicee.type == 'MEMBER_PERSON') {
                                                    document.text(invoicee.firstName + ' ' + invoicee.lastName, 90, 607+y, {'width': 220});
                                                } else {    
                                                    document.text(invoicee.name, 90, 607+y, {'width': 220});
                                                }
                                                if (invoicee_adr.street) {
                                                    document.text(invoicee_adr.street, 90, 619+y, {'width': 220});
                                                }
                                                if (invoicee_adr.postalCode && invoicee_adr.town) {
                                                    document.text(invoicee_adr.postalCode + ' ' + invoicee_adr.town, 90, 631+y, {'width': 220});
                                                    
                                                }
                                                if (invoicee_adr.country) {
                                                    document.text(invoicee_adr.country, 90, 643+y, {'width': 220});
                                                }
                                            }
                                        } else {
                                            if (invoicee.type == 'MEMBER_PERSON') {
                                                document.text(invoicee.firstName + ' ' + invoicee.lastName, 90, 607+y, {'width': 220});
                                            } else {    
                                                document.text(invoicee.name, 90, 607+y, {'width': 220});
                                            }
                                        }
                                        
                                        document.text(invoicemodel.description, 319, 572+y, {'width': 258, 'height': 95});
                                        
                                        document.text(referenceNumberCalculator.calculate(value.id), 363, 679+y, {'width': 258, 'height': 15});
                                        
                                        document.text($filter('date')(new Date(invoicemodel.dueAt), "d.M.yyyy"), 363, 703+y, {'width': 106, 'height': 15});
                                        
                                        document.text(invoicemodel.amount, 465, 703+y, {'width': 106, 'height': 15});
                                        
                                    }
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